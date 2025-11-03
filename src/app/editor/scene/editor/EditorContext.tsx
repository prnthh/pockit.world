import { DragDropLoader } from "../../dragdrop/DragDropLoader";
import React, { useEffect, useRef, useState, useContext, createContext, useMemo } from "react";
import SceneEditor from "../editor/SceneEditor";
import { Object3D, Object3DEventMap, Scene } from "three";
import { EditorModes, SceneNode, Viewer } from "../viewer/SceneViewer";
import { loadModelFromURL } from "../../shared/modelLoader";

interface EditorContextType {
    sceneGraph: SceneNode[];
    setSceneGraph: React.Dispatch<React.SetStateAction<SceneNode[]>>;
    models: { [filename: string]: any };
    setModels: React.Dispatch<React.SetStateAction<{ [filename: string]: any }>>;
    playMode: EditorModes;
    setPlayMode: React.Dispatch<React.SetStateAction<EditorModes>>;
    selectedNodeId: string | null;
    setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
    getNodeRef: (id: string) => React.RefObject<Object3D<Object3DEventMap> | null>;
    scanAndLoadMissingModels: (customSceneGraph?: SceneNode[]) => void;
    sceneRef: React.RefObject<Scene | null>;
    // Modular scene graph operations
    addNodeToRoot: (node: SceneNode) => void;
    addNodesToRoot: (nodes: SceneNode[]) => void;
    updateRootChildren: (updater: (children: SceneNode[]) => SceneNode[]) => void;
    getRoot: () => SceneNode;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function useEditorContext() {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error("useEditorContext must be used within EditorContext.Provider");
    return ctx;
}

export function GameEngine({ resourcePath = "", mode = EditorModes.Play, sceneGraph: initialSceneGraph, children }: { resourcePath?: string, mode?: EditorModes, sceneGraph?: SceneNode[], children?: React.ReactNode }) {
    const [sceneGraph, setSceneGraph] = useState<SceneNode[]>(
        initialSceneGraph ??
        [{
            id: Math.random().toString(36).substr(2, 9),
            name: "Root",
            children: [],
            components: [],
        }]
    );

    // Update sceneGraph if initialSceneGraph changes
    useEffect(() => {
        if (initialSceneGraph) {
            setSceneGraph(initialSceneGraph);
            scanAndLoadMissingModels(initialSceneGraph);
        }
    }, [initialSceneGraph]);
    // Store models as a map: filename -> model
    const [models, setModels] = useState<{ [filename: string]: any }>({});
    const [playMode, setPlayMode] = useState<EditorModes>(mode);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    useEffect(() => {
        setPlayMode(mode);
    }, [mode]);

    // Map of nodeId to ref
    const nodeRefs = useRef<{ [id: string]: React.RefObject<Object3D<Object3DEventMap> | null> }>({});
    const getNodeRef = (id: string): React.RefObject<Object3D<Object3DEventMap> | null> => {
        if (!nodeRefs.current[id]) nodeRefs.current[id] = React.createRef<Object3D<Object3DEventMap>>();
        return nodeRefs.current[id];
    };

    // Scene ref for exporting
    const sceneRef = useRef<Scene | null>(null);

    // Get the root node
    const getRoot = (): SceneNode => sceneGraph[0];

    // Add a single node to the root's children
    const addNodeToRoot = (node: SceneNode) => {
        setSceneGraph(prev => [{
            ...prev[0],
            children: [...prev[0].children, node]
        }]);
    };

    // Add multiple nodes to the root's children
    const addNodesToRoot = (nodes: SceneNode[]) => {
        setSceneGraph(prev => [{
            ...prev[0],
            children: [...prev[0].children, ...nodes]
        }]);
    };

    // Update root's children using an updater function
    const updateRootChildren = (updater: (children: SceneNode[]) => SceneNode[]) => {
        setSceneGraph(prev => [{
            ...prev[0],
            children: updater(prev[0].children)
        }]);
    };

    // Create a new node with default transform
    const createNode = (name: string, components: any[] = []): SceneNode => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        children: [],
        components,
        transform: {
            position: [0, 0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: 1
        }
    });

