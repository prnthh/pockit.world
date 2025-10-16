/**
 * Copyright (c) prnth.com. All rights reserved.
 *
 * This source code is licensed under the GPL-3.0 license found in the LICENSE
/**
 * Clean Joystick implementation
/**
 * Joystick component with floating support and imperative handle.
 */

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

type JoystickProps = {
    controlScheme: string;
    onMove?: (pos: { x: number; y: number }) => void;
    floating?: boolean;
    left?: number;
    top?: number;
};

const size = 100;
const radius = size / 2;
const knobRadius = 30;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getRelativePosition = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clientX - rect.left - radius;
    const y = clientY - rect.top - radius;
    const dist = Math.sqrt(x * x + y * y);
    if (dist > radius - knobRadius / 2) {
        const angle = Math.atan2(y, x);
        return {
            x: Math.cos(angle) * (radius - knobRadius / 2),
            y: Math.sin(angle) * (radius - knobRadius / 2),
        };
    }
    return { x, y };
};

const keyMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
];

function triggerKey(name: string, type: 'keydown' | 'keyup') {
    const entry = keyMap.find(k => k.name === name);
    if (!entry) return;
    for (const key of entry.keys) {
        const event = new KeyboardEvent(type, { code: key, key: key.replace('Key', ''), bubbles: true });
        window.dispatchEvent(event);
    }
}

export type JoystickHandle = {
    startFrom: (clientX: number, clientY: number, isTouch?: boolean, touchId?: number) => void;
    moveTo: (clientX: number, clientY: number) => void;
    end: () => void;
};

const Joystick = forwardRef<JoystickHandle, JoystickProps>(({ controlScheme, onMove, floating, left, top }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [knob, setKnob] = useState({ x: 0, y: 0 });
    const dragging = useRef(false);
    const lastDirections = useRef<Record<string, boolean>>({});
    const activeTouchId = useRef<number | null>(null);

    const getDirections = (x: number, y: number) => {
        const threshold = 0.3;
        return {
            forward: y < -threshold,
            backward: y > threshold,
            left: x < -threshold,
            right: x > threshold,
        };
    };

    useEffect(() => {
        const { x, y } = knob;
        const dirs = getDirections(x / (radius - knobRadius / 2), y / (radius - knobRadius / 2));
        for (const dir of Object.keys(dirs)) {
            const d = dir as keyof typeof dirs;
            if (dirs[d] && !lastDirections.current[d]) triggerKey(d, 'keydown');
            if (!dirs[d] && lastDirections.current[d]) triggerKey(d, 'keyup');
        }
        lastDirections.current = dirs;
        return () => {
            for (const dir of Object.keys(lastDirections.current)) {
                if (lastDirections.current[dir]) triggerKey(dir, 'keyup');
            }
            lastDirections.current = {};
        };
    }, [knob.x, knob.y]);

    const updateKnobFromCoords = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pos = getRelativePosition(clientX, clientY, rect);
        setKnob(pos);
        if (onMove) onMove({ x: clamp(pos.x / (radius - knobRadius / 2), -1, 1), y: clamp(pos.y / (radius - knobRadius / 2), -1, 1) });
    };

    useImperativeHandle(ref, () => ({
        startFrom: (clientX: number, clientY: number, isTouch?: boolean, touchId?: number) => {
            dragging.current = true;
            if (isTouch && typeof touchId === 'number') activeTouchId.current = touchId;
            updateKnobFromCoords(clientX, clientY);
        },
        moveTo: (clientX: number, clientY: number) => {
            if (!dragging.current) return;
            updateKnobFromCoords(clientX, clientY);
        },
        end: () => {
            dragging.current = false;
            activeTouchId.current = null;
            setKnob({ x: 0, y: 0 });
            if (onMove) onMove({ x: 0, y: 0 });
            for (const dir of Object.keys(lastDirections.current)) {
                if (lastDirections.current[dir]) triggerKey(dir, 'keyup');
            }
            lastDirections.current = {};
        }
    }), [onMove]);

    const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
        if ('touches' in e) {
            if (e.touches.length === 0) return;
            if (!dragging.current) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                let found = false;
                for (let i = 0; i < e.touches.length; i++) {
                    const t = e.touches[i];
                    const x = t.clientX - rect.left;
                    const y = t.clientY - rect.top;
                    if (x >= 0 && x <= size && y >= 0 && y <= size) {
                        dragging.current = true;
                        activeTouchId.current = t.identifier;
                        updateKnobFromCoords(t.clientX, t.clientY);
                        found = true;
                        break;
                    }
                }
                if (!found) return;
            }
        } else {
            dragging.current = true;
            updateKnobFromCoords((e as React.MouseEvent).clientX, (e as React.MouseEvent).clientY);
        }
    };

    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
        if ('touches' in e) {
            if (!dragging.current || activeTouchId.current === null) return;
            const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId.current);
            if (!touch) return;
            updateKnobFromCoords(touch.clientX, touch.clientY);
        } else {
            if (!dragging.current) return;
            updateKnobFromCoords((e as React.MouseEvent).clientX, (e as React.MouseEvent).clientY);
        }
    };

    const handleEnd = (e?: React.TouchEvent | React.MouseEvent) => {
        if (e && 'changedTouches' in e) {
            if (activeTouchId.current === null) return;
            const ended = Array.from(e.changedTouches).some(t => t.identifier === activeTouchId.current);
            if (!ended) return;
        }
        dragging.current = false;
        activeTouchId.current = null;
        setKnob({ x: 0, y: 0 });
        if (onMove) onMove({ x: 0, y: 0 });
        for (const dir of Object.keys(lastDirections.current)) {
            if (lastDirections.current[dir]) triggerKey(dir, 'keyup');
        }
        lastDirections.current = {};
    };

    const containerStyle: React.CSSProperties = floating ? {
        position: 'absolute',
        left: (typeof left === 'number' ? left - radius : 0),
        top: (typeof top === 'number' ? top - radius : 0),
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.0)',
        borderRadius: '50%',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 9999,
        pointerEvents: 'none',
    } : {
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        border: '2px solid white',
        touchAction: 'none',
        position: 'relative',
        userSelect: 'none',
    };

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            {...(floating ? {} : {
                onTouchStart: handleStart,
                onTouchMove: handleMove,
                onTouchEnd: handleEnd,
                onTouchCancel: handleEnd,
                onMouseDown: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleStart(e);
                    const div = containerRef.current;
                    if (!div) return;
                    const moveListener = handleMove as any;
                    const upListener = () => {
                        handleEnd();
                        div.removeEventListener('mousemove', moveListener);
                        div.removeEventListener('mouseup', upListener);
                    };
                    div.addEventListener('mousemove', moveListener);
                    div.addEventListener('mouseup', upListener, { once: true });
                }
            })}
        >
            <div
                style={{
                    position: 'absolute',
                    left: radius + knob.x - knobRadius / 2,
                    top: radius + knob.y - knobRadius / 2,
                    width: knobRadius,
                    height: knobRadius,
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    touchAction: 'none',
                    pointerEvents: 'none',
                }}
            />
            {floating && (
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }} />
            )}
        </div>
    );
});

export default Joystick;