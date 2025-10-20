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
// Prevent server crash on WebSocket errors
process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', JSON.stringify(err));
  if (err.code === 'ENOTFOUND') {
    console.log('DNS resolution failed, exiting to retry...');
    process.exit(1);
  }
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Optionally, add error handler to WebSocket instances if you create any directly
// Example:
// const socket = new ws(...);
// socket.on('error', err => console.error('WebSocket error:', err));

// Bot config
const appId = 'pockit.world'
const roomId = 'my-room-id'

const serverDB = new ServerDB();

// @ts-expect-error polyfill types
const room = joinRoom({ appId, rtcPolyfill: RTCPeerConnection }, roomId)

const [sendState, getState] = room.makeAction('peerState')
const [sendChat, getChat] = room.makeAction('chat')


// Simple storage
var verifiedPeers = new Map<string, string>() // peerId -> wallet
var chatLogs: Array<{ from: string, message: string, timestamp: number }> = []

// Server identity (used to sign outbound messages)
// Priority: pockit.key file (project root) -> SERVER_PRIVATE_KEY env var -> generate new
const KEY_FILE = path.resolve(process.cwd(), 'pockit.key')
let SERVER_PRIVATE_KEY: string | undefined = undefined
try {
  if (fs.existsSync(KEY_FILE)) {
    const raw = fs.readFileSync(KEY_FILE, 'utf8').trim()
    // accept with or without 0x prefix
    SERVER_PRIVATE_KEY = raw.startsWith('0x') ? raw : `0x${raw}`
    // basic validation: 0x + 64 hex chars
    if (!/^0x[a-fA-F0-9]{64}$/.test(SERVER_PRIVATE_KEY)) {
      console.warn('[Server] pockit.key present but invalid; it will be replaced')
      SERVER_PRIVATE_KEY = undefined
    }
  }
} catch (err) {
  console.error('[Server] Error reading pockit.key:', err)
  SERVER_PRIVATE_KEY = undefined
}

if (!SERVER_PRIVATE_KEY) {
  if (process.env.SERVER_PRIVATE_KEY) {
    SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as string
  } else {
    SERVER_PRIVATE_KEY = generatePrivateKey()
  }
  // persist generated/used key to file for next runs
  try {
    fs.writeFileSync(KEY_FILE, SERVER_PRIVATE_KEY, { mode: 0o600 })
    console.log(`[Server] Server private key written to ${KEY_FILE}`)
  } catch (err) {
    console.error('[Server] Failed to write pockit.key:', err)
  }
}

const SERVER_ACCOUNT = privateKeyToAccount(SERVER_PRIVATE_KEY as `0x${string}`)
const SERVER_ADDRESS = SERVER_ACCOUNT.address

console.log(`[Server] Server wallet address: ${SERVER_ADDRESS}`)
// compressed public key (0x...)
function getCompressedPublicKey(privateKeyHex: `0x${string}`): string {
  const priv = Buffer.from(privateKeyHex.slice(2), 'hex')
  const pub = secp.getPublicKey(priv, true)
  return `0x${Buffer.from(pub).toString('hex')}`
}
const SERVER_PUBLIC_KEY = getCompressedPublicKey(SERVER_PRIVATE_KEY as `0x${string}`)

// Canonicalize an object to a stable JSON string (sorts keys)
function canonicalize(obj: Record<string, any>) {
  const keys = Object.keys(obj).sort()
  const out: Record<string, any> = {}
  for (const k of keys) out[k] = obj[k]
  return JSON.stringify(out)
}

function addMessageToLog(from: string, message: string) {
  chatLogs.push({ from, message, timestamp: Date.now() })
  if (chatLogs.length > 40) {
    chatLogs = chatLogs.slice(-20)
  }
}

function isVerified(peerId: string): boolean {
  return verifiedPeers.has(peerId)
}

function getWallet(peerId: string): string | undefined {
  return verifiedPeers.get(peerId)
}

room.onPeerJoin(async (peerId) => {
  console.log(`[Server] Peer joined: ${peerId}`)
  // send signed server profile state to new peer
  const serverProfile = { name: 'PockitCEO', walletAddress: SERVER_ADDRESS, publicKey: SERVER_PUBLIC_KEY }
  const canonical = canonicalize(serverProfile)
  const signature = await SERVER_ACCOUNT.signMessage({ message: canonical })
  sendState({ profile: serverProfile, signature }, peerId)
  sendChat(`Welcome to crusty burger, this is Patrick. Waddle around and make new friends ${peerId}! Type /help for commands.`, peerId)
})

room.onPeerLeave((peerId) => {
  console.log(`Peer left: ${peerId}`)
  verifiedPeers.delete(peerId)
  // Note: cheese data persists by wallet address, not peer ID
})

getState((data: DataPayload, peerId) => {
  // Handle state updates for each peer - this is where users register
  console.log(`[Server] State updated for ${peerId}:`, data)
  if (data && typeof data === 'object' && !Array.isArray(data) && 'profile' in data) {
    const profile = (data as any).profile
    const signature = (data as any).signature
    if (profile && typeof profile === 'object' && !Array.isArray(profile) && 'walletAddress' in profile && typeof (profile as any).walletAddress === 'string') {
      const walletAddress = (profile as any).walletAddress

      // Validate wallet address format
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        sendChat(`Invalid wallet address.`, peerId)
        return
      }

      // If a signature is present, verify it. If not, reject the profile.
      if (!signature || typeof signature !== 'string') {
        sendChat(`Unlock your wallet to verify your profile.`, peerId)
        return
      }

      try {
        // canonicalize profile before verifying
        const canonical = canonicalize(profile)
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

      // Passed verification - register
      // persist profile to DB (name, avatarUrl, bio are optional fields on the profile object)
      try {
        serverDB.saveProfile(
          walletAddress,
          (profile as any).name || '',
          (profile as any).avatarUrl || '',
          (profile as any).bio || ''
        );
      } catch (err) {
        console.error('Error saving profile to DB', err)
      }

      // track verified peer -> wallet mapping
      verifiedPeers.set(peerId, walletAddress)

      console.log(`[Server] User ${peerId} verified with wallet ${walletAddress}`)
      sendChat(`Welcome ${profile.name || 'Anonymous'}! You're verified.`, peerId)
    }
  }
})

// Echo back any chat messages received
getChat((message, peerId) => {
  if (typeof message === 'string') {
    // Use wallet address or name for persistent chat identity
    let chatFrom = peerId; // fallback to peerId for unverified users
    if (isVerified(peerId)) {
      const wallet = getWallet(peerId)!;
      const profile = serverDB.getProfile(wallet);
      chatFrom = profile?.name || wallet.slice(0, 8) + '...';
    }
    
    addMessageToLog(chatFrom, message)
    // Don't echo commands or events
    if (message.startsWith('/')) {
      handleCommand(message, peerId)
      return
    }
    // Echo the message back to sender
    // sendChat(`*mockingly* ${message}`, peerId)
    // sendChat(`${peerId} said ${message}`)
  }
})

const handleCommand = (message: string, peerId: string) => {
  const [command, ...args] = message.split(' ')

  // Simple verification check
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
    // persist claim to DB
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

// Graceful shutdown: close DB when process exits
function shutdown(code = 0) {
  try {
    serverDB.close();
  } catch (err) {
    console.error('Error during shutdown', err);
  }
  process.exit(code);
}

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down...');
  shutdown(0);
});
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down...');
  shutdown(0);
});
process.on('beforeExit', (code) => {
  console.log('[Server] Process beforeExit, closing DB...');
  try { serverDB.close(); } catch (err) { /* ignore */ }
});
