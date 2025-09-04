import { MToonMaterialLoaderPlugin, VRMLoaderPlugin } from "@pixiv/three-vrm";
import { MToonNodeMaterial } from "@pixiv/three-vrm/nodes";
import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SkeletonUtils } from "three-stdlib";
import { Object3D } from "three/webgpu";

const VRMModel = ({ modelUrl = "https://raw.githubusercontent.com/prnthh/Pockit/refs/heads/main/web/1.vrm", position, scale, children }: { modelUrl?: string, position?: [number, number, number], scale?: [number, number, number], children?: React.ReactNode }) => {

    useEffect(() => {
        const loader = new GLTFLoader();

        // Register a VRMLoaderPlugin
        loader.register((parser) => {

            // create a WebGPU compatible MToonMaterialLoaderPlugin
            const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {

                // set the material type to MToonNodeMaterial
                materialType: MToonNodeMaterial,

            });

            return new VRMLoaderPlugin(parser, {

                // Specify the MToonMaterialLoaderPlugin to use in the VRMLoaderPlugin instance
                mtoonMaterialPlugin,

            });

        });

        loader.load(
            // URL of the VRM you want to load
            modelUrl,

            // called when the resource is loaded
            (gltf) => {
                // retrieve a VRM instance from gltf
                const vrm = gltf.userData.vrm;

                // add the loaded vrm to the scene
                setClone(SkeletonUtils.clone(vrm.scene as unknown as Object3D));

                // deal with vrm features
                console.log(vrm);
            },

            // called while loading is progressing
            (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),

            // called when loading has errors
            (error) => console.error(error),
        );
    }, []);


    const [clone, setClone] = useState<Object3D | undefined>(undefined);

    if (!clone) return null;

    return (
        <primitive object={clone} position={position} scale={scale}>
            {children}
        </primitive>
    );
};

export default VRMModel;
