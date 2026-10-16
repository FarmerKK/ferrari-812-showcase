# 812 Superfast: brake and internal-structure study

Reviewed 16 October 2026. Target vehicle: the 812 Superfast coupé. GTS and Competizione drawings/specifications are not substituted for this model. This study supports the new `812-researched-structure-v1` reconstruction.

## Evidence and dimensional confidence

Manufacturer technical information establishes the 65-degree 6,496 cc V12 and overall vehicle envelope. Ferrari also describes the Superfast's transaxle architecture, EPS and four-wheel steering in its [2017 annual report](https://cdn.ferrari.com/cms/network/media/pdf/annual_report_2017_eng.pdf). The [launch technical document](https://www.ferrari.com/content/dam/ferrari-fcom/old/pdf/cs_ferrari_812_superfast_gbr.pdf) is the primary engine/body reference. The manufacturer-authored [Superfast technical sheet, preserved by SGCarMart](https://i.i-sgcm.com/new_cars/cars/12126/brochures/brochure_20170704120152.pdf) lists 398 × 38 mm front and 360 × 32 mm rear brakes. These rotor dimensions are reproduced in the mesh.

The [Superfast parts catalogue](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams) supplies exploded assembly relationships. It is a parts catalogue, not a dimensioned manufacturing drawing. Casting contours, axial offsets, spring rates, pickup coordinates, hole spacing, hose routes and service clearances cannot be certified from it. The new geometry therefore distinguishes published rotor sizes from diagram-derived topology and reconstructed packaging. No load analysis, kinematic solution, production tolerances or complete factory CAD is implied.

## Brake correction

The old model retained the artist's brake meshes while replacing the wheels. The caliper/rotor mounting arrangement was not rebuilt as a matched assembly. The wheel-only check used a broad axial clearance bound and did not test caliper triangles against the friction annulus. That was insufficient to address the issue reported by the user. The new measurements below describe the replacement geometry; no retrospective collision certification of the old asset is claimed.

The [front caliper diagram, 0029](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0029/front-brake-callipers) shows the casting, pads/spring hardware, hoses, housing cover and cooling connection as distinct elements. The replacement uses separate inboard/outboard lobes, two pads and bridges beyond the disc radius. The rotor is made from two drilled friction plates with an open ventilation core and connecting vanes. Its mounting bell belongs to the rotating rotor assembly rather than being a large solid cover on the wheel.

The pad running gap is a visualization value, not a workshop setting. Acceptance clips actual caliper/pad triangles to the rotor's axial slab and checks their radial overlap with the friction band. It also measures the real mesh diameter/thickness. Disc and wheel share rotation; caliper rotation stays fixed. Brake system architecture is consistent with the component relationships explained by [Brembo](https://www.brembo.com/en/news-archive/5-factors-that-make-a-brembo-braking-system-unbeatable), without treating an aftermarket kit as an 812 specification.

## System-by-system application

