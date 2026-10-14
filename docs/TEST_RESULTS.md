# Test results — 15 October 2026

Production build verification completed in Chromium:

- qa/detailed-acceptance.cjs: 50 passed, 0 JavaScript runtime errors.
- qa/cabin-acceptance.cjs: 33 passed, 0 JavaScript runtime errors.
- qa/cabin-smoke.cjs: 5 passed, 0 runtime errors after adding direct Cockpit navigation and camera warmup handling.
- qa/cabin-refinement.cjs: 18 passed, 0 runtime errors. Covers measured cluster/dashboard bounds, repeated camera transitions, actual audio output, start/rev/stop/mute/volume, return to idle, tab visibility and mobile sound controls.

Total: 106 functional checks. Passing these checks does not certify visual fidelity to official Ferrari CAD.

Desktop viewports: 1440 × 900 and 1600 × 1000. Mobile viewport: 390 × 844.

## Current cockpit

Verified all six interior views, direct ?view=interior entry, header Cockpit entry, seat/stitched seam/belt colors, scanned leather maps, suede/physical leather switching, carbon inlay switching, save/reset/load, roof cutaway restoration, animated door cards, complete vehicle export from isolated seat view, return to exterior and restoration of the previous environment. Mobile view switching and finishes work without horizontal overflow.

Reviewed actual production renders of the dashboard, driver wheel/cluster, console, seats, top layout, door card and the supplied problem side angle. The cluster is now 0.396 m wide and reaches 0.928 m high; dashboard reaches 0.850 m and wheel crown 1.021 m. The previous extruded hood reached approximately 1.059 m. Seat inserts/stripes are material regions on shared padded geometry, seam paths follow that surface, and headrest embroidery uses a conforming alpha-cut patch. Leather roughness is softened from the scanned map. Vents are smaller, pedal stems and door handle mounts are added. The V12/manifold remains ahead of the cabin firewall.

The idle and acceleration MP3 recordings decode and produce measured frequency output in Chromium. Rev finishes back at idle; stop interrupts both sources. Volume, mute, hidden-tab stop, keyboard operation and mobile start/stop passed. No human listening review or physical-phone audio test is claimed. The source recordists do not identify an 812, and About/credits state this limitation.

## Existing features

50 regression checks cover 62 selectable groups, raycasting/orbit/zoom, paint and material finishes, wheel styles, calipers, aero, upholstery, lamps, configuration persistence, component selection/detachment, exact reassembly within 1e-6, door/hood/wheel/steering mechanics, original cameras, all four environments, PNG and full assembled GLB downloads, and mobile layout.

## Model export

Both the static compressed model and the raw export made from isolated seat view were imported in Blender 4.5.3 LTS. Each contains 62 top-level semantic groups, 33 embedded images and no missing images. Blender expands instanced perforations, so its mesh count (1167) differs from live Three.js objects. The downloadable compressed assembled GLB is 14,504,584 bytes; the startup body template is approximately 3.7 MB plus local leather maps.

Reports: model-inspection.json and cutaway-export-inspection.json.

## Build and performance

npm run build succeeds, with bundle-size advisories for Three.js and the app/lighting chunk. Scene sample from the full regression: 517 live mesh objects including hidden style variants, 893 calls and 1,983,116 triangles across shadow/postprocessing passes, 84 FPS at high quality in the test browser. Camera/material shader warm-up samples are much slower. These are samples, not device guarantees.

Rigid interior geometry is batched by material per component. Unseen wheel/engine assemblies are hidden during cockpit inspection and restored for exterior/export. Adaptive DPR remains available; performance mode bypasses SSAO/bloom. Camera transitions restart the performance sample after shader warmup. Adaptive quality requires three slow samples before reducing quality and can recover on desktop.

## Limits

Mobile was checked in resized Chromium rather than physical Android/iOS hardware. The cockpit is a visual reconstruction from the supplied blueprint, not official CAD or a safety-certified seat/restraint model. Displays and switches depict static showroom values. Engine/suspension mechanics remain illustrative. External arbitrary GLB compatibility is not certified. Reflections use generated PMREM; no external HDRI or GTAO is bundled.

Legacy procedural acceptance/final-smoke files are historical. Use the detailed and cabin suites for the current model.
