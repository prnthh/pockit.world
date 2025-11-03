// Shared model loading utilities
import { GLTFLoader, FBXLoader, DRACOLoader } from "three/examples/jsm/Addons.js";

export interface ModelLoadCallbacks {
    onSuccess: (model: any) => void;
    onError: (error: any) => void;
}

/**
 * Load a model from a URL based on its file extension
 */
export function loadModelFromURL(
    filename: string, 
    resourcePath: string,
    callbacks: ModelLoadCallbacks
) {
    const extension = filename.toLowerCase().split('.').pop();
    const modelPath = `${resourcePath}/${filename}`;

    switch (extension) {
        case 'glb':
        case 'gltf':
            loadGLTFFromURL(modelPath, callbacks);
            break;
        case 'fbx':
            loadFBXFromURL(modelPath, callbacks);
            break;
        default:
            console.warn(`Unsupported model format: ${extension}`);
            callbacks.onError(new Error(`Unsupported format: ${extension}`));
    }
}

/**
 * Load a GLTF/GLB model from URL
 */
function loadGLTFFromURL(url: string, callbacks: ModelLoadCallbacks) {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(
        url,
        (gltf) => callbacks.onSuccess(gltf.scene),
        undefined,
        callbacks.onError
    );
}

/**
 * Load an FBX model from URL
 */
function loadFBXFromURL(url: string, callbacks: ModelLoadCallbacks) {
    const loader = new FBXLoader();
    loader.load(
        url,
        callbacks.onSuccess,
        undefined,
        callbacks.onError
    );
}

/**
 * Load a model from a File object (for drag & drop or file picker)
 */
export function loadModelFromFile(
    file: File,
    callbacks: ModelLoadCallbacks
) {
    const filename = file.name;
    const extension = filename.toLowerCase().split('.').pop();

    if (extension === 'glb' || extension === 'gltf') {
        loadGLTFFromFile(file, callbacks);
    } else if (extension === 'fbx') {
        loadFBXFromFile(file, callbacks);
    } else {
        console.warn(`Unsupported model format: ${extension}`);
        callbacks.onError(new Error(`Unsupported format: ${extension}`));
    }
}

/**
 * Load a GLTF/GLB model from File
 */
function loadGLTFFromFile(file: File, callbacks: ModelLoadCallbacks) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer) {
            const loader = new GLTFLoader();
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
            loader.setDRACOLoader(dracoLoader);
            
            loader.parse(
                arrayBuffer as ArrayBuffer,
                "",
                (gltf) => callbacks.onSuccess(gltf.scene),
                callbacks.onError
            );
        }
    };
    reader.onerror = () => callbacks.onError(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
}

/**
 * Load an FBX model from File
 */
function loadFBXFromFile(file: File, callbacks: ModelLoadCallbacks) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer) {
            try {
                const loader = new FBXLoader();
                const model = loader.parse(arrayBuffer as ArrayBuffer, "");
                callbacks.onSuccess(model);
            } catch (error) {
                callbacks.onError(error);
            }
        }
    };
    reader.onerror = () => callbacks.onError(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
}

/**
 * Load multiple models from files
 */
export function loadModelsFromFiles(
    files: File[],
    onModelLoaded: (model: any, filename: string) => void
) {
    files.forEach((file) => {
        loadModelFromFile(file, {
            onSuccess: (model) => onModelLoaded(model, file.name),
            onError: (error) => console.error(`Failed to load ${file.name}:`, error)
        });
    });
}