| System and evidence | Applied reconstruction | Remaining uncertainty |
| --- | --- | --- |
| [Front suspension, 0033](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0033/front-suspension-shock-absorber-and-brake-disc) and [arms, 0034](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0034/front-suspension-arms) | Separate upper/lower links, bushings, bearing/upright and an inboard coil/damper assembly. | Hardpoints, casting ribs and spring/damper dimensions are reconstructed. |
| [Rear arms, 0036](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0036/rear-suspension-arms) | Upper/lower links, longitudinal link, toe link and a distinct steering actuator. | No numerical rear-steer control law or suspension solver. |
| [Front structure, 0102](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0102/structures-and-elements-front-of-vehicle) | Paired rails, crossmembers, cradle and damper pickup towers replace disconnected placeholder coils. | Rail sections and joints are illustrative extrusions; they are not crash-certified. |
| [Centre structure, 0103](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0103/structures-and-elements-centre-of-vehicle) | Sills, firewall perimeter, seat crossmembers and tunnel rails. | Bond lines, welds, fastener schedules and exact bulkhead stampings are not reproduced. |
| [Rear structure, 0104](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0104/structures-and-elements-rear-of-vehicle) | Rear cradle supports the transaxle and suspension towers. | Approximate packaging rather than measured repair-bench coordinates. |
| [Intake manifold, 0012](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0012/intake-manifold) | Paired intake volumes, twelve runner stations, throttle couplings and paired ducts/airboxes. | Variable-runner internals and actuator mechanisms are not reproduced. |
| [Transmission shaft, 0023](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0023/transmission-pipe) and [gearbox, 0025](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0025/gearbox-housing) | Central connection from the front power unit to a separate rear DCT/differential casing; rear halfshafts and CV boots. | Internal gearsets, clutch plates and exact casing scans are unavailable. |
| [Cooling, 0021](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0021/cooling-radiators-and-air-ducts) | Separate water/oil coolers, fan shrouds/motors and coolant routes. | Core construction and full duct sealing are simplified. |
| [Lubrication tank, 0018](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0018/lubrication-system-tank) | Reservoir, filler and feed route distinct from the crankcase. | Internal scavenge stages and all oil galleries are not modeled. |
| [Fuel system, 0009](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0009/fuel-tank-fuel-system-pumps-and-pipes) | Rear tank volume, pump covers, straps and protected longitudinal feed paths. | Tank baffles, internal pumps and exact line bends are simplified. |
| [Exhaust silencers, 0016](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0016/silencers) | Twelve primary paths merge into paired catalyst/underfloor routes and silencers joining the existing outlets. | GPF and market variations are not mixed into a single asserted factory configuration; emissions internals are illustrative. |
| [EPS, 0031](https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/0031/electric-steering-box) | Front rack/motor and tie links, distinct from rear actuators. | Link deflection during steering is not physically solved. |
| Battery and main-harness catalogue families | Separate battery/fuse enclosure and protected harness paths. | Individual circuits, ECUs and connector pinouts are not represented. |

## Complete-model audit and limits

All selectable model assemblies are listed in `component-research-inventory.json`. Each entry identifies retained artist/prior photographic work versus this diagram-derived reconstruction and records available references. This prevents an existing seat, light, airbag or decorative mesh from silently acquiring a claim of engineering verification.

The catalogue also covers crank/valvetrain internals, fuel/emissions variants, lubrication/cooling, service brakes, steering, wheels/lift equipment, electrical/HVAC, body structures, closures/glazing, restraints/interior trim, instruments, lighting and infotainment. Their existence in a catalogue does not mean every fastener or hidden internal mechanism has been individually rebuilt. In particular: pistons/crank/cams, airbag internals, detailed HVAC ductwork, window regulators, latch internals, ECU circuitry and all wiring connectors remain outside the new physical reconstruction. Existing exterior/cockpit parts retain their earlier artist/photo basis.

The structure view and individual Parts explorer entries expose the assemblies for review. Full assembled exports temporarily restore hidden exterior/cabin parts, then restore the active view. The research images were used for inspection only and are not redistributed as website textures or source assets.

## Packaging repairs found during the assembled-model review

- Removed inward construction sheets from the imported door objects; retained their rear exterior returns as a static body group. Rebased the moving skin to a reconstructed outer hinge region.
- Replaced the broad solid underfloor block with a thin tray and wheel recesses; formed a separate central tunnel, fitted carpet floor and luggage-bay liner over the rear mechanical bay.
- Kept the water cooler, airboxes and intake ducts below the closed nose/bonnet surfaces; separated induction from the lamp housings.
- Moved frame supports away from the spring winding, provided an open torque-tube route and kept the rear transaxle separate from the cabin floor.
- Used bounded straight runs and rounded elbows for fuel, oil, coolant, harness and exhaust routes. Kept routes clear of the tire envelope at both sampled steering limits.
- Articulated the front upright/bearing/steering arm and updated rod endpoints with wheel steering. This remains an illustrative steering animation, not a solved suspension mechanism.
- Opened reconstructed service inlets in the concealed front of the retained exhaust-bay covers, with 40 mm cutter radius around 23 mm pipe radius. These are project packaging clearances, not factory port dimensions. Exterior diffuser fins and tailpipe surrounds are retained.

See `ASSEMBLY_AUDIT.md` for the final pose reports and interpretation of remaining assembly/seal contacts. Whole-body source surfaces are not silently promoted to dimensionally verified engineering solids.
