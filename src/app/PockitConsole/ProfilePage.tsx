
export default function ProfilePage({ myState, setMyState, sendPlayerState }: {
    myState: { position: [number, number, number], appearance: { [key: string]: any } },
    setMyState: React.Dispatch<React.SetStateAction<{ position: [number, number, number], appearance: { [key: string]: any } }>>,
    sendPlayerState: (state: { position: [number, number, number], appearance: { [key: string]: any } }) => void
}) {
    return (
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
            <div>
                {JSON.stringify(myState.appearance)}
            </div>
        </div>
    );
}
