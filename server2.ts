// server can be written to via post endpoint or via chat in trystero
// server can respond to chat messages with points or profile by pubkey

import './polyfill.js';

import { joinRoom } from 'trystero'
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

var chatLogs: Array<{ from: string, message: string, timestamp: number }> = []

// todo store this in postgres
var pointsByWallet: Record<`0x${string}`, number> = {}
var profileByWallet: Record<`0x${string}`, any> = {}

// users can claim cheese every hour
var cheeseById: Record<string, { lastClaim: number, amount: number }> = {}

const [sendChat, getChat] = room.makeAction('chat')


// Echo back any chat messages received
getChat((message, peerId) => {
  if (typeof message === 'string') {
    // Don't echo commands or events
    if (message.startsWith('/')) {
      handleCommand(message, peerId)
      return
    }
    // Echo the message back to sender
    sendChat(`*mockingly* ${message}`, peerId)
    sendChat(`${peerId} said ${message}`)
  }
})

const handleCommand = (message: string, peerId: string) => {
  const parts = message.split(' ')
  const command = parts[0]
  const args = parts.slice(1)
  
  if (command === '/claim') {
    const userId = peerId // In a real app, map peerId to a user ID
    const now = Date.now()
    const record = cheeseById[userId] || { lastClaim: 0, amount: 0 }
    if (now - record.lastClaim < 3600000) { // 1 hour cooldown
      const minutesLeft = Math.ceil((3600000 - (now - record.lastClaim)) / 60000)
      sendChat(`You can claim cheese again in ${minutesLeft} minutes.`, peerId)
      return
    }
    record.lastClaim = now
    record.amount += 1
    cheeseById[userId] = record
    sendChat(`You have claimed cheese! Total cheese: ${record.amount}`, peerId)
  } else if (command === '/cheese') {
    const userId = peerId
    const record = cheeseById[userId]
    const amount = record ? record.amount : 0
    sendChat(`You have ${amount} cheese.`, peerId)
  } else {
    sendChat(`Available commands:
/claim - Claim cheese (1 hour cooldown) \n
/cheese - Check your cheese balance \n
/help - Show this help message \n`, peerId)
  }
}
