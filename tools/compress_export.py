"""Compress a browser-exported assembled GLB for static hosting."""
import bpy, sys
from pathlib import Path
args = sys.argv[sys.argv.index('--') + 1:]
source, target = [Path(p).resolve() for p in args[:2]]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
bpy.ops.export_scene.gltf(
    filepath=str(target), export_format='GLB', export_extras=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16,
    export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=14,
)
print(f'Compressed model: {target.stat().st_size} bytes')
