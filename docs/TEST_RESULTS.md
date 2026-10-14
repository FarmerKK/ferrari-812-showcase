# Test results — 14 October 2026

qa/detailed-acceptance.cjs completed with **50 passed assertions and 0 JavaScript runtime errors** against the production Vite build using the new artist-authored CC0 body. Desktop: 1440 × 900; mobile viewport: 390 × 844.

| Area | Verified result |
| --- | --- |
| Model | 53 selectable semantic groups; detailed GLB body loaded |
| Interaction | Direct canvas raycast, mouse orbit and scroll zoom |
| Materials | Presets/color picker, matte/pearl/carbon, wheel/caliper colors, mirrors, seats/suede |
| Geometry | Double-spoke/forged-star switching and aero variants |
| Lamps | Headlamp emissive/illumination, brake emissive and indicator state |
| Persistence | Save/reset/load restores configuration |
| Assembly | Hood detachment, 53 groups explode; positions/quaternions restore within 1e-6 |
| Mechanics | Doors with glazing/mirrors, bonnet hinge, wheel spin and steering |
| Cameras | All 10 views including cockpit, wheel, engine and cinematic |
| Environments | Daylight, sunset, night and studio |
| Downloads | Actual PNG and assembled GLB generated |
| Mobile | No horizontal overflow; paint/explode interactions work |

Reviewed real renders of front, rear, side, top, cockpit, wheels, engine, exploded view, all four environments, desktop and mobile. The new exterior preserves authored body volume. Refinements include thin double wheel spokes, smooth tires, adjusted clearcoat/glazing and lighting, material-boundary rear carbon trim and removal of floating procedural indicator geometry.

The assembled GLB was imported in Blender 4.5.3 LTS with no missing embedded images. model-inspection.json records bounds and counts. Instanced geometry expands on import; nested wheel groups may inherit metadata but are counted separately from selectable groups.

npm run build succeeds. Live sample: 415 meshes including hidden originals/style variants, 701 render calls and 1,411,638 triangles across shadow/postprocessing passes, high quality, 148 FPS in the acceptance browser. These are browser samples, not physical-device guarantees. Adaptive DPR and bloom bypass remain available. Default GLTF/Draco loaders load eagerly because the asset is required; exporter remains lazy.

Legacy qa/acceptance.cjs and qa/final-smoke.cjs tested the superseded procedural body; their results are not evidence for the current model.

Mobile was checked in resized Chromium, not physical Android/iOS. Arbitrary external GLB mapping is not certified. Source is an artist representation; engine/suspension are illustrative, with no CAD, CFD or mechanics accuracy claim. Reflections use generated PMREM; no external HDRI or SSAO/GTAO pipeline is included.
