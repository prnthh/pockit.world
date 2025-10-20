// server can be written to via post endpoint or via chat in trystero
// server can respond to chat messages with points or profile by pubkey

import './polyfill.js';

import { DataPayload, joinRoom } from 'trystero'
import { RTCPeerConnection } from 'node-datachannel/polyfill'
import ws from 'ws';
global.WebSocket = ws as unknown as typeof WebSocket;
import { verifyMessage } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import fs from 'fs'
import path from 'path'
import * as secp from '@noble/secp256k1'
import ServerDB from './serverdb.js';

// --- Safety: catch top-level errors to avoid crashing the host
process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', JSON.stringify(err));
  if (err && err.code === 'ENOTFOUND') {
    console.log('DNS resolution failed, exiting to retry...');
    process.exit(1);
  }
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// --- Config
const APP_ID = 'pockit.world'
const ROOM_ID = 'my-room-id'
const KEY_FILE = path.resolve(process.cwd(), 'pockit.key')

// --- Types
type ChatLog = { from: string; message: string; timestamp: number }

// --- Dependencies / state
const serverDB = new ServerDB()

// @ts-expect-error rtc polyfill types
const room = joinRoom({ appId: APP_ID, rtcPolyfill: RTCPeerConnection }, ROOM_ID)
const [sendState, getState] = room.makeAction('peerState')
const [sendChat, getChat] = room.makeAction('chat')

const verifiedPeers = new Map<string, string>() // peerId -> wallet
let chatLogs: ChatLog[] = []

// --- Helpers: key management and signing
function readPrivateKeyFromFile(filePath: string): string | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined
    const raw = fs.readFileSync(filePath, 'utf8').trim()
    return raw.startsWith('0x') ? raw : `0x${raw}`
  } catch (err) {
    console.error('[Server] Error reading key file:', err)
    return undefined
  }
}

function writePrivateKeyToFile(filePath: string, key: string) {
  try {
    fs.writeFileSync(filePath, key, { mode: 0o600 })
    console.log(`[Server] Server private key written to ${filePath}`)
  } catch (err) {
    console.error('[Server] Failed to write pockit.key:', err)
  }
}

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined
  const k = raw.startsWith('0x') ? raw : `0x${raw}`
  return /^0x[a-fA-F0-9]{64}$/.test(k) ? k : undefined
}

function getCompressedPublicKey(privateKeyHex: `0x${string}`): string {
  const priv = Buffer.from(privateKeyHex.slice(2), 'hex')
  const pub = secp.getPublicKey(priv, true)
  return `0x${Buffer.from(pub).toString('hex')}`
}

// canonicalize for deterministic signing
function canonicalize(obj: Record<string, any>) {
  const keys = Object.keys(obj).sort()
  const out: Record<string, any> = {}
  for (const k of keys) out[k] = obj[k]
  return JSON.stringify(out)
}

// --- Initialize server identity
let SERVER_PRIVATE_KEY = normalizePrivateKey(readPrivateKeyFromFile(KEY_FILE))
if (!SERVER_PRIVATE_KEY) {
  SERVER_PRIVATE_KEY = normalizePrivateKey(process.env.SERVER_PRIVATE_KEY) || generatePrivateKey()
  writePrivateKeyToFile(KEY_FILE, SERVER_PRIVATE_KEY)
}

const SERVER_ACCOUNT = privateKeyToAccount(SERVER_PRIVATE_KEY as `0x${string}`)
const SERVER_ADDRESS = SERVER_ACCOUNT.address
const SERVER_PUBLIC_KEY = getCompressedPublicKey(SERVER_PRIVATE_KEY as `0x${string}`)

console.log(`[Server] Server wallet address: ${SERVER_ADDRESS}`)

// --- Chat & verification helpers
function addMessageToLog(from: string, message: string) {
  chatLogs.push({ from, message, timestamp: Date.now() })
  if (chatLogs.length > 40) chatLogs = chatLogs.slice(-20)
}

function isVerified(peerId: string) {
  return verifiedPeers.has(peerId)
}

function getWallet(peerId: string) {
  return verifiedPeers.get(peerId)
}

async function sendServerProfileTo(peerId: string) {
  const serverProfile = { name: 'PockitCEO', walletAddress: SERVER_ADDRESS, publicKey: SERVER_PUBLIC_KEY }
  const canonical = canonicalize(serverProfile)
  const signature = await SERVER_ACCOUNT.signMessage({ message: canonical })
  sendState({ profile: serverProfile, signature }, peerId)
  sendChat(`Welcome to crusty burger, this is Patrick. Waddle around and make new friends ${peerId}! Type /help for commands.`, peerId)
}

// --- Handlers
room.onPeerJoin(async (peerId) => {
  console.log(`[Server] Peer joined: ${peerId}`)
  try {
    await sendServerProfileTo(peerId)
  } catch (err) {
    console.error('[Server] Failed to send server profile to', peerId, err)
  }
})

