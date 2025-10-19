import React, { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export const ShadowLight = ({
    intensity = 1.5,
    offset = [20, 40, 20] as [number, number, number]
}: {
    intensity?: number;
    offset?: [number, number, number];
} = {}) => {
    const lightRef = React.useRef<THREE.DirectionalLight>(null);
    const targetRef = React.useRef<THREE.Object3D>(null);
    const { scene } = useThree();

    // Create target object once
    const targetObject = React.useMemo(() => new THREE.Object3D(), []);

    // Add target to scene on mount
    useEffect(() => {
        scene.add(targetObject);
        return () => {
            scene.remove(targetObject);
        };
    }, [scene, targetObject]);

    // Update light and target positions based on player position
    useFrame(({ camera }) => {
        let targetPos = new THREE.Vector3(0, 0, 0);

        const cameraPos = camera.position;
        targetPos.set(cameraPos.x, cameraPos.y, cameraPos.z);

        // Update light position (offset from target)
        if (lightRef.current) {
            lightRef.current.position.set(
                targetPos.x + offset[0],
                targetPos.y + offset[1],
                targetPos.z + offset[2]
            );
        }

        // Update target position (where light points to)
        if (targetObject) {
            targetObject.position.copy(targetPos);
        }
    });

    return <>
        <directionalLight
            ref={lightRef}
            target={targetObject}
            intensity={intensity}
            castShadow
            shadow-mapSize-height={1024}
            shadow-mapSize-width={1024}
            shadow-camera-near={0.1}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={30}
            shadow-camera-bottom={-20}
            shadow-bias={-0.001}
        />
    </>
}