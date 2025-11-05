import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

const WALK_SPEED = 1.0;
const RUN_SPEED = 2.0;
const IDLE_THRESHOLD = 0.51;
const RUN_DISTANCE = 5.0;
const ROTATION_SPEED = 2.5;

export enum SteeringType {
    WALK,
    RUN,
    DRIVE,
}

const useSteeringBehavior = (
    type: SteeringType,
    rigidBodyRef: RefObject<RapierRigidBody | null>,
    setAnimation: any,
    position: [number, number, number] | undefined,
    paused: boolean = false,
    onDestinationReached?: RefObject<() => void>,
) => {
    const target = useRef<THREE.Vector3 | undefined>(undefined);
    const targetReached = useRef(false);
    const targetPos = useRef<THREE.Vector3>(new THREE.Vector3());
    const groundNormal = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));

    // Pre-allocated objects to avoid GC in useFrame
    const cache = useRef({
        currentPos: new THREE.Vector3(),
        directionToTarget: new THREE.Vector3(),
        currentQuat: new THREE.Quaternion(),
        targetQuat: new THREE.Quaternion(),
        rotatedQuat: new THREE.Quaternion(),
        lookAtTarget: new THREE.Vector3(),
        projectedDir: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        tempMatrix: new THREE.Matrix4(),
        angleThreshold: THREE.MathUtils.degToRad(30),
    });

    function stopMovement() {
        if (!rigidBodyRef.current) return;
        target.current = undefined;
        targetReached.current = true;
        rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
        setAnimation("idle");
    }

    useEffect(() => {
        const rigidBody = rigidBodyRef.current;
        if (!rigidBody || !position) return;

        const newTarget = cache.current.lookAtTarget.set(position[0], position[1], position[2]);

        // Check if target changed using direct comparison
        if (target.current?.equals(newTarget)) return;

        const pos = rigidBody.translation();
        const distance = cache.current.currentPos.set(pos.x, pos.y, pos.z).distanceTo(newTarget);

        // Update target
        if (!target.current) target.current = new THREE.Vector3();
        target.current.copy(newTarget);
        targetReached.current = false;
        targetPos.current.copy(newTarget);

        // Check if already at destination
        if (distance <= IDLE_THRESHOLD) {
            stopMovement();
            onDestinationReached?.current?.();
        }
    }, [position, rigidBodyRef.current]);

    useEffect(() => {
        if (paused) setAnimation("idle");
    }, [paused, setAnimation]);

    useFrame((_, delta) => {
        const rigidBody = rigidBodyRef.current;
        if (!rigidBody || !target.current || targetReached.current || paused) return;

        const { currentPos, directionToTarget, currentQuat } = cache.current;
        const pos = rigidBody.translation();
        currentPos.set(pos.x, pos.y, pos.z);
        directionToTarget.copy(targetPos.current).sub(currentPos);
        const distance = directionToTarget.length();

        if (distance <= IDLE_THRESHOLD) {
            stopMovement();
            onDestinationReached?.current?.();
            return;
        }

        directionToTarget.normalize();

        const rot = rigidBody.rotation();
        currentQuat.set(rot.x, rot.y, rot.z, rot.w);

        const speed = distance > RUN_DISTANCE ? RUN_SPEED : WALK_SPEED;

        const { projectedDir, lookAtTarget, tempMatrix, targetQuat, rotatedQuat, velocity } = cache.current;
        projectedDir.copy(directionToTarget).projectOnPlane(groundNormal.current).normalize();

        lookAtTarget.copy(currentPos).sub(projectedDir);
        tempMatrix.lookAt(currentPos, lookAtTarget, groundNormal.current);
        targetQuat.setFromRotationMatrix(tempMatrix);

        const rotSpeed = type === SteeringType.DRIVE ? ROTATION_SPEED * 0.5 * delta : ROTATION_SPEED * delta;
        rotatedQuat.copy(currentQuat).slerp(targetQuat, rotSpeed);
        rigidBody.setRotation(rotatedQuat, true);

        if (type === SteeringType.DRIVE) {
            velocity.set(0, 0, 1).applyQuaternion(currentQuat);
            velocity.y = 0;
            velocity.normalize().multiplyScalar(speed);
            rigidBody.setLinvel({ x: velocity.x, y: rigidBody.linvel().y, z: velocity.z }, true);
            setAnimation(speed === RUN_SPEED ? "run" : "walk");
        } else if (currentQuat.angleTo(targetQuat) < cache.current.angleThreshold) {
            const walkSpeed = type === SteeringType.RUN && distance > RUN_DISTANCE ? RUN_SPEED : WALK_SPEED;
            velocity.copy(projectedDir).multiplyScalar(walkSpeed);
            rigidBody.setLinvel({ x: velocity.x, y: rigidBody.linvel().y, z: velocity.z }, true);
            setAnimation(walkSpeed === RUN_SPEED ? "run" : "walk");
        } else {
            rigidBody.setLinvel({ x: 0, y: rigidBody.linvel().y, z: 0 }, true);
        }
    });

    return {
        isMoving: !!target.current && !targetReached.current,
        targetReached: targetReached.current,
    };
};

export default useSteeringBehavior;