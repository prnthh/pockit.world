import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { immer } from "zustand/middleware/immer";

type Entity = {
    id: string
    type: string
    [key: string]: any
}

const useGameStore = create(
    immer(
    combine(
        {
            entities: [] as Array<Entity>,
        },
        (set, get) => {
            return {
                addEntity: (entity: Partial<Entity>) => {
                    const id =
                        (entity as Entity).id ??
                        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
                            ? (crypto as any).randomUUID()
                            : Math.random().toString(36).slice(2, 9))

                    const newEntity: Entity = { ...(entity as object), id } as Entity

                    set((state) => {
                        state.entities.push(newEntity)
                    })

                    return id
                },
                removeEntity: (entityId: string) => {
                    set((state) => {
                        state.entities = state.entities.filter((e: Entity) => e.id !== entityId)
                    })
                },
            }
        },
    )  ),
)

export const allEntityIDsByType = (type: string) => {
    return useGameStore(useShallow((state) => state.entities.filter((e) => e.type === type).map((e) => e.id)))
}

export const useEntityById = (id: string) => {
    return useGameStore(useShallow((state) => state.entities.find((e) => e.id === id)))
}

export default useGameStore