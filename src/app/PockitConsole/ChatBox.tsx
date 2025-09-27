import { useEffect, useRef } from "react"

export default function ChatBox({ chatMessages, chatInput, setChatInput, sendChat, setChatMessages }: {
    chatMessages: Array<{ peer: string, message: string }>,
    chatInput: string,
    setChatInput: React.Dispatch<React.SetStateAction<string>>,
    sendChat: (msg: string) => void,
    setChatMessages: React.Dispatch<React.SetStateAction<Array<{ peer: string, message: string }>>>
}) {
    const chatListRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight
        }
    }, [chatMessages])

    return (
        <div className='flex flex-col min-w-48'>
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
            <div className="flex flex-row">
                <span className="text-[#1976d2] font-bold pr-1">me:</span>
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
                        e.stopPropagation()
                    }}
                    placeholder="Type a message..."
                    className="w-full outline-none text-[13px] font-mono"
                />
            </div>

        </div>
    )
}