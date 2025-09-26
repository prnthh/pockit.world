
import { joinRoom } from 'trystero'
import { useEffect, useState, useRef, createContext } from 'react'
import PeerList from './PeerList'

export type PeerState = {
  position: [number, number, number],
  appearance: { [key: string]: any },
  latestMessage?: { message: string, timestamp: number }
}
export const MPContext = createContext<{ peerStates: Record<string, PeerState> }>({ peerStates: {} })

export default function MP({ appId = 'pockit.world', roomId, ui, children }: { appId?: string, roomId: string, ui: any, children: React.ReactNode }) {
  // Ref for chat message list
  const chatListRef = useRef<HTMLDivElement>(null)
  // Suppress 'User-Initiated Abort' RTC errors in the console
  const origConsoleError = console.error
  console.error = function (...args) {
    if (
      args[0]?.error?.name === 'OperationError' &&
      args[0]?.error?.message?.includes('User-Initiated Abort')
    ) {
      // Suppress this error
      return
    }
    origConsoleError.apply(console, args)
  }
  const room = joinRoom({ appId, password: undefined }, roomId)
  const [sendPlayerState, getPeerStates] = room.makeAction('peerState')
  const [myState, setMyState] = useState<{ position: [number, number, number], appearance: { [key: string]: any } }>({ position: [0, 0, 0], appearance: {} })
  const [peerStates, setPeerStates] = useState<Record<string, PeerState>>({})

  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ peer: string, message: string }>>([])
  const [sendChat, getChat] = room.makeAction('chat')

  // Listen for incoming chat messages
  useEffect(() => {
    getChat((message, peer) => {
      if (typeof message === 'string') {
        if (message.startsWith('/')) {
          const command = message.slice(1).trim().split(' ')[0]
          if (command === 'event') {
            if (peer == roomId) return; // Ignore events from the same room
            const eventData = message.slice(7).trim()
            // Handle room events
            window.dispatchEvent(new CustomEvent('mp-event', { detail: JSON.parse(eventData) }))
            return
          }
        }
        setChatMessages(msgs => [...msgs, { peer, message }])
        // Update peerStates with latest message and timestamp
        setPeerStates(states => {
          if (!peer) return states;
          const now = Date.now();
          return {
            ...states,
            [peer]: {
              ...states[peer],
              latestMessage: { message, timestamp: now }
            }
          }
        })
      }
    })
  }, [])

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages])


  // Setup Trystero event listeners for peer join/leave and state updates
  useEffect(() => {
    const handlePeerJoin = (peer: string) => {
      sendPlayerState(myState, peer)
    }
    const handlePeerLeave = (peer: string) => {
      setPeerStates(states => {
        const newStates = { ...states }
        delete newStates[peer]
        return newStates
      })
    }
    const handlePeerState = (state: any, peer: string) => {
      if (
        state &&
        Array.isArray(state.position) &&
        state.position.length === 3 &&
        state.position.every((n: any) => typeof n === 'number') &&
        typeof state.appearance === 'object'
      ) {
        setPeerStates(states => {
          const prev = states[peer] || {};
          return {
            ...states,
            [peer]: {
              ...prev,
              ...state,
            }
          }
        })
      }
    }
    room.onPeerJoin(handlePeerJoin)
    room.onPeerLeave(handlePeerLeave)
    getPeerStates(handlePeerState)
    // Cleanup: Trystero does not provide off/on removal, but if it did, add here
    // Return cleanup if needed
    // return () => { ... }
  }, [room, sendPlayerState, getPeerStates, myState])

  // Listen for local position updates from parent
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const pos = e.detail as [number, number, number]
      setMyState(state => ({ ...state, position: pos }))
      sendPlayerState({ ...myState, position: pos })
    }
    window.addEventListener('mp-pos', handler as EventListener)
    return () => window.removeEventListener('mp-pos', handler as EventListener)
  }, [myState])

  // Listen for room events from parent, room is stateless
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      sendChat(`/event ${JSON.stringify(e.detail)}`)
    }
    window.addEventListener('mp-trigger', handler as EventListener)
    return () => window.removeEventListener('mp-trigger', handler as EventListener)
  }, [])

  return (
    <MPContext.Provider value={{ peerStates }}>
      {children}
      <ui.In>
        <div className="absolute bottom-6 right-6 z-[10] pointer-events-auto flex flex-col max-h-[20vh] h-[240px]">
          <div
            className="flex flex-row items-center rounded-[2.2rem] text-black shadow-lg bg-gradient-to-br from-[#2229] to-[#2226] p-4 min-w-[320px] max-w-[400px] h-full relative overflow-hidden font-sans border-2 border-[#8cf8]"
            style={{
              backdropFilter: 'blur(16px)',
              borderRadius: '2.2rem',
              boxShadow: '0 2px 32px 0 #8cf8, 0 0 0 6px #e0f7fa22 inset',
            }}
          >
            {/* Pager screen with glass effect, simplified */}
            <div
              className="rounded-2xl border w-[200px] min-h-[100px] h-full flex-1 mr-3 flex flex-col justify-end relative px-2 pt-1 pb-1"
              style={{
                background: '#b2d8b2', // muted green
                boxShadow: 'inset 0 0 16px 2px #145214',
              }}
            >
              {/* LCD display area */}
              <div
                ref={chatListRef}
                className="h-full overflow-y-auto text-[13px] mb-1 font-mono"
                style={{
                  padding: '2px 0',
                }}
              >
                {chatMessages.map((msg, i) => (
                  <div key={i} className="mb-0.5">
                    <span className="text-[#1976d2] font-bold">{msg.peer.slice(0, 8)}</span>
                    <span>: {msg.message}</span>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    sendChat(chatInput)
                    setChatMessages(msgs => [...msgs, { peer: 'me', message: chatInput }])
                    setChatInput('')
                  }
                }}
                placeholder="Type a message..."
                className="w-full px-2 py-1 rounded outline-none text-[13px] mt-1 font-mono"
              />
            </div>
            {/* Pager buttons and PeerList, simplified */}
            <div className="flex flex-col items-center justify-end min-w-[80px] text-white">
              <button
                onClick={() => {
                  setMyState(state => {
                    const newState = {
                      ...state,
                      appearance: {
                        ...state.appearance,
                        hand: !state.appearance.hand
                      }
                    }
                    sendPlayerState(newState)
                    return newState
                  })
                }}
                className="text-[12px] px-3 py-1 rounded bg-gradient-to-r from-[#1976d2] to-[#8cf] font-bold border shadow mb-2 mt-1 cursor-pointer"
                style={{
                  boxShadow: '0 2px 8px 0 #8cf8',
                  textShadow: '0 1px 2px #2228',
                }}
              >
                {myState.appearance.hand ? 'Hide Hand' : 'Show Hand'}
              </button>
              <div className="mb-2">
                <PeerList
                  peerStates={peerStates}
                  room={room}
                  sendChat={sendChat}
                />
              </div>
              {/* Pager nav buttons, simplified */}
              <div className="flex flex-row gap-2 mt-1">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1976d2] to-[#8cf] border shadow flex items-center justify-center font-bold text-[13px]"
                    style={{
                      boxShadow: '0 1px 4px 0 #8cf8',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              {/* Pager logo, simplified */}
              <div className="text-[10px] text-[#8cf] font-bold mt-2 tracking-widest" style={{ textShadow: '0 1px 4px #fff8' }}>
                <span className="text-[#1976d2] font-bold" style={{ textShadow: '0 1px 8px #8cf8' }}>POCKIT</span> NAVI
              </div>
            </div>
            {/* Glossy overlays for depth, keep outer shell shine */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-[2.2rem] bg-gradient-to-tr from-white/40 via-white/0 to-white/20 opacity-70 z-10 mix-blend-screen" />
          </div>
        </div>
      </ui.In>
    </MPContext.Provider>
  )
}

// export const useRoom = (roomConfig: BaseRoomConfig, roomId: string) => {
//   const roomRef = useRef(joinRoom(roomConfig, roomId))
//   const lastRoomIdRef = useRef(roomId)

//   useEffect(() => {
//     if (roomId !== lastRoomIdRef.current) {
//       roomRef.current.leave()
//       roomRef.current = joinRoom(roomConfig, roomId)
//       lastRoomIdRef.current = roomId
//     }

//     return () => {
//       roomRef.current.leave()
//     }
//   }, [roomConfig, roomId])

//   return roomRef.current
// }


// server side

// import {joinRoom} from 'trystero'
// import {RTCPeerConnection} from 'node-datachannel/polyfill'

// const room = joinRoom(
//   {appId: 'your-app-id', rtcPolyfill: RTCPeerConnection},
//   'your-room-name'
// )