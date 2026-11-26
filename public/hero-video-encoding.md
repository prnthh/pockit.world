# Transparent hero video

WebM is the default delivery format for the homepage mascot. MOV is the compatibility fallback for iOS and Safari. Both contain the same three-second loop. Export both from the transparent PNG frames at 1152 × 792 and 30 fps.

| Source order | File | Encoding | Size |
| --- | --- | --- | --- |
| 1 | `vampire-cat.mov` | QuickTime, HEVC with alpha, tagged `hvc1` | 1.30 MiB |
| 2 | `vampire-cat.webm` | WebM, VP9 with alpha | 630 KiB |

**MOV fallback for iOS and Safari.** The export confirmed on iOS Chrome used Apple’s AVAssetWriter with `hevcWithAlpha`. Render each frame into a premultiplied BGRA pixel buffer and set the encoder’s `kVTCompressionPropertyKey_AlphaChannelMode` to `kVTAlphaChannelMode_PremultipliedAlpha` to match. This resolved the white outline around the chrome wings. [Apple’s HEVC with alpha guide](https://developer.apple.com/documentation/avfoundation/using-hevc-video-with-alpha)

**WebM default.** Encode with `libvpx-vp9` and `yuva420p` to preserve transparency. The current export uses CRF 25 and `-b:v 0`.

Keep MOV first in the HTML source list because some WebKit versions accept VP9 but render its transparent pixels as black. Listing MOV first lets those browsers select HEVC immediately. Browsers that skip the QuickTime source proceed to WebM.

**Check a replacement.** Confirm the new MOV on an iPhone and the WebM in desktop Chrome. Inspect the thin wing tips over the page background for a bright fringe, and check that the background shows through the gaps between each wing and the body. In the browser console, `document.querySelector("video").currentSrc` shows which file the homepage loaded.
