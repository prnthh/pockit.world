/**
 * Copyright (c) prnth.com. All rights reserved.
 *
 * This source code is licensed under the GPL-3.0 license
 */

import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RapierRigidBody, RigidBody, useRapier } from "@react-three/rapier";
import { useEffect, useRef, useState, useMemo, useCallback, RefObject } from "react";
import { Vector3, Group } from "three";
import * as THREE from "three";
import { usePointerLockControls } from "./usePointerLockControls";
import { FollowCam } from "@/shared/FollowCam";
import { useWeapon } from "./useWeapon";
import AnimatedModel from "../ped/HumanoidModel";
import { useAudio } from "../AudioProvider";


export const CharacterController = ({ lookTarget, name = 'bob', mode = 'third-person', position = [0, 0, 0], children, forwardRef }: {
    lookTarget?: RefObject<THREE.Object3D | null>
    name?: string,
    mode?: "simple" | "side-scroll" | "third-person",
    position?: [number, number, number],
    children?: React.ReactNode,
    forwardRef?: (refs: { rbref: RefObject<RapierRigidBody | null>, meshref: RefObject<Group | null> }) => void
}) => {
    const { playSound } = useAudio();

    // --- Constants & refs ---
    const lastFacingRef = useRef<number>(0);
    const savedFacingRef = useRef<number | null>(null);
    const WALK_SPEED = 1.2, RUN_SPEED = 3, JUMP_FORCE = 1;
    const height = 1.2, roundHeight = 0.25;
    // Tunables for simple-mode strafing behavior
    const STRAFE_FORWARD_BIAS = 0.6; // forward push when strafing-only
    const HORIZONTAL_BOOST = 1.15; // lateral multiplier so strafing feels equally fast

    // Reusable temp vectors to avoid per-frame allocations
    const _tmpDir = useRef(new Vector3());
    const _yAxis = useRef(new Vector3(0, 1, 0));
    const { rapier, world } = useRapier();
    const rb = useRef<RapierRigidBody | null>(null);
    const container = useRef<Group>(null);
    const character = useRef<Group>(null);
    const velocityRef = useRef<Vector3>(new Vector3(0, 0, 0));
    const walkActionRef = useRef<THREE.AnimationAction | null>(null);
    const walkLeftActionRef = useRef<THREE.AnimationAction | null>(null);
    const runActionRef = useRef<THREE.AnimationAction | null>(null);

    // Track last step index to avoid duplicate triggers
    const lastStepIndexRef = useRef<number | null>(null);
    // --- Jump state ---
    const jumping = useRef(false);
    const jumpReleased = useRef(true);

    // Clean jump logic
    const handleJump = useCallback((jumpPressed: boolean, grounded: boolean) => {
        if (!jumpPressed) jumpReleased.current = true;
        if (jumping.current && grounded) jumping.current = false;
        if (jumpPressed && jumpReleased.current && !jumping.current && grounded) {
            rb.current?.wakeUp?.();
            rb.current?.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
            jumping.current = true;
            jumpReleased.current = false;
        }
    }, [rb, JUMP_FORCE]);
    const [, get] = useKeyboardControls();
    const [animation, setAnimation] = useState<"idle" | "walk" | "run" | "jump" | "walkLeft" | "lpunch" | "rpunch" | string[]>("idle");

    const shoulderCamModeRef = useRef(false);
    const { weaponHandler } = useWeapon();

    // --- Camera & controls ---
    const pointerLockControls = usePointerLockControls({
        enabled: mode == "third-person", onClick: () => shoulderCamModeRef.current && weaponHandler()
    });
    const rotationTarget = mode !== "simple" ? pointerLockControls.rotationTarget : undefined;
    const verticalRotation = mode !== "simple" ? pointerLockControls.verticalRotation : undefined;
    const shoulderCamMode = mode !== "simple" ? pointerLockControls.shoulderCamMode : undefined;
    const setShoulderCamMode = mode !== "simple" ? pointerLockControls.setShoulderCamMode : undefined;

    // Keep ref updated with latest value
    useEffect(() => {
        shoulderCamModeRef.current = !!shoulderCamMode;
    }, [shoulderCamMode]);

    // Initialize third-person rotation when switching modes
    useEffect(() => {
        if (mode !== "third-person" || !rotationTarget || !character.current || !container.current) return;
        // Save current facing so we can restore it when returning to side-scroll
        savedFacingRef.current = normalizeAngle(lastFacingRef.current);
        const composedRaw = container.current.rotation.y + character.current.rotation.y;
        const composed = normalizeAngle(composedRaw);
        rotationTarget.current = composed;
        container.current.rotation.y = composed;
        character.current.rotation.y = 0;
        lastFacingRef.current = 0;
    }, [mode, rotationTarget]);

    // Restore facing when switching back to side-scroll from third-person
    useEffect(() => {
        if (mode !== "side-scroll" || !character.current || !container.current) return;
        const restored = normalizeAngle(savedFacingRef.current ?? lastFacingRef.current);
        character.current.rotation.y = restored;
        container.current.rotation.y = 0;
        if (rotationTarget && rotationTarget.current !== undefined) rotationTarget.current = container.current.rotation.y;
    }, [mode, rotationTarget]);

    // --- Forward refs ---
    useEffect(() => {
        if (typeof forwardRef === 'function') {
            forwardRef({ rbref: rb, meshref: container });
        }
    }, [forwardRef]);

    // --- Movement helpers ---
    // Normalize an angle to the range [-PI, PI]
    const normalizeAngle = useCallback((a: number) => {
        return Math.atan2(Math.sin(a), Math.cos(a));
    }, []);
    const setVelocity = useCallback((x: number, y: number, z: number) => {
        if (!rb.current) return;
        velocityRef.current.set(x, y, z);
        rb.current.setLinvel(velocityRef.current, true);
    }, []);

    const handleSimpleMode = useCallback((keyInputs: any) => {
        if (container.current) {
            // Reduce rotation speed for a gentler left/right camera turn in simple mode
            const ROT_SPEED = 0.02; // was 0.04
            if (keyInputs.left) container.current.rotation.y += ROT_SPEED;
            if (keyInputs.right) container.current.rotation.y -= ROT_SPEED;
        }
        // Build a local input direction including strafing (reuse tmp vector)
        const localDir = _tmpDir.current;
        localDir.set(0, 0, 0);
        if (keyInputs.forward) localDir.z += 1;
        if (keyInputs.backward) localDir.z -= 1;
        if (keyInputs.left) localDir.x += 1;
        if (keyInputs.right) localDir.x -= 1;

        if (localDir.lengthSq() > 0) {
            // If only strafing, add a small forward bias and boost lateral speed
            if (Math.abs(localDir.z) < 1e-6 && Math.abs(localDir.x) > 0) {
                localDir.z += STRAFE_FORWARD_BIAS;
                localDir.x *= HORIZONTAL_BOOST;
            }

            localDir.normalize();
            if (container.current) localDir.applyAxisAngle(_yAxis.current, container.current.rotation.y);

            const speed = (keyInputs.run ? RUN_SPEED : WALK_SPEED);
            setVelocity(localDir.x * speed, rb.current?.linvel().y ?? 0, localDir.z * speed);
        } else {
            setVelocity(0, rb.current?.linvel().y ?? 0, 0);
        }
        if (container.current && rotationTarget?.current !== undefined) {
            rotationTarget.current = container.current.rotation.y;
        }
    }, [setVelocity, rotationTarget]);

    const handleThirdPersonMode = useCallback((keyInputs: any) => {
        if (!rotationTarget) return;
        if (container.current) container.current.rotation.y = rotationTarget.current;
        let moveX = 0, moveZ = 0;
        if (keyInputs.forward) moveZ += 1;
        if (keyInputs.backward) moveZ -= 1;
        if (keyInputs.left) moveX += 1;
        if (keyInputs.right) moveX -= 1;
        if (mode === "side-scroll") {
            moveX = -moveX;
            moveZ = -moveZ;
        }
        const speed = keyInputs.run ? RUN_SPEED : WALK_SPEED;
        if (moveX || moveZ) {
            const dir = _tmpDir.current;
            dir.set(moveX, 0, moveZ).normalize().applyAxisAngle(_yAxis.current, rotationTarget.current);
            setVelocity(dir.x * speed, rb.current?.linvel().y ?? 0, dir.z * speed);
        } else {
            setVelocity(0, rb.current?.linvel().y ?? 0, 0);
        }
    }, [setVelocity, rotationTarget, mode]);

    const handleSideScrollMode = useCallback((keyInputs: any, moveX: number, moveZ: number, speed: number) => {
        if (verticalRotation?.current !== undefined) verticalRotation.current = 0;
        if (container.current) container.current.rotation.y = 0;
        if (rb.current && (moveX || moveZ)) {
            const charRot = character.current?.rotation.y ?? lastFacingRef.current;
            const dir = _tmpDir.current;
            dir.set(Math.sin(charRot), 0, Math.cos(charRot)).normalize();
            setVelocity(dir.x * speed, rb.current.linvel().y, dir.z * speed);
        } else {
            handleThirdPersonMode(keyInputs);
        }
    }, [setVelocity, verticalRotation, handleThirdPersonMode]);

    // --- Animation helpers ---
    const updateAnimation = useCallback((keyInputs: any, moveX: number, moveZ: number, speed: number) => {
        let nextAnimation: typeof animation | string[] = "idle";
        let targetFacing = lastFacingRef.current;
        if (keyInputs.use) {
            nextAnimation = "rpunch";
        } else if (keyInputs.altUse) {
            nextAnimation = "lpunch";
        } else if (jumping.current) {
            nextAnimation = "jump";
        } else if ((moveX || moveZ)) {
            if (mode === "third-person") {
                if (moveX && !moveZ) {
                    nextAnimation = "walkLeft";
                    if (walkLeftActionRef.current) walkLeftActionRef.current.timeScale = moveX;
                } else {
                    nextAnimation = (speed === RUN_SPEED ? "run" : "walk");
                    if (walkActionRef.current) walkActionRef.current.timeScale = moveZ;
                    if (runActionRef.current) runActionRef.current.timeScale = moveZ;
                }
            } else if (mode === "simple" || mode === "side-scroll") {
                if (moveX !== 0 || moveZ !== 0) {
                    targetFacing = Math.atan2(moveX, moveZ);
                }
                lastFacingRef.current = targetFacing;
                nextAnimation = (speed === RUN_SPEED ? "run" : "walk");
                if (walkActionRef.current) walkActionRef.current.timeScale = 1;
                if (runActionRef.current) runActionRef.current.timeScale = 1;
            }
        }
        // Smoothly rotate character to targetFacing in simple/side-scroll using normalized shortest delta
        if ((mode === "simple" || mode === "side-scroll") && character.current) {
            let facing = targetFacing;
            if (mode === "side-scroll") facing += Math.PI;
            facing = normalizeAngle(facing);
            const currentY = normalizeAngle(character.current.rotation.y);
            // shortest delta between angles in [-PI, PI]
            let delta = normalizeAngle(facing - currentY);
            character.current.rotation.y = normalizeAngle(currentY + delta * 0.2);
        }
        setAnimation(nextAnimation);
    }, [mode, animation]);

    // --- Main frame loop ---
    useFrame(() => {
        if (!rb.current) return;
        const keyInputs = get();
        let moveX = 0, moveZ = 0;
        if (keyInputs.forward) moveZ += 1;
        if (keyInputs.backward) moveZ -= 1;
        if (keyInputs.left) moveX += 1;
        if (keyInputs.right) moveX -= 1;
        const speed = keyInputs.run ? RUN_SPEED : WALK_SPEED;

        updateAnimation(keyInputs, moveX, moveZ, speed);

        if (keyInputs.use || keyInputs.altUse) {
            setVelocity(0, rb.current.linvel().y, 0);
        } else {
            if (mode === "simple") {
                handleSimpleMode(keyInputs);
            } else if (mode === "side-scroll") {
                handleSideScrollMode(keyInputs, moveX, moveZ, speed);
            } else {
                handleThirdPersonMode(keyInputs);
            }
        }
        // Play footstep sounds based on animation progress when grounded
        const grounded = checkGrounded();
        const isWalking = animation === 'walk' || animation === 'walkLeft';
        const isRunning = animation === 'run';
        const stepsPerCycle = 2; // two steps per walk/run cycle

        let action: THREE.AnimationAction | null = null;
        if (isRunning) action = runActionRef.current;
        else if (isWalking) action = walkActionRef.current || walkLeftActionRef.current;

        if (action && grounded) {
            const clip = action.getClip ? action.getClip() : null;
            const duration = clip ? (clip.duration || 1) : 1;
            const t = (action.time % duration) / duration;
            const stepIndex = Math.floor(t * stepsPerCycle);
            if (lastStepIndexRef.current !== stepIndex) {
                lastStepIndexRef.current = stepIndex;
                const baseVolume = isRunning ? 0.2 : 0.1;
                const baseStepSpeed = isRunning ? 1.06 : 0.98;
                const rand01 = () => Math.random() * 0.25 + 0.9; // small variance
                const volume = Math.max(0, Math.min(1, baseVolume * rand01()));
                const stepSpeed = baseStepSpeed * rand01();
                playSound("/sound/step.mp3", volume, stepSpeed).catch(() => { });
            }
        } else {
            lastStepIndexRef.current = null;
        }

        handleJump(keyInputs.jump, grounded);
    });

    const checkGrounded = useMemo(() => {
        return () => {
            if (!rb.current || !rapier) return false;
            const origin = rb.current.translation();
            // Set the ray origin just above the bottom hemisphere of the capsule, moved 0.02 lower
            const rayOrigin = {
                x: origin.x,
                y: origin.y,
                z: origin.z
            };
            const direction = { x: 0, y: -1, z: 0 };
            const ray = new rapier.Ray(rayOrigin, direction);
            const maxToi = 0.1;
            const solid = true;

            // Get the player's collider to exclude it from the ray cast
            const playerCollider = rb.current.collider(0);

            const hit = world.castRay(
                ray,
                maxToi,
                solid,
                undefined, // filterFlags
                undefined, // filterGroups
                playerCollider // filterExcludeCollider - exclude the player's collider
            );

            return !!hit && hit.timeOfImpact < 0.1 && Math.abs(rb.current.linvel().y) < 0.1;
        };
    }, [rb, rapier, world, height, roundHeight]);

    return (
        <>
            <RigidBody colliders={false} lockRotations ref={rb} position={[position[0], position[1] + (height / 2), position[2]]} name={name} >
                <group ref={container}>
                    <FollowCam
                        height={1 / height}
                        verticalRotation={verticalRotation}
                        cameraOffset={
                            mode === "side-scroll"
                                ? new Vector3(0, 1, 2) // Camera in front, lower
                                : (shoulderCamMode
                                    ? new Vector3(-0.5, 0.5, -0.5)
                                    : new Vector3(0, 1.5, -3.5))
                        }
                        targetOffset={
                            mode === "side-scroll"
                                ? new Vector3(0, 1, 0) // Target at character center
                                : (shoulderCamMode
                                    ? new Vector3(0, 0.5, 1.5)
                                    : new Vector3(0, 0.5, 1.5))
                        }
                    />
                    <group ref={character}>
                        {/* {shoulderCamMode && <TSLLine container={character} />} */}
                        <AnimatedModel
                            name={name}
                            basePath={"/models/human/onimilio/"}
                            model={"rigged.glb"}
                            animationOverrides={{
                                walk: 'anim/walk.fbx',
                                run: 'anim/run.fbx',
                                jump: 'anim/jump.fbx',
                                walkLeft: "/anim/walkLeft.fbx",
                                lpunch: "/anim/lpunch.fbx",
                                rpunch: "/anim/rpunch.fbx",
                            }}
                            animation={animation}
                            height={1.5}
                            lookTarget={lookTarget}
                            onActions={actions => {
                                walkActionRef.current = actions["walk"] || null;
                                walkLeftActionRef.current = actions["walkLeft"] || null;
                                runActionRef.current = actions["run"] || null;
                            }}
                        >
                            {children}
                        </AnimatedModel>
                    </group>
                </group>
                <CapsuleCollider args={[(height - (roundHeight * 1.9)) / 2, roundHeight]} position={[0, (height / 2), 0]} />
            </RigidBody>
        </>
    );
};
