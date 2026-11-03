import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
const $ = (id) => document.getElementById(id);
const defaults = { skin: "#b84e4b", hair: "#a19b93" };
const palettes = {
  skin: [
    "#b84e4b",
    "#df9e88",
    "#9d6859",
    "#739f91",
    "#9995c2",
    "#ddbd88",
  ],
  hair: [
    "#a19b93",
    "#e5d7bb",
    "#30303b",
    "#7395c9",
    "#bc7796",
    "#987553",
  ],
};
const skinMats = new Set(),
  hairMats = new Set();
let model, renderer, controls, camera, scene, box;
let mixer,
  activeAction,
  clips = [],
  restPose = [],
  lastFrame = 0,
  blinkStart = null,
  blinkSide = "both",
  exportingPose = false;
function capturePose() {
  const pose = [];
  model.traverse((o) =>
    pose.push({
      o,
      p: o.position.clone(),
      q: o.quaternion.clone(),
      s: o.scale.clone(),
      weights: o.morphTargetInfluences?.slice(),
    }),
  );
  return pose;
}
function applyPose(pose) {
  for (const { o, p, q, s, weights } of pose) {
    o.position.copy(p);
    o.quaternion.copy(q);
    o.scale.copy(s);
    if (weights)
      o.morphTargetInfluences.splice(0, weights.length, ...weights);
  }
  model.updateMatrixWorld(true);
}
function setBlink(left, right) {
  model?.traverse((o) => {
    const dict = o.morphTargetDictionary;
    if (!dict) return;
    for (const [key, value] of [
      ["blink_left", left],
      ["blink_right", right],
    ])
      if (dict[key] !== undefined)
        o.morphTargetInfluences[dict[key]] = value;
  });
}
const mouthOptions = [
  { label: "Smile" },
  { label: "Grin" },
  { label: "Round" },
  { label: "Open" },
];
let mouthBindings = [],
  selectedMouth = 0;
for (const [index, option] of mouthOptions.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bevel mouth-option";
  button.disabled = true;
  button.dataset.mouth = index;
  button.setAttribute("aria-label", "Mouth shape: " + option.label);
  button.setAttribute("aria-pressed", String(index === selectedMouth));
  const image = document.createElement("img");
  image.src = "./textures/mouths/speech_" + index + ".png";
  image.alt = "";
  button.append(image, document.createTextNode(option.label));
  button.onclick = () => selectMouth(index);
  $("mouthShapes").append(button);
}
function selectMouth(index) {
  if (!mouthBindings.length) return;
  selectedMouth = index;
  for (const binding of mouthBindings) {
    if (Array.isArray(binding.mesh.material))
      binding.mesh.material[binding.slot] = binding.materials[index];
    else binding.mesh.material = binding.materials[index];
  }
  for (const button of $("mouthShapes").children)
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.mouth) === index),
    );
}
async function setupMouthPicker() {
  mouthBindings = [];
  selectedMouth = 0;
  for (const button of $("mouthShapes").children) {
    button.disabled = true;
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.mouth) === 0),
    );
  }
  const originals = [];
  model.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    materials.forEach((material, slot) => {
      if (material.name.startsWith("mouth_speech_") && material.map)
        originals.push({ mesh, slot, material });
    });
  });
  if (!originals.length)
    return ["Mouth shapes unavailable for this model"];
  try {
    const loader = new THREE.TextureLoader();
    const textures = await Promise.all(
      [1, 2, 3].map((index) =>
        loader.loadAsync("./textures/mouths/speech_" + index + ".png"),
      ),
    );
    for (const { mesh, slot, material } of originals) {
      const variants = mouthOptions.map((option, index) => {
        const variant = material.clone();
        variant.name = "mouth_speech_" + index;
        const texture =
          index === 0 ? material.map : textures[index - 1].clone();
        if (index !== 0) {
          texture.flipY = material.map.flipY;
          texture.colorSpace = material.map.colorSpace;
          texture.wrapS = material.map.wrapS;
          texture.wrapT = material.map.wrapT;
          texture.magFilter = material.map.magFilter;
          texture.minFilter = material.map.minFilter;
          texture.repeat.copy(material.map.repeat);
          texture.needsUpdate = true;
        }
        variant.map = texture;
        variant.needsUpdate = true;
        return variant;
      });
      mouthBindings.push({ mesh, slot, materials: variants });
    }
    selectMouth(0);
    for (const button of $("mouthShapes").children)
      button.disabled = false;
    return [];
  } catch (error) {
    console.error(error);
    return ["Mouth shapes could not load"];
  }
}
let selectedAnimation = "";
function animationButton(name, label, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bevel";
  button.dataset.animation = name;
  button.textContent = label;
  button.disabled = disabled;
  button.setAttribute("aria-pressed", String(name === selectedAnimation));
  button.onclick = () => {
    selectedAnimation = name;
    for (const b of $("animation").children)
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.animation === name),
      );
    playAnimation();
  };
  return button;
}
function playAnimation() {
  if (!mixer) return;
  const clip = clips.find((c) => c.name === selectedAnimation);
  const nextAction = clip ? mixer.clipAction(clip) : null;
  if (nextAction === activeAction) return;
  activeAction?.fadeOut(0.25);
  nextAction?.reset().setEffectiveWeight(1).fadeIn(0.25).play();
  activeAction = nextAction;
}
for (const [id, side] of [
  ["blinkBoth", "both"],
  ["blinkLeft", "left"],
  ["blinkRight", "right"],
])
  $(id).onclick = () => {
    blinkSide = side;
    blinkStart = performance.now();
  };
