// server can be written to via post endpoint or via chat in trystero
// server can respond to chat messages with points or profile by pubkey

import './polyfill.js';

import { DataPayload, joinRoom } from 'trystero'
import { RTCPeerConnection } from 'node-datachannel/polyfill'
import ws from 'ws';
global.WebSocket = ws as unknown as typeof WebSocket;
// Prevent server crash on WebSocket errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
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


// @ts-expect-error polyfill types
const room = joinRoom({ appId, rtcPolyfill: RTCPeerConnection }, roomId)

const [sendState, getState] = room.makeAction('peerState')
const [sendChat, getChat] = room.makeAction('chat')


// Simple storage
var profileDB = new Map<string, any>() // wallet -> profile
var verifiedPeers = new Map<string, string>() // peerId -> wallet
var cheeseByWallet: Record<string, { lastClaim: number, amount: number }> = {}
var chatLogs: Array<{ from: string, message: string, timestamp: number }> = []

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

room.onPeerJoin((peerId) => {
  console.log(`Peer joined: ${peerId}`)
  sendState({profile: {name: 'PockitCEO', walletAddress: '0xPOCKIT'}}, peerId)
  sendChat(`Welcome to crusty burger, this is Patrick. Waddle around and make new friends ${peerId}! Type /help for commands.`, peerId)
})

room.onPeerLeave((peerId) => {
  console.log(`Peer left: ${peerId}`)
  verifiedPeers.delete(peerId)
  // Note: cheese data persists by wallet address, not peer ID
})

getState((data: DataPayload, peerId) => {
  // Handle state updates for each peer - this is where users register
  console.log(`State updated for ${peerId}:`, data)
  if (data && typeof data === 'object' && !Array.isArray(data) && 'profile' in data) {
    const profile = (data as any).profile
    if (profile && typeof profile === 'object' && !Array.isArray(profile) && 'walletAddress' in profile && typeof (profile as any).walletAddress === 'string') {
      const walletAddress = (profile as any).walletAddress
      
      // Simple validation and registration
      if (walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        profileDB.set(walletAddress, profile)
        verifiedPeers.set(peerId, walletAddress)
        
        console.log(`User ${peerId} verified with wallet ${walletAddress}`)
        sendChat(`Welcome ${profile.name || 'Anonymous'}! You're verified.`, peerId)
      } else {
        sendChat(`Invalid wallet address.`, peerId)
      }
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
      const profile = profileDB.get(wallet);
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
  const profile = profileDB.get(wallet)
  
  if (command === '/claim') {
    const record = cheeseByWallet[wallet] || { lastClaim: 0, amount: 0 }
    const now = Date.now()
    if (now - record.lastClaim < 3600000) {
      const mins = Math.ceil((3600000 - (now - record.lastClaim)) / 60000)
      sendChat(`Wait ${mins} more minutes to claim.`, peerId)
      return
    }
    record.lastClaim = now
    record.amount += 1
    cheeseByWallet[wallet] = record
    sendChat(`Claimed! Total cheese: ${record.amount}`, peerId)
    
  } else if (command === '/cheese') {
    const amount = cheeseByWallet[wallet]?.amount || 0
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
      const p = profileDB.get(wallet)
      const name = p?.name || 'Anonymous'
      return `${name} (${wallet.slice(0, 6)}...)`
    }).join('\n')
    sendChat(`Online users:\n${users}`, peerId)
    
  } else {
    sendChat(`Commands: /claim /cheese /profile /users /history`, peerId)
  }
}

console.log('🚀 Pockit.world server started!')
console.log(`Users: ${verifiedPeers.size}, Profiles: ${profileDB.size}`)