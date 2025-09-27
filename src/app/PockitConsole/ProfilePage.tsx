
export default function ProfilePage({ myState, setMyState, sendPlayerState }: {
    myState: { position: [number, number, number], profile: { [key: string]: any } },
    setMyState: React.Dispatch<React.SetStateAction<{ position: [number, number, number], profile: { [key: string]: any } }>>,
    sendPlayerState: (state: { position: [number, number, number], profile: { [key: string]: any } }) => void
}) {
    return (
        <div className="flex flex-col items-center justify-end w-full text-white">
            <div>
                <input
                    type="text"
                    value={myState.profile.name || ''}
                    onChange={e => {
                        const name = e.target.value;
                        setMyState(state => {
                            const newState = {
                                ...state,
                                profile: {
                                    ...state.profile,
                                    name
                                }
                            }
                            sendPlayerState(newState)
                            return newState
                        })
                    }}
                    placeholder='nickname'
                    className="ml-2 p-1 rounded border-none bg-[#333] text-white text-[10px] font-mono"
                />
            </div>

            <div className="flex">
                {(['oni', 'milady']).map((avatar) => (
                    <button
                        key={avatar}
                        onClick={() => {
                            setMyState(state => {
                                const newState = {
                                    ...state,
                                    profile: {
                                        ...state.profile,
                                        avatar: avatar
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
                        {avatar}
                    </button>
                ))}
            </div>

            <input
                value={JSON.stringify(myState.profile)}
                onChange={e => {
                    const val = e.target.value;
                    try {
                        const obj = JSON.parse(val);
                        setMyState(state => {
                            const newState = {
                                ...state,
                                profile: {
                                    ...state.profile,
                                    ...obj
                                }
                            }
                            sendPlayerState(newState)
                            return newState
                        })
                    } catch (err) {
                        // Invalid JSON, ignore
                    }
                }} className="w-full p-2 rounded border-none bg-[#333] text-white text-[10px] font-mono mb-2"
            />
        </div>
    );
}
