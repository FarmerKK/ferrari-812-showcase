# Assets and dependencies

The default body is **Ferrari 812 Superfast by Jayrenn Reeve**, published as a free **CC0** model on [BlenderKit](https://www.blenderkit.com/asset-gallery-detail/22191abd-fa78-43e9-81fe-6cded0d53483/). Asset base ID: `22191abd-fa78-43e9-81fe-6cded0d53483`; source version: `4fdd69f6-e715-4529-bbd3-8487ccd85a01`.

Public API metadata reports `license: cc_zero`, `isFree: true`, and `canDownload: true`. The file was downloaded through its public resolution_2K download endpoint without an account or paid service. See `assets/source/blenderkit-metadata.json` and [CC0 terms](https://creativecommons.org/publicdomain/zero/1.0/).

Source modifications: mirrors/subdivision baked, tires optimized, semantic groups assigned, materials rebuilt for WebGL, badge textures retained, dimensions normalized and Draco compression applied. Runtime rims/tires are generated reference-style geometry; engine and suspension are illustrative project-authored geometry. The circuit, environment, carbon/asphalt textures and UI were authored in this project.

The user's attachment is not redistributed. Ferrari naming and badges are used descriptively. CC0 does not imply Ferrari endorsement or trademark ownership.

| Dependency | Installed version | License |
| --- | --- | --- |
| Three.js | 0.180.0 | MIT |
| GSAP | 3.15.0 | [GSAP Standard no-charge license](https://gsap.com/standard-license/) |
| Lucide | 0.468.0 | ISC |
| Vite | 7.3.7 | MIT |
| Barlow Condensed / DM Sans | Google Fonts delivery | SIL Open Font License; local sans-serif fallback |

Default-model Draco files are bundled locally from Three.js. The optional generic importer retains its versioned decoder fallback. No paid image-to-3D service was used and no provider secrets are bundled.

The cabin uses normal/roughness maps from [ambientCG Leather037](https://ambientcg.com/a/Leather037), captured by photometric stereo and distributed under [CC0](https://docs.ambientcg.com/license/). Original 1K JPG maps are bundled locally; color remains configurable. Provenance is recorded in assets/source/leather037-metadata.json. Other inspected royalty-free seat models were not incorporated.

The rebuilt cockpit geometry, stitched seams, belts, buttons and display artwork were authored for the user's supplied interior reference. Horse silhouettes are derived from the original CC0 body asset's embedded Ferrari badge texture.
