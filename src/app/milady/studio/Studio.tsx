"use client";

import Script from "next/script";
import "./studio.css";

const importMap = JSON.stringify({
  imports: {
    three: "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/",
    "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@2.1.2/lib/three-vrm.module.min.js",
  },
});

export default function Studio() {
  return (
    <main id="studio-root" className="pockit-milady-studio" aria-label="Pockit Milady Studio">
      <section id="ui" className="hidden" aria-label="Studio settings">
        <button id="uiClose" title="Back to the buttons">✕</button>
        <div id="status">loading…</div>
        <label>
          milady #{" "}
          <input id="milady" type="text" inputMode="numeric" placeholder="1–1111" style={{ width: 56 }} />
          <button id="loadMilady">load</button>
          <button id="randMilady" title="Random milady">🎲</button>
          <button id="kbMilady" className="kbtoggle" title="Toggle keyboard">⌨</button>
        </label>
        <label><input type="checkbox" id="mirror" defaultChecked /> mirror</label>
        <label><input type="checkbox" id="arms" defaultChecked /> arm tracking</label>
        <label><input type="checkbox" id="camMouth" defaultChecked /> camera mouth</label>
        <label><input type="checkbox" id="micMouth" /> mic mouth</label>
        <label title="Changes your voice in recordings">
          voice fx:{" "}
          <select id="voice" defaultValue="off">
            <option value="off">off</option>
            <option value="deep">deep</option>
            <option value="robot">robot</option>
            <option value="cute">cute</option>
          </select>
        </label>
        <label><input type="checkbox" id="flipPitch" /> flip pitch</label>
        <label><input type="checkbox" id="flipYaw" /> flip yaw</label>
        <label><input type="checkbox" id="flipRoll" /> flip roll</label>
        <div className="fxrow">
          fx:{" "}
          <label><input type="checkbox" id="fxSparkle" /> ✨</label>
          <label><input type="checkbox" id="fxHeart" /> 💕</label>
          <label><input type="checkbox" id="fxRainbow" /> 🌈</label>
          <label><input type="checkbox" id="fxScan" /> 📺</label>
          <label><input type="checkbox" id="fxFish" /> 🐟</label>
        </div>
        <label>
          background:{" "}
          <select id="bg" defaultValue="transparent">
            <option value="transparent">transparent</option>
            <option value="green">green</option>
            <option value="magenta">magenta</option>
            <option value="white">white</option>
            <option value="black">black</option>
            <option value="smiley">cult</option>
            <option value="image">image</option>
          </select>
        </label>
        <input type="file" id="bgFile" accept="image/*" hidden />
        <button id="bgPick">pick bg image</button>
        <button id="rezero">re-zero head</button>
        <button id="recordBtn">● record</button>
        <div style={{ opacity: 0.7 }}>✕ or H closes this panel<br />drop a picture anywhere = bg image</div>
        <div className="linksrow">
          <a href="https://github.com/wables411/milady-tracker" target="_blank" rel="noopener noreferrer">github</a>{" · "}
          <a href="https://pockit.world/milady" target="_blank" rel="noopener noreferrer">pockit milady</a>{" · "}
          <a href="https://remilia.net" target="_blank" rel="noopener noreferrer">remilia.net</a>
        </div>
      </section>

      <nav id="bigbar" className="hidden" aria-label="Studio controls">
        <button data-act="milady">🤍 Milady #</button>
        <button data-act="mirror">🔄 Mirror</button>
        <button data-act="rezero">🎯 Fix Head</button>
        <button data-act="bg" title="Click to cycle background; right-click, long-press, or drop a picture to set an image">🖼 BG</button>
        <button data-act="record">⏺ Record</button>
        <button data-act="fx">✨ FX</button>
        <button data-act="settings" title="Advanced settings">⚙</button>
        <button data-act="hide">☁️ Hide</button>
      </nav>

      <button id="peek" className="hidden" title="Show buttons">♡</button>
      <div id="scan" />

      <div id="miladyDlg" className="hidden" role="dialog" aria-modal="true" aria-labelledby="milady-dialog-title">
        <div className="dlgbox">
          <div id="milady-dialog-title" className="dlgtitle">POCKIT MILADY</div>
          <div className="dlglabel">token # (blank = Pockit Milady #1)</div>
          <input id="dlgId" type="text" inputMode="numeric" placeholder="1–1111" />
          <button id="dlgKb" className="kbtoggle" title="Toggle keyboard">⌨</button>
          <div className="dlgrow">
            <button id="dlgLoad">Load</button>
            <button id="dlgRandom">🎲 Random</button>
            <button id="dlgCancel">Cancel</button>
          </div>
        </div>
      </div>

      <video id="cam" playsInline hidden />
      <script type="importmap" dangerouslySetInnerHTML={{ __html: importMap }} />
      <Script src="/milady-studio/tracker.js" type="module" strategy="afterInteractive" />
    </main>
  );
}
