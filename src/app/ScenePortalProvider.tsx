"use client";

import { createContext } from 'react';
import tunnel from 'tunnel-rat';

const scenePortal = tunnel();

const ScenePortalContext = createContext({
    scenePortal,
});

const ScenePortalWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <ScenePortalContext.Provider value={{ scenePortal }}>
            {children}
        </ScenePortalContext.Provider>
    );
}

export { ScenePortalWrapper, ScenePortalContext };