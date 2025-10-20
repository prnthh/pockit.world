
import { useFrame, useThree } from "@react-three/fiber";
import { PostProcessing, WebGPURenderer } from "three/webgpu";
import { pass, mrt, output, emissive, saturation, blendColor, directionToColor, normalView, roughness, metalness, vec2, sample, colorToDirection, renderOutput, step, mix, vec3, dFdx, dFdy, length, max, select, array, screenCoordinate, uniform, Fn, If, float, int } from 'three/tsl';
import { useEffect, useState } from "react";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import * as THREE from "three";
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { ssr } from "three/examples/jsm/tsl/display/SSRNode.js";
import { smaa } from "three/examples/jsm/tsl/display/SMAANode.js";
import { sobel } from "three/examples/jsm/tsl/display/SobelOperatorNode.js";

// @ts-expect-error tsl module missing types
const getValue = Fn(([brightness, pos]) => {
    const gridSize = 1.0; // dither grid size, adjustable
    // Calculate position in 4x4 dither matrix
    const pixel = pos.div(gridSize).mod(4.0).floor();
    const x = pixel.x.toInt();
    const y = pixel.y.toInt();
    // 4x4 Bayer matrix threshold
    const threshold = select(x.equal(0),
        select(y.equal(0), 0.0 / 16.0,
            select(y.equal(1), 12.0 / 16.0,
                select(y.equal(2), 3.0 / 16.0, 15.0 / 16.0))),
        select(x.equal(1),
            select(y.equal(0), 8.0 / 16.0,
                select(y.equal(1), 4.0 / 16.0,
                    select(y.equal(2), 11.0 / 16.0, 7.0 / 16.0))),
            select(x.equal(2),
                select(y.equal(0), 2.0 / 16.0,
                    select(y.equal(1), 14.0 / 16.0,
                        select(y.equal(2), 1.0 / 16.0, 13.0 / 16.0))),
                select(y.equal(0), 10.0 / 16.0,
                    select(y.equal(1), 6.0 / 16.0,
                        select(y.equal(2), 9.0 / 16.0, 5.0 / 16.0))))));
    // Early return for extreme values
    return select(brightness.greaterThan(16.0 / 17.0), 0,
        select(brightness.lessThan(1.0 / 17.0), 1,
            select(brightness.lessThan(threshold), 1, 0)));
});

const RenderPipeline = () => {
    const { gl, scene, camera } = useThree()

    const [postProcessing, setPostProcessing] = useState<PostProcessing>(new PostProcessing(gl as unknown as WebGPURenderer))

    useEffect(() => {
        // const scenePass = pass(scene, camera, {
        //     magFilter: THREE.NearestFilter,
        //     minFilter: THREE.NearestFilter,
        // })

        // scenePass.setMRT(mrt({ output }))

        // const scenePassColor = scenePass.getTextureNode('output')

        // const strength = 0.2
        // const radius = 0.02
        // const threshold = 0
        // const bloomPass = bloom(scenePassColor, strength, radius, threshold)

        // const outputNode = blendColor(scenePassColor, bloomPass)

        const scenePass = pass(scene, camera, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
        // section: ao pass
        // scenePass.setMRT(mrt({
        //     output: output,
        //     normal: directionToColor(normalView),
        //     metalrough: vec2(metalness, roughness)
        // }));

        // const scenePassColor = scenePass.getTextureNode('output');
        // const scenePassNormal = scenePass.getTextureNode('normal');
        // const scenePassDepth = scenePass.getTextureNode('depth');
        // const scenePassMetalRough = scenePass.getTextureNode('metalrough');
        // const sceneNormal = sample((uv) => {

        //     return colorToDirection(scenePassNormal.sample(uv));

        // });

        // // const ssrPass = ssr(scenePassColor, scenePassDepth, sceneNormal, scenePassMetalRough.r, scenePassMetalRough.g);
        // // ssrPass.maxDistance.value = 10;
        // // ssrPass.blurQuality.value = 1;
        // // ssrPass.thickness.value = 0.015;
        // // ssrPass.resolutionScale = 0.5;

        // const aoPass = ao(scenePassDepth, sceneNormal, camera);
        // // @ts-expect-error custom property
        // aoPass.radius = 1;
        // // @ts-expect-error custom property
        // aoPass.scale = 0.2;
        // // @ts-expect-error custom property
        // aoPass.thickness = 1;

        // const blendPassAO = aoPass.getTextureNode().mul(scenePassColor);
        // postProcessing.outputNode = blendPassAO;

        // section: sobel edge detection blended with scene color
        // const scenePassColor = renderOutput(scenePass);
        // const edgeNode = sobel(scenePassColor);
        // const ditheredEdge = getValue(edgeNode.r, screenCoordinate);
        // const outputNode = mix(scenePassColor, vec3(0), ditheredEdge);
        // postProcessing.outputNode = outputNode;

        // section: sobel edge detection blended with scene color
        // const scenePassColor = renderOutput(scenePass);
        // const edgeNode = sobel(scenePassColor);
        // const edgeMask = step(0.8, edgeNode.r);
        // const outputNode = mix(scenePassColor, vec3(0), edgeMask);
        // postProcessing.outputNode = outputNode;

        // section: no post-processing
        postProcessing.outputNode = scenePass;

        // const outputNode = smaa(blendPassAO);
        // const outputNode = smaa(blendColor(blendPassAO, ssrPass));
        // postProcessing.outputNode = outputNode;
    }, [gl, scene, camera])

    useFrame(() => { postProcessing?.render() }, 1)

    return null
}
export default RenderPipeline;