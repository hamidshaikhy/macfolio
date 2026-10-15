"""Update only the bundled UI in an existing APK; align and sign afterwards.

Every other entry's uncompressed bytes and compression method are preserved.
Use --optimize to recompress already compressed entries at level 9, losslessly.
"""
import argparse
import copy
import json
import struct
from pathlib import Path
import zipfile

def rename_resource_table(data, old_name, new_name):
    """Change the app label in the global Android resource string pool.

    String indexes, resource IDs, package chunks and styles stay unchanged.
    Only the pool offsets/sizes are rebuilt to accommodate the new label.
    """
    table_type, table_header, table_size = struct.unpack_from('<HHI', data)
    assert table_type == 2 and table_size == len(data)
    start = table_header
    kind, header, size, count, styles, flags, strings_start, styles_start = struct.unpack_from('<HHIIIIII', data, start)
    assert kind == 1 and header == 28 and flags & 0x100, 'Expected UTF-8 global resource pool'
    pool = data[start:start+size]
    offsets = struct.unpack_from(f'<{count}I', pool, header)

    def read_length(pos):
        first = pool[pos]
        return (((first & 0x7f) << 8) | pool[pos+1], pos+2) if first & 0x80 else (first, pos+1)

    def length(value):
        assert value < 0x8000
        return bytes([(value >> 8) | 0x80, value & 0xff]) if value >= 0x80 else bytes([value])

    blobs = []
    matches = 0
    for offset in offsets:
        pos = strings_start + offset
        _, at = read_length(pos)
        byte_length, at = read_length(at)
        text = pool[at:at+byte_length].decode('utf-8')
        assert pool[at+byte_length] == 0
        if text == old_name:
            encoded = new_name.encode('utf-8')
            blob = length(len(new_name.encode('utf-16-le')) // 2) + length(len(encoded)) + encoded + b'\0'
            matches += 1
        else:
            blob = pool[pos:at+byte_length+1]
        blobs.append(blob)
    assert matches == 1, f'Expected one app label; found {matches}'
    new_offsets = []
    content = bytearray()
    for blob in blobs:
        new_offsets.append(len(content))
        content.extend(blob)
    content.extend(b'\0' * (-len(content) % 4))
    prefix = bytearray(pool[:strings_start])
    struct.pack_into(f'<{count}I', prefix, header, *new_offsets)
    tail = pool[styles_start:] if styles_start else b''
    new_styles_start = strings_start + len(content) if styles_start else 0
    new_size = len(prefix) + len(content) + len(tail)
    struct.pack_into('<I', prefix, 4, new_size)
    struct.pack_into('<I', prefix, 16, flags & ~1)  # The renamed pool may no longer be sorted.
    struct.pack_into('<I', prefix, 24, new_styles_start)
    result = bytearray(data[:start] + prefix + content + tail + data[start+size:])
    struct.pack_into('<I', result, 4, table_size + new_size - size)
    return bytes(result)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source')
parser.add_argument('bundle')
parser.add_argument('output')
parser.add_argument('--optimize', action='store_true')
parser.add_argument('--app-name', help='Rename the existing app label and bundled Expo name')
parser.add_argument('--old-app-name', default='روز')
args = parser.parse_args()
assert Path(args.source).resolve() != Path(args.output).resolve()
bundle = Path(args.bundle).read_bytes()
name = 'assets/index.android.bundle'
with zipfile.ZipFile(args.source) as source:
    assert source.read(name)[:12] == bundle[:12], 'Hermes bytecode version mismatch'
    replacements = {name: bundle}
    if args.app_name:
        replacements['resources.arsc'] = rename_resource_table(source.read('resources.arsc'), args.old_app_name, args.app_name)
        config = json.loads(source.read('assets/app.config'))
        assert config['name'] == args.old_app_name
        config['name'] = args.app_name
        config['slug'] = json.loads(Path('mobile/app.json').read_text(encoding='utf-8'))['expo']['slug']
        replacements['assets/app.config'] = json.dumps(config, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with zipfile.ZipFile(args.output, 'w') as dest:
        for original in source.infolist():
            # Discard old signature files; apksigner recreates signatures.
            if original.filename.startswith('META-INF/') and original.filename.upper().endswith(('.SF', '.RSA', '.DSA', '.EC')):
                continue
            info = copy.copy(original)
            # zipalign recreates position-dependent padding after repacking.
            info.extra = b''
            data = replacements.get(info.filename, source.read(info))
            dest.writestr(info, data, compresslevel=9 if args.optimize else 6)
    with zipfile.ZipFile(args.output) as dest:
        assert dest.testzip() is None
        changed = [n for n in dest.namelist() if source.read(n) != dest.read(n)]
        assert set(changed) == set(replacements), changed
        assert all(source.getinfo(n).compress_type == dest.getinfo(n).compress_type for n in dest.namelist())
print(f'Updated {", ".join(replacements)}; preserved all other file contents and compression methods.')
