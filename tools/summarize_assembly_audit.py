"""Interpret sampled component contacts without treating every joint as a defect."""
import hashlib
import json
from pathlib import Path

allowed = {}
def joint(a, b, reason):
    allowed[frozenset((a, b))] = reason

joint('engine', 'engine-covers', 'Bank/manifold and cam-cover assembly interface')
joint('engine-covers', 'air-intake', 'Throttle/manifold connection')
joint('rear-transaxle', 'rear-halfshafts', 'Differential output/CV connection')
joint('torque-tube', 'rear-transaxle', 'Transmission input connection')
joint('engine', 'fuel-system', 'Fuel-rail feed connection')
joint('engine-covers', 'fuel-system', 'Feed route within the engine assembly')
joint('exhaust', 'exhaust-pipes', 'Retained tailpipe coupling')
joint('exhaust-manifolds', 'exhaust-pipes', 'Catalyst/outlet coupling')
for side in ['left', 'right']:
    for axle in ['front', 'rear']:
        prefix = f'{side}-{axle}'
        joint(prefix+'-wheel', prefix+'-disc', 'Rotor bell/wheel-hub fastening interface')
        joint(prefix+'-suspension', axle+'-subframe', 'Control-link bushes and upper damper mounts')
    joint(side+'-rear-suspension', 'rear-halfshafts', 'CV/hub-bearing connection')
    joint(side+'-front-suspension', 'steering-rack', 'Steering-rod ball joint/steering arm')

reports = {}
baseline = None
for name in ['final', 'steer-negative', 'steer-positive', 'panels-open']:
    report = json.loads(Path(f'output/intersections-{name}.json').read_text())
    report['interpretation'] = 'Surface contacts, not a count of defects. New mechanical joints are explicitly classified. Retained artist shell/trim fits include embedded housings/seals and are not certified manufacturing solids.'
    unknown = []
    for pair in report['pairs']:
        key = frozenset((pair['a'], pair['b']))
        if pair['newMechanicalPair']:
            pair['review'] = allowed.get(key, 'UNREVIEWED mechanical contact')
            if key not in allowed: unknown.append(sorted(key))
        else:
            pair['review'] = 'Retained shell, trim, glazing, tire-bead or panel interface; reviewed in assembled/open views, without a watertight-solid certification.'
    if baseline is None: baseline = {frozenset((p['a'], p['b'])) for p in report['pairs']}
    introduced = [sorted((p['a'], p['b'])) for p in report['pairs'] if frozenset((p['a'], p['b'])) not in baseline]
    report['unreviewedNewMechanicalPairs'] = unknown
    report['newPairNamesVersusNeutral'] = introduced
    assert not unknown, (name, unknown)
    assert not introduced, (name, introduced)
    Path(f'docs/assembly-{name}.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    reports[name] = {'groups': report['groups'], 'surfaceContactPairs': report['intersectingPairCount'], 'classifiedMechanicalJoints': report['newMechanicalPairCount'], 'unreviewedMechanicalPairs': 0, 'introducedPairNames': 0}

reports['modelSha256'] = hashlib.sha256(Path('output/playwright/812-superfast-atelier.glb').read_bytes()).hexdigest()
reports['limits'] = 'Neutral and three UI limit poses only; no continuous sweep, fully enclosed volume test, manufacturing tolerance or suspension dynamics certification.'
Path('docs/assembly-audit-summary.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
print(json.dumps(reports))
