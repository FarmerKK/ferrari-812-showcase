# Test results — 15 October 2026

Current runtime source: `812-formed-cockpit-v5`.

- `qa/cabin-acceptance.cjs`: 33 passed, zero runtime errors.
- `qa/photo-cockpit-structure.cjs`: 17 passed, zero runtime errors.
- `qa/formed-surface-audit.cjs`: 3 passed.
- `qa/cabin-refinement.cjs`: 18 passed, zero runtime errors.

All 71 checks ran against the final v5 runtime. The previous v4 exterior regression passed 50 checks; it was not rerun for this interior-only revision. Passing checks does not certify visual fidelity or official CAD dimensions. Desktop viewports: 1600 × 1000; mobile: 390 × 844 in Chromium.

## Supplied defect angles

Reviewed renderer captures of the front gallery, instrument back, driver-side column close-up, wheel front and console. Current image files are `formed-gallery-finish.png`, `formed-column-driver-side.png`, `formed-instrument-back.png` and `formed-wheel-detail.png` under `output/playwright/`. Screenshots show unmodified runtime geometry/materials, with the normal interactive camera moved to the supplied problem angles.

The padded upper dashboard and lower fascia are closed volumes with end caps and return surfaces. Quantized edge inspection of the padded dashboard material covers 46,892 triangles and finds 0 open edges. This does not certify manifold topology of every vehicle component.

The formed metal carrier rises around the vent barrels, with rounded returns, integrated collars and a fine red edge. The dashboard wordmark is actual beveled metal lettering. The temperature lens uses a 2048 × 128 drawing sized to its physical aspect ratio, rather than the previous stretched label. Honeycomb cells sit in their frame ahead of the backing. The glovebox clears the right climate dial.

The steering frame moves forward 52 mm, to X = 0.026 m. The closed fairing is 128 mm along its local axis and joins the padded knee socket and rear bearing. The airbag has an enclosed rear cover. At the inspected instrument plane, fairing top is 0.746 m, below the dial opening. Rim, airbag and switches rotate together; fairing and paddles stay fixed. The instrument hood uses its own finely tiled perforation material to reduce stretched slots. Raised needle, LCD depths, closed hood back and outward roof normals remain intact.

Cluster width: 0.410 m; cluster top: 0.932 m; dashboard top: 0.861 m. These are model measurements rather than certified vehicle dimensions.

## Behavior and sound

Final checks cover six interior views, direct/header entry, material/color controls, save/reset/load, cutaway restoration, door-card hinges, complete assembled export from isolated Seats view, return to exterior, previous lighting restoration and mobile layout. Side-passage ray tests confirm the transmission bridge remains open underneath.

Idle/acceleration recordings decode and produce measured audio output. Start/rev/stop/mute/volume, keyboard operation, return to idle and mobile start/stop pass. The host forces actual tab visibility, so the production visibility-change handler is exercised with a temporary document.hidden fixture and the property restored. No actual background-tab transition, human listening review or physical-phone audio test is claimed. The CC0 Ferrari recordings are not identified as an 812 by their recordists.

## Files and build

The raw assembled export and compressed static model both import in Blender 4.5.3 LTS, each with 62 semantic groups, 1177 mesh objects, 71 materials and 41 embedded images. Neither has missing images. The static model is 24,048,544 bytes, below the 26,214,400-byte hosting asset limit. Browser exports remain uncompressed. Reports: `model-inspection.json`, `cutaway-export-inspection.json` and `qa-summary.json`.

`npm run build` succeeds with existing Three.js/application bundle-size advisories. No new hardware performance benchmark is claimed. Displays and opening mechanics remain illustrative; mobile was tested in resized Chromium, not a physical phone. This reconstruction is based on the supplied photographs rather than official CAD.
