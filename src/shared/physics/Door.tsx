
import { useEffect, useRef, useState } from 'react';
import DialogCollider from '@/shared/ped/DialogCollider';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { Quaternion, Vector3 } from 'three';

const PortalDoor = ({ position, rotation, label, children, onConfirm }:
    {
        position: [number, number, number],
        rotation: [number, number, number],
        label?: string,
        children: React.ReactNode,
        onConfirm?: () => void
    }) => {
    const [open, setOpen] = useState(false);
    const doorRef = useRef<RapierRigidBody | null>(null);

    useEffect(() => {
        if (open) {
            doorRef.current?.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2), false);
        } else {
            doorRef.current?.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0), false);
        }

    }, [open]);

    return (
        <group position={position} rotation={rotation}>
            <DialogCollider radius={0.8} onEnter={() => { setOpen(true); }}
                onExit={() => { setOpen(false); }}
            >
                {children}
            </DialogCollider>
            <RigidBody ref={doorRef} type='fixed' position={[-0.4, 0.7, 0]}>
                <mesh position={[0.4, 0, 0]}>
                    {/* {label && <Html position={[0, 0.3, 0.1]} transform distanceFactor={2}>{label}</Html>} */}
                    <boxGeometry args={[0.8, 1.4, 0.1]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
            </RigidBody>
            {open && <RigidBody sensor type='fixed' position={[-0.4, 0.7, 0]} onIntersectionEnter={() => {
                onConfirm?.();
            }}>
                <mesh position={[0.4, 0, 0]}>
                    <boxGeometry args={[0.8, 1.4, 0.1]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            </RigidBody>}
        </group>
    );
};

export default PortalDoor;
