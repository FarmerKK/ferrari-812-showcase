"""Repack identical GLB buffer views without changing decoded geometry or images."""
import hashlib
import json
from pathlib import Path
import struct


def deduplicate(path):
    path = Path(path)
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from('<III', raw)
    assert magic == 0x46546C67 and version == 2 and length == len(raw)
    size, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4E4F534A
    document = json.loads(raw[20:20 + size])
    offset = 20 + size
    binary_size, kind = struct.unpack_from('<II', raw, offset)
    assert kind == 0x004E4942 and len(document['buffers']) == 1
    binary = raw[offset + 8:offset + 8 + binary_size]
    packed = bytearray()
    seen = {}
    shared = 0
    for view in document['bufferViews']:
        assert view.get('buffer', 0) == 0
        start = view.get('byteOffset', 0)
        data = binary[start:start + view['byteLength']]
        key = hashlib.sha256(data).digest()
        if key in seen:
            target_offset, original = seen[key]
            assert original == data  # Sharing is byte-for-byte, never approximate.
            shared += 1
        else:
            packed.extend(b'\0' * (-len(packed) % 4))
            target_offset = len(packed)
            packed.extend(data)
            seen[key] = target_offset, data
        view['byteOffset'] = target_offset
    document['buffers'][0]['byteLength'] = len(packed)
    encoded = json.dumps(document, ensure_ascii=False, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    packed.extend(b'\0' * (-len(packed) % 4))
    total = 12 + 8 + len(encoded) + 8 + len(packed)
    result = struct.pack('<III', magic, version, total)
    result += struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
    result += struct.pack('<II', len(packed), 0x004E4942) + packed
    path.write_bytes(result)
    return {'beforeBytes': len(raw), 'afterBytes': total, 'identicalViewsShared': shared}


if __name__ == '__main__':
    import sys
    print(json.dumps(deduplicate(sys.argv[1])))