    // Apply offset to a node's transform
    const applyOffset = (node: SceneNode, offset?: { x: number, y: number, z: number }): SceneNode => {
        const newNode = { ...node };
        if (!newNode.transform) {
            newNode.transform = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
        }
        newNode.transform.position = [
            (newNode.transform.position?.[0] || 0) + (offset?.x || 0),
            (newNode.transform.position?.[1] || 0) + (offset?.y || 0),
            (newNode.transform.position?.[2] || 0) + (offset?.z || 0),
        ] as [number, number, number];
        return newNode;
    };

    // --- End of helper functions ---

    function addModelNodeToSceneGraph(model: any, filename: string) {
        // Always store the model in models state by filename
        setModels(prevModels => ({
            ...prevModels,
            [filename]: model
        }));

        // Create and add the model node using helper functions
        const newNode = createNode(filename, [
            { type: 'model', filename }
        ]);
        addNodeToRoot(newNode);
    }

    const insertSceneWithOffset = (newScene: SceneNode[], offset?: { x: number, y: number, z: number }) => {
        // Apply offset to each top-level node in newScene
        const offsetNodes = newScene.map(node => applyOffset(node, offset));
        addNodesToRoot(offsetNodes);

        // Scan and load models from the newly inserted scene
        scanAndLoadMissingModels(newScene);
    };

    // --- Scan and load missing models ---
    const scanAndLoadMissingModels = (customSceneGraph?: SceneNode[]) => {
        console.log("Scanning for missing models...");
        const graph = customSceneGraph || sceneGraph;
        const referencedFiles = new Set<string>();

        // Recursively collect all model filenames from the scene graph
        function collectModelFiles(nodes: SceneNode[]) {
            nodes.forEach(node => {
                node.components?.forEach(comp => {
                    if (comp.type === 'model' && comp.filename) {
                        referencedFiles.add(comp.filename);
                    }
                });
                if (node.children?.length) {
                    collectModelFiles(node.children);
                }
            });
        }
        collectModelFiles(graph);

        // Mark missing models
        setModels(prevModels => {
            const newModels = { ...prevModels };
            referencedFiles.forEach(filename => {
                if (!(filename in newModels)) {
                    newModels[filename] = { missing: true };
                }
            });
            return newModels;
        });

        // Helper function to load a model based on its file extension
        const loadModel = (filename: string) => {
            const onSuccess = (model: any) => {
                setModels(prev => ({ ...prev, [filename]: model }));
            };

            const onError = (err: any) => {
                console.error(`Failed to load model: ${filename}`, err);
                setModels(prev => ({ ...prev, [filename]: { missing: true, error: err } }));
            };

            loadModelFromURL(filename, resourcePath, { onSuccess, onError });
        };

        // Defer model loading to prevent canvas initialization race conditions
        setTimeout(() => {
            referencedFiles.forEach(filename => {
                // Check current models state to avoid race conditions
                setModels(currentModels => {
                    if (currentModels[filename] && !currentModels[filename].missing) {
                        return currentModels; // Already loaded
                    }

                    loadModel(filename);
                    return currentModels;
                });
            });
        }, 100); // Small delay to let canvas initialize
    };
    // Run once on mount
    React.useEffect(() => {
        scanAndLoadMissingModels();
    }, []);

    return (
        <EditorContext.Provider value={useMemo(() => ({
            sceneGraph,
            setSceneGraph,
            models,
            setModels,
            playMode,
            setPlayMode,
            selectedNodeId,
            setSelectedNodeId,
            getNodeRef,
            scanAndLoadMissingModels,
            sceneRef,
            addNodeToRoot,
            addNodesToRoot,
            updateRootChildren,
            getRoot
        }), [sceneGraph, models, playMode, selectedNodeId])}>
            {playMode == EditorModes.Edit && <DragDropLoader onModelLoaded={(model, filename) => addModelNodeToSceneGraph(model, filename)} />}
            <div className="w-full items-center justify-items-center min-h-screen bg-black/70" style={{ height: "100vh" }}>
                {children}
            </div>
            {playMode == EditorModes.Edit && <SceneEditor
                sceneGraph={sceneGraph} // pass raw sceneGraph
                setSceneGraph={setSceneGraph}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                models={models}
                setModels={setModels}
            />}
        </EditorContext.Provider>
    );
}