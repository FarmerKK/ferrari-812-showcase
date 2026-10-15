# Test results — 15 October 2026

Current photographic cockpit: `812-photo-cockpit-v4`.

- `qa/cabin-acceptance.cjs`: 33 passed after the final steering and finishing changes; no JavaScript runtime errors.
- `qa/photo-cockpit-structure.cjs`: 17 passed after the final changes; no runtime errors.
- `qa/cabin-refinement.cjs`: 18 passed after the final changes; no runtime errors.
- `qa/detailed-acceptance.cjs`: 50 passed earlier in this photographic cockpit revision, before the final wheel and surface finishing pass; no runtime errors.

118 checks across this revision, with the 68 cockpit/structure/audio checks rerun on the final runtime source. These results verify behavior and measured geometry, not fidelity to official CAD. Desktop viewports: 1440 × 900 and 1600 × 1000. Mobile: 390 × 844 in Chromium.

## Geometry and visual review

Inspected actual renderer captures of the supplied front-wheel, side-column, console, vent-gallery and instrument-back problem angles. The wheel now has a shallower, smaller airbag, a single flared carbon lower spoke, curved lower rim, separate switch banks, smaller start/Manettino controls, integrated thumb rests and slim bent paddles. Rim, airbag and switches rotate together; column fairing and paddles remain fixed. The tapered inclined fairing enters the padded knee bolster below the tachometer, rather than projecting through its face.

Cluster width is 0.410 m and top 0.932 m. Dashboard top is 0.858 m; wheel crown is 1.016 m. At the inspected instrument plane, column fairing top is 0.759 m. Ray tests find no obstruction through the center-console side passage and confirm the right climate knob is visible ahead of the glovebox. The instrument hood has an enclosed back and outward-facing roof normals. Fine hex grille cells remain inside the recessed gallery below the leather eyebrow.

The driver camera uses an elevated eye point and 55-degree vertical field of view. Repeated camera transitions settle correctly. Seat geometry, scanned leather, surface-following seams and conforming headrest embroidery remain intact.

## Interaction and sound

Final cockpit checks cover all six views, direct/header entry, material/color controls, save/reset/load, roof cutaway restoration, animated door cards, complete assembled export from isolated seat view, return to exterior, previous environment restoration and mobile layout/finishes. Earlier full regression covers 62 semantic groups, selection, detachment/reassembly, paint/wheels/brakes/lights, mechanics, environment selection and downloads.

Idle and acceleration recordings decode and produce measured audio output. Start, rev, stop, mute, volume, keyboard operation, return to idle and mobile start/stop pass. The automation host forces actual tab visibility: the production visibility-change handler was tested with a temporary document.hidden fixture and the property restored. An actual background-tab transition is not claimed for this run. No human listening review or physical-phone audio test is claimed. Recordists do not identify an 812; About/credits state that limitation.

## Export and build

The static compressed model and the raw complete export from isolated Seats view both import in Blender 4.5.3 LTS with 62 top-level semantic groups, 1178 mesh objects, 71 materials and 42 embedded images; no missing images. Downloadable compressed model: 22,074,372 bytes, below the 26,214,400-byte per-asset hosting limit. Browser exports remain uncompressed. See `model-inspection.json` and `cutaway-export-inspection.json`.

`npm run build` succeeds with existing Three.js/app bundle-size advisories. Batching preserves articulated steering frames. Camera shader warmup and adaptive quality remain active. No new device performance benchmark is claimed in this finishing pass.

The cockpit is a photographic reconstruction. Displays, engine/suspension mechanics and switches are illustrative. Mobile was checked in resized Chromium. No exact photographic identity, engineering certification or arbitrary external GLB compatibility is claimed.
