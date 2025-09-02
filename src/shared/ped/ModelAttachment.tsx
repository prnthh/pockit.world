import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Object3D, Vector3 } from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

function findBoneByName(object: Object3D, name: string): Object3D | null {
    if (object.name === name) return object;
    for (const child of object.children) {
        const found = findBoneByName(child, name);
        if (found) return found;
    }
    return null;
}

type ModelAttachmentProps = {
    model: string;
    attachpoint: string;
    offset?: Vector3;
    scale?: Vector3;
    rotation?: Vector3;
    name?: string;
};

export default function ModelAttachment({
    model,
    attachpoint,
    offset,
    scale,
    rotation,
    name = "attachment",
}: ModelAttachmentProps) {
    const { scene } = useGLTF(model);
    const objectRef = useRef<Object3D | null>(null);
    const clonedSceneRef = useRef<Object3D | null>(null);
    const lastBoneRef = useRef<Object3D | null>(null);
    const [clonedScene, setClonedScene] = useState<Object3D | null>(null);

    useEffect(() => {
        if (scene) {
            const clone = SkeletonUtils.clone(scene);
            clone.name = `attachment-${attachpoint}-${name}`;
            clone.position.set(offset?.x || 0, offset?.y || 0, offset?.z || 0);
            clone.scale.set(scale?.x || 1, scale?.y || 1, scale?.z || 1);
            clone.rotation.set(rotation?.x || 0, rotation?.y || 0, rotation?.z || 0);
            clonedSceneRef.current = clone;
            setClonedScene(clone);
        }
        return () => {
            // Clean up: remove the cloned scene from the last known bone on unmount
            if (clonedSceneRef.current && lastBoneRef.current) {
                lastBoneRef.current.remove(clonedSceneRef.current);
            }
            clonedSceneRef.current = null;
            lastBoneRef.current = null;
        };
    }, [scene, attachpoint, offset, scale, rotation, name]);

    useEffect(() => {
        // Find parent using objectRef.current.parent
        const parent = objectRef.current?.parent;
        if (parent && clonedScene) {
            // Traverse the parent hierarchy to find the bone
            const bone = findBoneByName(parent, attachpoint);
            if (bone) {
                // Remove previous attachments
                bone.children
                    .filter((child) => child.name.startsWith("attachment-"))
                    .forEach((child) => bone.remove(child));
                // Attach clone to bone
                bone.add(clonedScene);
                lastBoneRef.current = bone;
            }
        }
    }, [clonedScene, attachpoint]);

    return clonedScene ? (
        <primitive ref={objectRef} object={clonedScene} />
    ) : null;
}