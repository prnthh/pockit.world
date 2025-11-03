import { useRapier } from "@react-three/rapier";
import { useEffect, useState } from "react";
import { PlaneGeometry } from "three";

const Heightfield = ({ heightFieldWidth = 200, heightFieldDepth = 200 }) => {
    const { world, rapier } = useRapier();
    const [heightFieldGeometry, setHeightFieldGeometry] = useState<PlaneGeometry>(new PlaneGeometry());

    useEffect(() => {
        if (!world || !rapier) return;

        const heightFieldArray = Array.from({
            length: heightFieldDepth * heightFieldWidth,
        }).map((_, index) => {
            return 0;
            // return Math.random();
        });
        const heightField = new Float32Array(heightFieldArray);

        const heightFieldGeometry = new PlaneGeometry(
            heightFieldWidth,
            heightFieldDepth,
            heightFieldWidth - 1,
            heightFieldDepth - 1,
        );

        heightField.forEach((v, index) => {
            heightFieldGeometry.attributes.position.array[index * 3 + 2] = v;
        })
        heightFieldGeometry.scale(1, -1, 1);
        heightFieldGeometry.rotateX(-Math.PI / 2);
        heightFieldGeometry.rotateY(-Math.PI / 2);
        heightFieldGeometry.computeVertexNormals();

        setHeightFieldGeometry(heightFieldGeometry);

        // use the rapier instance from the context so the wasm/raw bindings are initialized
        const heightfieldDesc = rapier.ColliderDesc.heightfield(
            heightFieldWidth - 1,
            heightFieldWidth - 1,
            heightField,
            { x: heightFieldWidth, y: 1, z: heightFieldDepth },
        );

        const collider = world.createCollider(heightfieldDesc);
        collider.setTranslation({ x: 0, y: 0, z: 0 });

        return () => {
            world.removeCollider(collider, false);
        };
    }, [world]);

    return (
        <>
            <mesh geometry={heightFieldGeometry} receiveShadow>
                <meshStandardMaterial side={2} color="#444" />
            </mesh>
        </>
    );
};

export default Heightfield;