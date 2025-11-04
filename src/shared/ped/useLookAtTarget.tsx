import { useFrame } from '@react-three/fiber'
import { Ref, type RefObject, useEffect, useRef } from 'react'
import {
    type Bone,
    type Object3D,
    type Object3DEventMap,
    Vector3,
} from 'three'
import * as THREE from 'three'

export default function useLookAtTarget(
    clone?: Object3D<Object3DEventMap>,
    lookAtTarget?: RefObject<Object3D<Object3DEventMap> | null>,
    neckBoneName = 'mixamorigNeck',
    enabled: boolean = true,
    config: { maxRotation: number; lerpSpeed?: number } = { maxRotation: Math.PI / 4, lerpSpeed: 0.15 },
) {
    const neckBoneRef = useRef<Bone | null>(null)
    const initialQuatRef = useRef<THREE.Quaternion | null>(null)

    useEffect(() => {
        if (!clone) return
        clone.traverse((obj) => {
            if (obj.name === neckBoneName && obj instanceof THREE.Bone) {
                neckBoneRef.current = obj
                initialQuatRef.current = obj.quaternion.clone()
            }
        })
    }, [clone, neckBoneName])

    useFrame(() => {
        if (!enabled || !initialQuatRef.current) return;

        const neck = neckBoneRef.current
        const target = lookAtTarget?.current
        if (!neck || !target) return

        const targetPos = target.getWorldPosition(new Vector3()).add(new Vector3(0, 0.5, 0))
        neck.lookAt(targetPos)

        // Clamp rotation
        const deltaQuat = initialQuatRef.current.clone().invert().multiply(neck.quaternion)
        const angle = 2 * Math.acos(Math.min(1, Math.abs(deltaQuat.w)))

        if (angle > config.maxRotation) {
            deltaQuat.slerp(new THREE.Quaternion(), 1 - config.maxRotation / angle)
            neck.quaternion.copy(initialQuatRef.current).multiply(deltaQuat)
        }
    })

    return { neckBone: neckBoneRef.current }
}
