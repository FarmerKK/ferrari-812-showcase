# Cockpit reconstruction — 15 October 2026

The cockpit follows the supplied 812 blueprint and the later real-car photographs. The vehicle remains left-hand drive, following the left-hand-drive reference; the right-hand-drive photo supplies construction and surface details. This is a photographic reconstruction, not official Ferrari CAD.

## Dashboard and instruments

src/cockpit-geometry.js creates the layered leather eyebrow, open vent gallery, formed aluminium trays, fine red accent, hexagonal grille and separate lower fascia. Four bell-mouth nozzles have open throats, recessed vanes, rotary hubs and rolled red/metal rims. The two central vents sit inside the gallery rather than on a uniform flat panel. The driver area has a separate padded knee housing; the bright gallery tray stops outside the instrument area.

The instrument hood follows a scalloped contour and wraps over inset side LCDs and a central yellow tachometer. The analog face has a corrected clockwise scale from lower left to lower right, a raised narrow pointer and hub, an inset neutral indicator, stepped barrel and subtle lens. Face, needle, lens and hood occupy separate depths. The readouts are illustrative static showroom values.

## Steering wheel

The wheel uses a flattened carbon rim, perforated side grips, integrated thumb rests and fine inner seams. A single flared lower spoke joins the curved carbon bottom rim. Curved carbon switch wings support separate indicator rockers, light/wiper switch banks, the smaller engine-start button, telephone/audio switches and Manettino selector. The padded airbag follows a rounded trapezoid profile, with the CC0 horse badge set into its bezel. Carbon weave uses a separate finer scale on the wheel.

The lower column uses a flattened, tapered clamshell rather than an exposed round shaft. It is inclined into the padded knee housing below the tachometer. The wheel rotor is an articulated child of a stationary mounting frame: rim, airbag and switches rotate, while the column and slim, bent shift paddles stay fixed. Batching preserves this articulated frame and all selection/export semantics. The driver camera uses a higher eye point and 55-degree vertical field of view so the instruments can be seen above the hub.

## Console and supporting detail

The transmission bridge slopes back toward the armrest. Paired curved carbon brackets return into the lower tunnel, leaving an actual open side passage; there are no straight table-like support walls. Three inset transmission controls, hazard button, window switches and rear handle sit on the deck. The climate system uses two slim banks, a smaller digital temperature strip, knurled dials and backlit legends. The optional passenger display is a narrow inset strip in the lower fascia.

src/upholstery.js retains shared padded seat surfaces with material-region center inserts/stripes, surface-sampled stitching and conforming alpha-cut embroidery. Door cards, carpet, perforated pedal faces, supports, sill trim and flat woven belts remain separate selectable parts. Leather maps derive from ambientCG Leather037 (CC0), with a softened runtime roughness response. Carbon/perforation artwork is project-authored canvas texture data.

## Interaction and delivery

There are 62 semantic groups. Cockpit entry is available from the header or ?view=interior, with six views and editable materials. Studio lighting is selected on entry and previous exterior lighting restores on exit. The isolated-seat view and roof cutaway use reversible visibility. Exports temporarily restore all part visibility and assembled transforms, then restore the active view. The downloadable compressed model includes the same cockpit.

The V12/manifold remains fitted ahead of the cabin firewall. Door cards follow the animated hinges. High quality uses area lighting and SSAO; adaptive quality waits for sustained slow samples and can recover on desktop.

Sound opens the recorded-exhaust controls. Start engine plays the idle loop; Rev exhaust plays one of two acceleration excerpts then returns to idle. Stop interrupts both. Volume, mute and hidden-tab stop remain available. Locally hosted CC0 recordings are by jtvdb and biholao on Freesound; their recordists do not identify an 812, so no authentic-812 recording claim is made. Credits are in public/audio/credits.json and About.

Gauge values, switch labels, engine/suspension details and opening mechanics are illustrative. No engineering dimensions, safety certification, real telemetry or exact photographic identity is claimed. Mobile is verified in a resized browser rather than physical phone hardware. Audio output is measured in Chromium; no human listening review is claimed.

Finishing includes an enclosed rear instrument shell with outward-facing roof normals, a recessed hex grille constrained below the leather eyebrow, and glovebox clearance for the right climate knob. The photo structure suite checks these clearances and the actual open passage under the console. The browser host forces page visibility; the audio suite exercises the production visibility handler with a temporary document.hidden fixture and restores the property.