function animationFromFBX(source, name) {
  const clip = source.animations[0]?.clone();
  if (!clip) throw new Error("No animation in " + name);
  clip.name = name;
  return clip;
}
async function setupPreview(embeddedClips) {
  mixer = new THREE.AnimationMixer(model);
  activeAction = null;
  clips = [...embeddedClips];
  restPose = capturePose();
  blinkStart = null;
  selectedAnimation = "";
  const picker = $("animation");
  picker.replaceChildren(animationButton("", "T-pose", true));
  const available = new Set();
  model.traverse((o) =>
    Object.keys(o.morphTargetDictionary || {}).forEach((k) =>
      available.add(k),
    ),
  );
  $("blinkLeft").disabled = !available.has("blink_left");
  $("blinkRight").disabled = !available.has("blink_right");
  $("blinkBoth").disabled =
    !available.has("blink_left") && !available.has("blink_right");
  for (const clip of clips)
    picker.append(animationButton(clip.name, clip.name === "idle" ? "Idle" : clip.name === "walk" ? "Walk" : clip.name === "run" ? "Run" : clip.name));
  const sources = [
    ["seatedIdle", "Seated idle", "Seated Idle.fbx"],
    ["crossJumpsRotation", "Cross jumps rotation", "Cross Jumps Rotation.fbx"],
    ["idleCrouching", "Idle crouching", "Idle Crouching.fbx"],
    ["crouchScoped", "Crouch scoped", "Crouch Scoped.fbx"],
    ["throw", "Throw", "Throw.fbx"],
  ];
  const loaded = await Promise.allSettled(
    sources.map(async ([name, label, file]) => ({
      clip: animationFromFBX(
        await new FBXLoader().loadAsync(
          "./animation/" + encodeURIComponent(file),
        ),
        name,
      ),
      label,
    })),
  );
  const failures = [];
  for (let i = 0; i < loaded.length; i++) {
    const result = loaded[i];
    if (result.status === "fulfilled") {
      clips.push(result.value.clip);
      picker.append(
        animationButton(result.value.clip.name, result.value.label),
      );
    } else {
      console.error(result.reason);
      failures.push(sources[i][1]);
    }
  }
  picker.firstElementChild.disabled = false;
  return failures;
}

function updatePreview(now) {
  const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
  lastFrame = now;
  if (exportingPose) return;
  mixer?.update(delta);
  updateExpression();
  if (blinkStart !== null) {
    const t = (now - blinkStart) / 650;
    const amount =
      t < 0.35
        ? Math.sin(((Math.max(0, t) / 0.35) * Math.PI) / 2)
        : t < 0.5
          ? 1
          : t < 1
            ? Math.cos((((t - 0.5) / 0.5) * Math.PI) / 2)
            : 0;
    setBlink(
      blinkSide === "right" ? 0 : amount,
      blinkSide === "left" ? 0 : amount,
    );
    if (t >= 1) blinkStart = null;
  }
}

