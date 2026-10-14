# Test results — 15 October 2026

Production build verification completed in Chromium:

- qa/detailed-acceptance.cjs: 50 passed, 0 JavaScript runtime errors.
- qa/cabin-acceptance.cjs: 33 passed, 0 JavaScript runtime errors.
- qa/cabin-smoke.cjs: 5 passed, 0 runtime errors after adding direct Cockpit navigation and camera warmup handling.

Desktop viewports: 1440 × 900 and 1600 × 1000. Mobile viewport: 390 × 844.

## Current cockpit

Verified all six interior views, direct ?view=interior entry, header Cockpit entry, seat/stitched seam/belt colors, scanned leather maps, suede/physical leather switching, carbon inlay switching, save/reset/load, roof cutaway restoration, animated door cards, complete vehicle export from isolated seat view, return to exterior and restoration of the previous environment. Mobile view switching and finishes work without horizontal overflow.

Manually reviewed actual renders of the dashboard, driver wheel/cluster, console, seats, top layout and door card. Improvements include padded curved seat contours, thin 3D stitching, flat woven belts, recessed vent louvers, steering controls/paddles, readable displays, scanned leather normals/roughness, area lights and high-quality SSAO. The V12/manifold is fitted ahead of the new cabin firewall; the earlier console intersections are removed.

## Existing features

50 regression checks cover 62 selectable groups, raycasting/orbit/zoom, paint and material finishes, wheel styles, calipers, aero, upholstery, lamps, configuration persistence, component selection/detachment, exact reassembly within 1e-6, door/hood/wheel/steering mechanics, original cameras, all four environments, PNG and full assembled GLB downloads, and mobile layout.

## Model export

Both the static compressed model and the raw export made from isolated seat view were imported in Blender 4.5.3 LTS. Each contains 62 top-level semantic groups, 34 embedded images and no missing images. Blender expands instanced perforations, so its mesh count (1169) differs from live Three.js objects. The downloadable compressed assembled GLB is 13,534,560 bytes; the startup body template is approximately 3.7 MB plus local leather maps.

Reports: model-inspection.json and cutaway-export-inspection.json.

## Build and performance

npm run build succeeds, with bundle-size advisories for Three.js and the app/lighting chunk. Scene sample from the full regression: 519 live mesh objects including hidden style variants, 897 calls and 1,679,412 triangles across shadow/postprocessing passes, 143 FPS at high quality in the test browser. These are samples, not device guarantees.

Rigid interior geometry is batched by material per component. Unseen wheel/engine assemblies are hidden during cockpit inspection and restored for exterior/export. Adaptive DPR remains available; performance mode bypasses SSAO/bloom. Camera transitions restart the performance sample after shader warmup.

## Limits

Mobile was checked in resized Chromium rather than physical Android/iOS hardware. The cockpit is a visual reconstruction from the supplied blueprint, not official CAD or a safety-certified seat/restraint model. Displays and switches depict static showroom values. Engine/suspension mechanics remain illustrative. External arbitrary GLB compatibility is not certified. Reflections use generated PMREM; no external HDRI or GTAO is bundled.

Legacy procedural acceptance/final-smoke files are historical. Use the detailed and cabin suites for the current model.
