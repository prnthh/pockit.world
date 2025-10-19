import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { SkyMesh } from "three/examples/jsm/objects/SkyMesh.js";
import * as THREE from "three";

const Sky = () => {
    const { scene, gl } = useThree();
    useEffect(() => {
        const sky = new SkyMesh();
        sky.scale.setScalar(450000);

        const s = sky as any;
        const params = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 8,
            azimuth: 180,
            exposure: (gl && (gl as any).toneMappingExposure) || 0.5,
        };

        const phi = THREE.MathUtils.degToRad(90 - params.elevation);
        const theta = THREE.MathUtils.degToRad(params.azimuth);
        const sun = new THREE.Vector3();
        sun.setFromSphericalCoords(1, phi, theta);

        // minimal, assumes SkyMesh exposes these props
        s.turbidity.value = params.turbidity;
        s.rayleigh.value = params.rayleigh;
        s.mieCoefficient.value = params.mieCoefficient;
        s.mieDirectionalG.value = params.mieDirectionalG;
        s.sunPosition.value.copy(sun);

        if (gl) (gl as any).toneMappingExposure = params.exposure;

        scene.add(sky);
        return () => void scene.remove(sky);
    }, [scene, gl]);

    return null;
}

export default Sky;