function status(text, error = false) {
  $("status").textContent = text;
  $("status").classList.toggle("error", error);
}
function color(kind, value) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return;
  $(kind).value = value;
  $(kind + "Hex").value = value.toUpperCase();
  const selected = kind === "skin" ? skinMats : hairMats;
  for (const m of selected) m.color.set(value);
  for (const b of $(kind + "Swatches").children)
    b.setAttribute(
      "aria-pressed",
      String(b.dataset.color === value.toLowerCase()),
    );
}
for (const kind of ["skin", "hair"]) {
  for (const hex of palettes[kind]) {
    const b = document.createElement("button");
    b.style.setProperty("--color", hex);
    b.dataset.color = hex;
    b.title = hex;
    b.setAttribute("aria-label", kind + " " + hex);
    b.setAttribute("aria-pressed", "false");
    b.onclick = () => color(kind, hex);
    $(kind + "Swatches").append(b);
  }
  $(kind).oninput = (e) => color(kind, e.target.value);
  $(kind + "Hex").onchange = (e) => {
    if (/^#[0-9a-f]{6}$/i.test(e.target.value))
      color(kind, e.target.value);
    else e.target.value = $(kind).value.toUpperCase();
  };
}
$("name").oninput = () => {
  $("caption").textContent = $("name").value.trim() || "Pockit Remilio";
};
$("random").onclick = () => {
  for (const kind of ["skin", "hair"])
    color(
      kind,
      palettes[kind][Math.floor(Math.random() * palettes[kind].length)],
    );
};
$("reset").onclick = () => {
  color("skin", defaults.skin);
  color("hair", defaults.hair);
  $("angry").value = "0";
  updateExpression();
  frame();
};
function updateExpression() {
  const amount = Number($("angry").value) / 100;
  $("angryAmount").value = Math.round(amount * 100) + "%";
  model?.traverse((object) => {
    const index = object.morphTargetDictionary?.angry;
    if (index !== undefined) object.morphTargetInfluences[index] = amount;
  });
}
$("angry").oninput = updateExpression;
function updateOutfit() {
  if (!model) return;
  model.traverse((object) => {
    const name = object.name
      .replace(/[^a-z]/gi, "")
      .toLowerCase();
    if (name === "shirt")
      object.visible = $("top").value === "tshirt";
    if (name === "hornl" || name === "hornr")
      object.visible = $("headAccessory").value === "oni";
  });
}
$("top").onchange = updateOutfit;
$("headAccessory").onchange = updateOutfit;
function frame() {
  if (!box) return;
  const size = box.getSize(new THREE.Vector3()),
    target = box.getCenter(new THREE.Vector3());
  const height = size.y * 1.16;
  const width = size.x * 1.15;
  const d =
    Math.max(height, width / camera.aspect) /
    (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  controls.target.copy(target);
  camera.position.copy(target).add(new THREE.Vector3(0, 0, d));
  controls.minDistance = size.y * 0.28;
  controls.maxDistance = size.y * 5;
  controls.update();
}
async function load(url) {
  $("loading").hidden = false;
  status("Loading character…");
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    if (model) {
      mixer?.stopAllAction();
      scene.remove(model);
    }
    model = gltf.scene;
    scene.add(model);
    skinMats.clear();
    hairMats.clear();
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      for (const m of Array.isArray(o.material)
        ? o.material
        : [o.material]) {
        if (m.name === "skin") skinMats.add(m);
        if (m.name === "hair") hairMats.add(m);
      }
    });
    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    if (!skinMats.size || !hairMats.size)
      throw new Error("This GLB needs materials named skin and hair.");
    for (const kind of ["skin", "hair"]) color(kind, $(kind).value);
    updateOutfit();
    const [animationFailures, mouthFailures] = await Promise.all([
      setupPreview(gltf.animations),
      setupMouthPicker(),
    ]);
    updateExpression();
    frame();
    $("loading").hidden = true;
    for (const id of ["random", "save", "saveGlb", "saveVrm", "reset"])
      $(id).disabled = false;
    const failures = [
      ...animationFailures.map(
        (name) => "Animation unavailable: " + name,
      ),
      ...mouthFailures,
    ];
    status(
      failures.length ? failures.join("; ") : "Ready",
      !!failures.length,
    );
  } catch (e) {
    console.error(e);
    $("loading").hidden = true;
    status("Could not load the character.", true);
    const b = document.createElement("button");
    b.className = "load";
    b.textContent = "Choose character GLB";
    b.onclick = () => $("file").click();
    $("status").append(b);
  }
}
$("file").onchange = async () => {
  const f = $("file").files[0];
  if (f) {
    const u = URL.createObjectURL(f);
    await load(u);
    URL.revokeObjectURL(u);
  }
};
$("save").onclick = () => {
  renderer.render(scene, camera);
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 1500;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#8d9d91";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#ffffff25";
  for (let x = 24; x < 1200; x += 16)
    for (let y = 24; y < 1500; y += 16) ctx.fillRect(x, y, 3, 3);
  ctx.strokeStyle = "#fff8";
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, 1148, 1448);
  const src = renderer.domElement;
  const scale = Math.min(1120 / src.width, 1300 / src.height);
  ctx.drawImage(
    src,
    (1200 - src.width * scale) / 2,
    (1440 - src.height * scale) / 2,
    src.width * scale,
    src.height * scale,
  );
  ctx.fillStyle = "#fffbed";
  ctx.font = "italic 38px Arial";
  ctx.fillText($("caption").textContent, 55, 1420, 1090);
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename() + ".png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
};

