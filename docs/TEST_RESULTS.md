# Test results — 14 October 2026

## Browser acceptance suite

`qa/acceptance.cjs` completed with **50 passed assertions, 0 JavaScript runtime errors** against the Vite production build in a real Chromium browser. Desktop viewport: 1440 × 900. Mobile viewport: 390 × 844.

| Area | Verified result |
| --- | --- |
| Real 3D model | 57 semantic component groups; procedural meshes, not a static image |
| Direct interaction | Canvas click raycasts to a component; mouse drag orbits and wheel scrolling zooms |
| Paint | Preset and arbitrary color picker alter the actual material; matte, pearl and carbon take effect |
| Wheels and brakes | Split/star geometry switches; wheel and caliper colors change |
| Exterior/interior | Aero geometry changes, mirror carbon finish, seat color and suede roughness |
| Lamps | Headlights, brake-light emissive intensity and turn-indicator state |
| Persistence | Save/reset/load produces the same validated configuration in LocalStorage |
| Selection | Search, focus, highlight, detach and reassemble a selected hood |
| Assembly | All 57 groups detach; reassembly restores each original position/quaternion within 1e-6 |
| Mechanical animation | Doors move with glazing/mirrors, hood opens, wheels spin and steering updates |
| Cameras | Orbit, front, rear, left, right, top, interior, wheel, engine and cinematic |
| Environments | Daylight, golden hour, night and studio update environment mode and lighting |
| Downloads | Actual canvas PNG and assembled GLB files generated and saved |
| Mobile | No horizontal overflow, paint change and exploded view work at the mobile breakpoint |

The 50-assertion pass followed the body curvature rewrite. A subsequent focused regression (`qa/final-smoke.cjs`) completed with **12 passed checks and 0 runtime errors** covering final headlight surfaces, rear fascia closure, exact reassembly, final GLB, and responsive camera framing at 1348 × 1244 as well as mobile. The delivered GLB was re-inspected in Blender after this final pass.

## Visual inspection

Reviewed generated images of front, rear, side, top, cockpit, wheel, engine, exploded view, all four environments, desktop and mobile. Corrections included:

- Hermite interpolation between body stations, curved shoulder-to-side surfaces and rounded nose planform
- Continuous fender caps replacing separate flat strips, round arch lips and repositioned wheels inside the arches
- Headlight lenses following the actual fender surface
- Continuous rear fascia filling the earlier open panel gaps
- Inner door panels moved inside the shell
- Canvas hit-testing layer restored; accessible labels added to mobile icon controls
- Camera distance adapts to tall desktop layouts
- Development watcher excludes screenshot/download artifacts to avoid Windows EBUSY crashes

## Model processing

The GLB was imported with Blender 4.5.3 LTS in background mode. `docs/model-inspection.json` records component groups, mesh objects, embedded materials/images and bounds. Repeated meshes are expanded by Blender, so the object count differs from the web renderer. No missing images were found in the inspected exports.

## Build and performance

`npm run build` succeeds. Installed dependency audit reported 0 known vulnerabilities. Vite reports a bundle-size advisory for the Three.js vendor chunk (~567 kB minified, ~145 kB gzip); GLB loader/exporter and Draco are separate lazy chunks.

Repeated geometry is instanced. The car has 436 live mesh objects after the final surface refinements. Final high-quality scene diagnostics recorded 953 rendering calls and 774,404 triangles across shadow and postprocessing passes. Adaptive quality, DPR capping, shadow-map quality and bloom bypass are implemented. FPS is device/browser dependent; the acceptance browser recorded samples above 60 FPS, but no physical device performance guarantee is made.

## Verification limits

- Mobile behavior was checked in a resized desktop browser, not on physical Android/iOS hardware.
- External arbitrary GLB import requires suitable part/material mapping; it is not certified against every third-party asset.
- No paid image-to-3D provider was available or invoked. No CFD, CAD accuracy, crash mechanics or physically accurate suspension solver was implemented.
- Reflections use generated PMREM environments. Contact occlusion is a generated shadow texture; SSAO/GTAO and external HDRI are not included.
- The model remains an approximate reference-inspired procedural reconstruction and is not photorealistic or engineering-accurate.
