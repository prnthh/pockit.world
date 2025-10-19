/**
 * Copyright (c) prnth.com. All rights reserved.
 *
 * This source code is licensed under the GPL-3.0 license found in the LICENSE
 * file in the root directory of this source tree.
 */

import React, { useMemo, createContext, useState, useContext, useEffect, useRef } from 'react';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';
import Joystick, { JoystickHandle } from './Joystick';

export enum WalkControls {
    forward = 'forward',
    backward = 'backward',
    left = 'left',
    right = 'right',
    jump = 'jump',
    run = 'run',
    use = 'use',
    altUse = 'altUse',
    reset = 'reset',
}

const walkControlKeys = [
    { name: WalkControls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: WalkControls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: WalkControls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: WalkControls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: WalkControls.run, keys: ['Shift'] },
    { name: WalkControls.jump, keys: ['Space'] },
    { name: WalkControls.use, keys: ['KeyE'] },
    { name: WalkControls.altUse, keys: ['KeyQ'] },
    { name: WalkControls.reset, keys: ['KeyR'] },
]


export enum DriveControls {
    forward = 'forward',
    backward = 'backward',
    left = 'left',
    right = 'right',
    use = 'use',
    run = 'run',
    altUse = 'altUse',
    brake = 'brake',
    reset = 'reset',
}

const driveControlKeys = [
    { name: DriveControls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: DriveControls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: DriveControls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: DriveControls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: DriveControls.run, keys: ['Shift'] },
    { name: DriveControls.use, keys: ['KeyE'] },
    { name: DriveControls.altUse, keys: ['KeyQ'] },
    { name: DriveControls.brake, keys: ['Space'] },
    { name: DriveControls.reset, keys: ['KeyR'] },
]


const controlSchemes = {
    simple: walkControlKeys,
    advanced: walkControlKeys,
    drive: driveControlKeys,
    none: [],
}

export type ControlName = WalkControls | DriveControls;

const ControlSchemeContext = createContext<{
    scheme: keyof typeof controlSchemes;
    setScheme: React.Dispatch<React.SetStateAction<keyof typeof controlSchemes>>
}>({
    scheme: 'simple',
    setScheme: () => { },
});

export const useControlScheme = () => useContext(ControlSchemeContext);

function isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function Controls({ disabled = false, children }: { disabled?: boolean; children: React.ReactNode }) {
    const [controlScheme, setControlScheme] = useState<keyof typeof controlSchemes>('simple');
    const [isMobile, setIsMobile] = useState(false);
    const joystickRef = useRef<JoystickHandle | null>(null);
    const [floatingPos, setFloatingPos] = useState<{ left: number; top: number } | null>(null);
    const activePointerId = useRef<number | null>(null);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    const map = useMemo<KeyboardControlsEntry<ControlName>[]>(() => (controlSchemes[controlScheme]), [controlScheme])

    return (
        <ControlSchemeContext.Provider value={{
            scheme: controlScheme,
            setScheme: setControlScheme
        }}>
            {!disabled && <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 100,
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '5px',
                color: 'white'
            }}
                onClick={() => setControlScheme(controlScheme === 'simple' ? 'advanced' : 'simple')}
            >{controlScheme} controls
            </div>}
            <KeyboardControls map={map}>
                {children}
                {!disabled && isMobile && controlScheme === 'advanced' && (
                    <div className='absolute bottom-10 left-10 z-50 text-white'>
                        <Joystick controlScheme={controlScheme} />
                    </div>
                )}

                {/* Fullscreen overlay + floating joystick for simple/mobile mode */}
                {!disabled && controlScheme === 'simple' && (
                    <div
                        id={'floating-joystick-overlay'}
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 2,
                            touchAction: 'none',
                        }}
                        onPointerDown={(e) => {
                            // start floating joystick at pointer location
                            // only start for primary pointers
                            if ((e as React.PointerEvent).button && (e as React.PointerEvent).button !== 0) return;
                            const pe = e as React.PointerEvent<HTMLDivElement>;
                            activePointerId.current = pe.pointerId;
                            const left = pe.clientX;
                            const top = pe.clientY;
                            setFloatingPos({ left, top });
                            // capture pointer so we continue receiving events
                            try {
                                (pe.currentTarget as Element).setPointerCapture(pe.pointerId);
                            } catch (err) { }
                            requestAnimationFrame(() => {
                                joystickRef.current?.startFrom(left, top, pe.pointerType === 'touch', pe.pointerId);
                            });
                        }}
                        onPointerMove={(e) => {
                            const pe = e as React.PointerEvent<HTMLDivElement>;
                            if (activePointerId.current !== pe.pointerId) return;
                            joystickRef.current?.moveTo(pe.clientX, pe.clientY);
                        }}
                        onPointerUp={(e) => {
                            const pe = e as React.PointerEvent<HTMLDivElement>;
                            if (activePointerId.current !== pe.pointerId) return;
                            try {
                                (pe.currentTarget as Element).releasePointerCapture(pe.pointerId);
                            } catch (err) { }
                            joystickRef.current?.end();
                            setFloatingPos(null);
                            activePointerId.current = null;
                        }}
                        onPointerCancel={(e) => {
                            const pe = e as React.PointerEvent<HTMLDivElement>;
                            if (activePointerId.current !== pe.pointerId) return;
                            joystickRef.current?.end();
                            setFloatingPos(null);
                            activePointerId.current = null;
                        }}
                    >
                        {floatingPos && (
                            <Joystick
                                ref={joystickRef}
                                controlScheme={controlScheme}
                                floating
                                left={floatingPos.left}
                                top={floatingPos.top}
                            />
                        )}
                    </div>
                )}
            </KeyboardControls>
        </ControlSchemeContext.Provider>
    );
}

export default Controls;
