# Test results — 16 October 2026

Current wheel runtime: `812-forged-wheels-v1`; cockpit: `812-sloping-dashboard-v7`. The production-preview wheel suite passed 19 checks with no JavaScript runtime errors. See [wheel results](wheel-qa-summary.json) and [wheel construction](WHEELS.md).

Both split and star spokes have measured front dish of 45.65 mm and rear dish of 70.29 mm. Every tested spoke mesh and hollow barrel has finite geometry, positive signed volume and zero open edges. The minimum measured separation from retained brake faces to spoke backs is 88.30 mm. These are reconstruction measurements, not factory specifications. Design/finish changes, save/reset/load, wheel spin, steering, explode/assemble and direct ?view=wheel entry pass. Desktop 1600 × 1000 and mobile Chromium viewport 390 × 844 were checked; no physical phone or hardware performance benchmark is claimed.

Final direct/oblique screenshots use actual production geometry in graphite and silver, with both styles. A complete assembled GLB was exported from the isolated Seats view. Raw and compressed files import in Blender 4.5.3 LTS: 62 groups, 1153 meshes, 74 materials, 42 embedded images and no missing images. Compressed download: 25,358,104 bytes. Position and UV quantization remain 16/14 bits; normal quantization is 10 bits to keep the download within the hosting file limit. Runtime browser geometry and textures retain their full authored resolution.

The production build succeeds with the existing bundle-size advisories. The prior cockpit/audio/exterior results below are historical and were not rerun for the wheel change.

## Previous cockpit regression — 15 October 2026

Runtime: `812-sloping-dashboard-v7`. The final combined production-preview run passed 32 targeted checks:

- `qa/passenger-layout.cjs`: 12 passed, including actual leather slope measurements.
- `qa/photo-cockpit-structure.cjs`: 17 passed.
- `qa/formed-surface-audit.cjs`: 3 passed.

No JavaScript runtime errors were recorded. Desktop viewport: 1600 × 1000; mobile: 390 × 844 in Chromium. Initial overlay removal allows up to 120 seconds. Functional and geometry checks do not certify photographic identity.

## Revised leather section

The upper passenger leather descends toward the front fascia while the LCD remains planar. After the user rejected the first, excessively steep revision, the final ramp was reduced to a shallow section. Downward rays at three longitudinal positions on the actual leather mesh hit heights of 0.853878, 0.848135 and 0.809671 m. The endpoint inclination is 11.62 degrees in this model; this is a measured reconstruction value, not a claimed Ferrari specification.

The 812 metal badge and front stitching sample the revised surface. Higher-precision surface sampling avoids stepped lettering on the inclined leather. The vent-pod upper edges are reduced so they no longer protrude as fins through the leather. Final images are `output/playwright/sloped-passenger.png` and `sloped-section.png`, captured by `qa/dashboard-slope-views.cjs` from the actual runtime geometry.

The passenger LCD world-depth range remains 0.000000000 m. All nine sampled screen positions and all five sampled positions through the outer passenger vent remain visible. Outer vent centers remain ±0.645 m. The lower leather color remains independent of the upper leather, persists through save/reset/load and defaults correctly for older configurations. Passenger toolbar and direct ?view=passenger entry pass on desktop and mobile without horizontal overflow.

The structure suite verifies steering mount/hood clearance, the actual open passage under the transmission bridge, and formed dashboard features. The padded upper/lower dashboard material audit covers 51,584 triangles with 0 open boundaries. This audit covers those padded volumes, not every vehicle mesh.

## Export and build

The final combined run exports the full assembled vehicle from the isolated Seats view. Both this raw export and the compressed downloadable model import in Blender 4.5.3 LTS with 62 top-level semantic groups, 1181 mesh objects, 74 materials and 41 embedded images. No images are missing. The compressed model is 25,833,544 bytes, below the 26,214,400-byte hosting asset limit. Browser exports remain uncompressed.

`npm run build` succeeds with the existing Three.js/application bundle-size advisories. No new hardware performance benchmark is claimed. Gauges/mechanics are illustrative; the model is reconstructed from supplied photographs rather than official Ferrari CAD.

## Earlier regression results

Revision v6 passed 82 checks: cockpit 34, photographic structure 17, formed surfaces 3, refinement/audio 18 and passenger layout 10. The current v7 run repeats the directly affected structure, surface and passenger checks above; it does not repeat the full audio/cockpit suite. The prior v4 exterior suite passed 50 checks and was not rerun for this dashboard revision.

The earlier audio suite measured decoded idle/acceleration output, start/rev/stop/mute/volume and mobile start/stop. The automation host forces page visibility, so that suite exercised the production visibility handler with a temporary document.hidden fixture. No actual background-tab transition, human listening review or physical-phone test is claimed. The CC0 Ferrari recordings are not identified as an 812 by their recordists.
