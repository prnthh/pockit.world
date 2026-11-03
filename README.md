# Pockit World

Plain HTML pages, one shared stylesheet, and vanilla JavaScript. No framework, dependencies, or build step.

## Preview locally

Serve the `public/` folder with Python:

```sh
python3 -m http.server 8000 --directory public
```

Or use a basic Node folder server:

```sh
npx http-server public -p 8000
```

Open http://localhost:8000. Any static HTTP server works; there is no project setup or custom server. Serve over HTTP rather than opening HTML files directly, so modules and 3D assets load correctly.

## Edit

- `public/index.html` — home
- `public/about/index.html` — about
- `public/milady/index.html` — Milady collection and model picker
- `public/milady/studio/index.html` — camera and pose tracking studio
- `public/remilio/index.html` — Remilio maker
- `public/os.html` — desktop experiment
- `public/styles.css` — all first-party page styles, with scoped tool styles
- `public/site.js` — card effects, logo audio, and model selection
- `public/milady-studio/tracker.js` — studio tracking and recording
- `public/milady-studio/smiley.jpg` — studio backdrop
- `public/remilio/maker.js` — Remilio customization and exports

Pages contain their own navigation and metadata, so their content works without a client-side rendering step. When changing the shared header, update the home, about, and Milady HTML files together.

The 3D tools load pinned libraries from CDNs; the Milady viewer and downloads use prnth.com. These features require an internet connection. Camera and microphone tracking require HTTPS or localhost and browser permission. The desktop experiment retains its existing CDN libraries and vendor styles.

## Deploy

GitHub Pages publishes `public/` directly on pushes to `main`, using `.github/workflows/pages.yml`. The folder includes `CNAME` for pockit.world and `.nojekyll`. Any static host can serve the same folder; no build command is required. Only publish `public/`, since the repository root can contain local data.