room.onPeerLeave((peerId) => {
  console.log(`[Server] Peer left: ${peerId}`)
  verifiedPeers.delete(peerId)
})

getState((data: DataPayload, peerId) => {
  console.log(`[Server] State updated for ${peerId}:`, data)
  if (!data || typeof data !== 'object' || Array.isArray(data)) return
  const maybeProfile = (data as any).profile
  const signature = (data as any).signature
  if (!maybeProfile || typeof maybeProfile !== 'object') return

  const walletAddress = maybeProfile.walletAddress
  if (typeof walletAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    sendChat(`Invalid wallet address.`, peerId)
    return
  }

  if (!signature || typeof signature !== 'string') {
    sendChat(`Unlock your wallet to verify your profile.`, peerId)
    return
  }

  try {
    const canonical = canonicalize(maybeProfile)
    const valid = verifyMessage({ address: walletAddress as `0x${string}`, message: canonical, signature: signature as `0x${string}` })
    if (!valid) {
      sendChat(`Signature verification failed.`, peerId)
      return
    }
  } catch (err) {
    console.error('Verification error', err)
    sendChat(`Signature verification error.`, peerId)
    return
  }

  // persist profile and map peer->wallet
  try {
    serverDB.saveProfile(walletAddress, maybeProfile.name || '', maybeProfile.avatarUrl || '', maybeProfile.bio || '')
  } catch (err) {
    console.error('Error saving profile to DB', err)
  }
  verifiedPeers.set(peerId, walletAddress)
  console.log(`[Server] User ${peerId} verified with wallet ${walletAddress}`)
  sendChat(`Welcome ${maybeProfile.name || 'Anonymous'}! You're verified.`, peerId)
})

getChat((message, peerId) => {
  if (typeof message !== 'string') return
  let chatFrom = peerId
  if (isVerified(peerId)) {
    const wallet = getWallet(peerId)!
    const profile = serverDB.getProfile(wallet)
    chatFrom = profile?.name || wallet.slice(0, 8) + '...'
  }
  addMessageToLog(chatFrom, message)
  if (message.startsWith('/')) {
    handleCommand(message, peerId)
    return
  }
  // raw messages are currently only logged; echoing is disabled by design
})

function handleCommand(message: string, peerId: string) {
  const [command] = message.split(' ')
  if (!isVerified(peerId)) {
    sendChat(`You must be verified first! Set up a pin in your profile.`, peerId)
    return
  }
  const wallet = getWallet(peerId)!
  const profile = serverDB.getProfile(wallet)

  if (command === '/claim') {
    const now = Date.now()
    const row = serverDB.getCheese(wallet)
    const lastClaim = row?.lastClaim || 0
    const amount = row?.amount || 0
    if (now - lastClaim < 3600000) {
      const mins = Math.ceil((3600000 - (now - lastClaim)) / 60000)
      sendChat(`Wait ${mins} more minutes to claim.`, peerId)
      return
    }
    serverDB.claimCheese(wallet, 1)
    const newRow = serverDB.getCheese(wallet)
    sendChat(`Claimed! Total cheese: ${newRow?.amount || amount + 1}`, peerId)

  } else if (command === '/cheese') {
    const row = serverDB.getCheese(wallet)
    const amount = row?.amount || 0
    sendChat(`You have ${amount} cheese.`, peerId)

  } else if (command === '/profile') {
    sendChat(`Profile: ${JSON.stringify(profile)}`, peerId)

  } else if (command === '/history') {
    const history = chatLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `[${time}] ${log.from}: ${log.message}`
    }).join('\n')
    sendChat(`History:\n${history}`, peerId)

  } else if (command === '/users') {
    const users = Array.from(verifiedPeers.values()).map(wallet => {
      const p = serverDB.getProfile(wallet)
      const name = p?.name || 'Anonymous'
      return `${name} (${wallet.slice(0, 6)}...)`
    }).join('\n')
    sendChat(`Online users:\n${users}`, peerId)

  } else {
    sendChat(`Commands: /claim /cheese /profile /users /history`, peerId)
  }
}

console.log('[Server] 🚀 Pockit.world server started!')
console.log(`[Server] Users: ${verifiedPeers.size}, Profiles: ${serverDB.getProfilesCount()}`)

// --- Shutdown helpers
function shutdown(code = 0) {
  try { serverDB.close() } catch (err) { console.error('Error during shutdown', err) }
  process.exit(code)
}

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down...')
  shutdown(0)
})
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down...')
  shutdown(0)
})
process.on('beforeExit', (code) => {
  console.log('[Server] Process beforeExit, closing DB...')
  try { serverDB.close() } catch (err) { /* ignore */ }
})