function filename() {
  return (
    $("name")
      .value.trim()
      .replace(/[^a-z0-9_-]+/gi, "-") || "pockit-remilios"
  );
}
function downloadBinary(bytes, ext) {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "model/gltf-binary" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename() + "." + ext;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function unpackGLB(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67)
    throw new Error("Exporter did not return a GLB.");
  const size = view.getUint32(12, true);
  return {
    json: JSON.parse(
      new TextDecoder().decode(new Uint8Array(buffer, 20, size)),
    ),
    tail: new Uint8Array(buffer, 20 + size),
  };
}
function repackGLB(json, tail) {
  const text = new TextEncoder().encode(JSON.stringify(json));
  const length = (text.length + 3) & ~3;
  const result = new ArrayBuffer(20 + length + tail.length);
  const view = new DataView(result);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, result.byteLength, true);
  view.setUint32(12, length, true);
  view.setUint32(16, 0x4e4f534a, true);
  const bytes = new Uint8Array(result);
  bytes.fill(32, 20, 20 + length);
  bytes.set(text, 20);
  bytes.set(tail, 20 + length);
  return result;
}
function addVRM(buffer) {
  const { json, tail } = unpackGLB(buffer);
  const nodes = json.nodes || [];
  const byName = new Map(
    nodes.map((n, i) => [
      (n.name || "").replace(/[^a-z0-9]/gi, "").toLowerCase(),
      i,
    ]),
  );
  const names = {
    hips: "Hips",
    spine: "Spine",
    chest: "Spine1",
    upperChest: "Spine2",
    neck: "Neck",
    head: "Head",
  };
  for (const side of ["left", "right"]) {
    const s = side[0].toUpperCase() + side.slice(1);
    Object.assign(names, {
      [side + "Shoulder"]: s + "Shoulder",
      [side + "UpperArm"]: s + "Arm",
      [side + "LowerArm"]: s + "ForeArm",
      [side + "Hand"]: s + "Hand",
      [side + "UpperLeg"]: s + "UpLeg",
      [side + "LowerLeg"]: s + "Leg",
      [side + "Foot"]: s + "Foot",
      [side + "Toes"]: s + "ToeBase",
    });
    for (const finger of ["Thumb", "Index", "Middle", "Ring", "Little"]) {
      const mixamo = finger === "Little" ? "Pinky" : finger;
      const segments =
        finger === "Thumb"
          ? ["Metacarpal", "Proximal", "Distal"]
          : ["Proximal", "Intermediate", "Distal"];
      segments.forEach(
        (segment, i) =>
          (names[side + finger + segment] =
            s + "Hand" + mixamo + (i + 1)),
      );
    }
  }
  const humanBones = {};
  for (const [name, bone] of Object.entries(names)) {
    const index = byName.get(("mixamorig" + bone).toLowerCase());
    if (index !== undefined) humanBones[name] = { node: index };
  }
  const required = [
    "hips",
    "spine",
    "head",
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
    "leftUpperLeg",
    "leftLowerLeg",
    "leftFoot",
    "rightUpperLeg",
    "rightLowerLeg",
    "rightFoot",
  ];
  const missing = required.filter((n) => !humanBones[n]);
  if (missing.length)
    throw new Error("Missing VRM bones: " + missing.join(", "));
  const headBinds = { blink_left: [], blink_right: [], angry: [] };
  nodes.forEach((n, node) => {
    if (n.mesh === undefined) return;
    const mesh = json.meshes[n.mesh];
    const targets = mesh.extras?.targetNames || [];
    for (const key of Object.keys(headBinds)) {
      const index = targets.indexOf(key);
      if (index >= 0) headBinds[key].push({ node, index, weight: 1 });
    }
  });
  const preset = {};
  if (headBinds.blink_left.length)
    preset.blinkLeft = { morphTargetBinds: headBinds.blink_left };
  if (headBinds.blink_right.length)
    preset.blinkRight = { morphTargetBinds: headBinds.blink_right };
  if (headBinds.angry.length)
    preset.angry = { morphTargetBinds: headBinds.angry };
  if (headBinds.blink_left.length || headBinds.blink_right.length)
    preset.blink = {
      morphTargetBinds: [
        ...headBinds.blink_left,
        ...headBinds.blink_right,
      ],
    };
  json.extensionsUsed = [
    ...new Set([...(json.extensionsUsed || []), "VRMC_vrm"]),
  ];
  json.extensions = {
    ...json.extensions,
    VRMC_vrm: {
      specVersion: "1.0",
      meta: {
        name: $("name").value.trim() || "Pockit Remilio",
        version: "1.0",
        authors: ["prnth"],
        licenseUrl: "https://vrm.dev/licenses/1.0/",
        otherLicenseUrl: "https://viralpubliclicense.org/",
        copyrightInformation: "Licensed under the Viral Public License (VPL).",
        avatarPermission: "everyone",
        commercialUsage: "corporation",
        allowExcessivelyViolentUsage: true,
        allowExcessivelySexualUsage: true,
        allowPoliticalOrReligiousUsage: true,
        allowAntisocialOrHateUsage: true,
        allowRedistribution: true,
        modification: "allowModificationRedistribution",
        creditNotation: "unnecessary",
      },
      humanoid: { humanBones },
      ...(Object.keys(preset).length ? { expressions: { preset } } : {}),
    },
  };
  delete json.animations;
  return repackGLB(json, tail);
}
async function exportCharacter(format) {
  if (!model) throw new Error("Wait for the character to load.");
  model.updateMatrixWorld(true);
  // Export only the avatar: no preview lights, camera or card background.
  const pose = capturePose();
  exportingPose = true;
  try {
    const animations = format === "glb" ? clips.filter((clip) => ["idle", "walk", "run"].includes(clip.name)) : [];
    applyPose(restPose);
    updateExpression();
    const bytes = await new GLTFExporter().parseAsync(model, {
      binary: true,
      onlyVisible: true,
      trs: true,
      maxTextureSize: 4096,
      animations,
    });
    return format === "vrm" ? addVRM(bytes) : bytes;
  } finally {
    applyPose(pose);
    exportingPose = false;
  }
}
let exporting = false;
async function saveModel(format) {
  if (exporting) return;
  exporting = true;
  for (const id of ["saveGlb", "saveVrm"]) $(id).disabled = true;
  status("Preparing " + format.toUpperCase() + "…");
  try {
    const bytes = await exportCharacter(format);
    downloadBinary(bytes, format);
    status(format.toUpperCase() + " saved");
  } catch (e) {
    console.error(e);
    status(e.message || "Could not export this character.", true);
  } finally {
    exporting = false;
    for (const id of ["saveGlb", "saveVrm"]) $(id).disabled = false;
  }
}
$("saveGlb").onclick = () => saveModel("glb");
$("saveVrm").onclick = () => saveModel("vrm");

try {
  renderer = new THREE.WebGLRenderer({
    canvas: $("canvas"),
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  scene.add(new THREE.HemisphereLight(0xfff7ee, 0x857884, 2.4));
  const key = new THREE.DirectionalLight(0xfff5e7, 2.7);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9e9ff, 1.1);
  fill.position.set(4, 2, -3);
  scene.add(fill);
  new ResizeObserver(() => {
    const r = $("canvas").getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    frame();
  }).observe($("card"));
  renderer.setAnimationLoop((now) => {
    updatePreview(now);
    controls.update();
    renderer.render(scene, camera);
  });
  load("./remilio.glb");
} catch (e) {
  console.error(e);
  $("loading").hidden = true;
  status(
    "The 3D preview needs WebGL. Please try a browser with hardware acceleration enabled.",
    true,
  );
}
