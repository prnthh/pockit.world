import { joinRoom } from 'trystero'
import { RTCPeerConnection } from 'node-datachannel/polyfill'
import ws from 'ws';
import crypto from 'crypto';
globalThis.crypto = crypto.webcrypto as unknown as Crypto;
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
const botPositions = [
    [-1, 0, 0.5],
    [-2, 0, 2],
    [-4, 0, 2],
    [-5, 0, 0]
]

// @ts-expect-error polyfill types
const room = joinRoom({ appId, rtcPolyfill: RTCPeerConnection }, roomId)

// Bot state
let myState = {
  position: botPositions[0],
  appearance: { bot: true }
}

// Setup peerState action
const [sendPlayerState, getPeerStates] = room.makeAction('peerState')
const peerStatesMap: Record<string, any> = {};
// Setup chat action
const [sendChat, getChat] = room.makeAction('chat')

// Send bot's state to all peers on join
room.onPeerJoin(peerId => {
  peerList.push(peerId);
  // If there are peers, pick one to follow
  if (peerList.length > 0) {
    followTarget = peerList[Math.floor(Math.random() * peerList.length)];
    npcGoal = 'follow';
  }
  // Greet the new peer
  sendChat(`Hello, traveler!`, peerId);
  // Send bot's full state to the joining peer
  sendPlayerState(myState, peerId);
});

room.onPeerLeave(peerId => {
  peerList = peerList.filter(id => id !== peerId);
  // If no peers left, go idle/wander
  if (peerList.length === 0) {
    npcGoal = 'idle';
    followTarget = null;
  } else {
    // Pick a new follow target if needed
    followTarget = peerList[Math.floor(Math.random() * peerList.length)];
    npcGoal = 'follow';
  }
});

// Respond to peerState requests (optional, for completeness)
getPeerStates((state: any, peerId: string) => {
  peerStatesMap[peerId] = state;
});

// Echo back any chat messages received
getChat((message, peerId) => {
  if (typeof message === 'string') {
    // Don't echo commands or events
    if (message.startsWith('/')) return
    // Echo the message back to sender
    sendChat(`*mockingly* ${message}`, peerId)
  }
})

// Announce bot presence
setTimeout(() => {
  sendChat('Bot is online!')
  sendPlayerState(myState)
}, 1000)


// NPC internal state
let npcGoal: 'follow' | 'idle' = 'idle';
let peerList: string[] = [];
let followTarget: string | null = null;

// NPC loop of consciousness
function npcConsciousnessLoop() {
  if (npcGoal === 'follow' && followTarget) {
    // Use stored peer state
    const targetState = peerStatesMap[followTarget];
    if (targetState && Array.isArray(targetState.position)) {
      // Move bot towards the target position (simple follow)
      myState.position = targetState.position;
      sendPlayerState(myState);
      // Say something each time bot follows
      const followMessages = [
        "stop ignoring me",
        "im a real person",
        "hey, pay attention to me!",
        "don't walk away!"
      ];
      const msg = followMessages[Math.floor(Math.random() * followMessages.length)];
      sendChat(msg, followTarget);
    }
  } else if (npcGoal === 'idle') {
    // Idle: do nothing
  }
}

// Tick every 5 seconds
setInterval(npcConsciousnessLoop, 5000)

// Removed setNpcBusy and busy logic since 'wander' and 'busy' are no longer used