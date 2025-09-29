// server can be written to via post endpoint or via chat in trystero
// server can respond to chat messages with points or profile by pubkey

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

const [sendChat, getChat] = room.makeAction('chat')


// Echo back any chat messages received
getChat((message, peerId) => {
  if (typeof message === 'string') {
    // Don't echo commands or events
    if (message.startsWith('/')) return
    // Echo the message back to sender
    sendChat(`*mockingly* ${message}`, peerId)
    sendChat(`${peerId} said ${message}`)
  }
})