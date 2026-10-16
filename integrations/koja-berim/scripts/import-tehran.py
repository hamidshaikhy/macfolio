"""Import all supported, named POIs from BBBike's regional OSM extract.

Usage: pip install osmium; python scripts/import-tehran.py [--pbf path]
The extract has a documented geographic boundary; it is not a complete business directory.
"""
import argparse
from collections import Counter
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request
import osmium

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://download.bbbike.org/osm/bbbike/Tehran/Tehran.osm.pbf'
SOURCE = 'https://download.bbbike.org/osm/bbbike/Tehran/'
TEHRAN_BOUNDS = {'south': 35.50, 'west': 51.05, 'north': 35.95, 'east': 51.75}
DISCOVERY = json.loads((ROOT / 'src/discovery.json').read_text(encoding='utf-8'))


def category(tags):
    if tags.get('amenity') in ['hospital', 'school', 'university', 'clinic', 'pharmacy', 'bank']:
        return None
    if tags.get('amenity') == 'cafe': return 'cafe'
    if tags.get('railway') == 'station' and (tags.get('station') == 'subway' or tags.get('subway') == 'yes'): return 'metro'
    if any(tags.get(key) in DISCOVERY[key] for key in ['tourism', 'historic']): return 'sight'
    if any(tags.get(key) in DISCOVERY[key] for key in ['leisure', 'natural', 'waterway']): return 'nature'


class Places(osmium.SimpleHandler):
    def __init__(self, bounds):
        super().__init__()
        self.records = {}
        self.bounds = bounds

    def keep(self, obj, kind, point):
        tags = dict(obj.tags)
        if not (tags.get('name:fa') or tags.get('name')) or not category(tags): return
        lat, lng = point
        if not (self.bounds['south'] <= lat <= self.bounds['north'] and self.bounds['west'] <= lng <= self.bounds['east']): return
        record = {'type': kind, 'id': obj.orig_id() if kind == 'relation' else obj.id, 'tags': tags}
        record.update({'lat': lat, 'lon': lng} if kind == 'node' else {'center': {'lat': lat, 'lon': lng}})
        self.records[(kind, record['id'])] = record

    def node(self, node):
        if node.location.valid() and (node.tags.get('name:fa') or node.tags.get('name')):
            self.keep(node, 'node', (node.location.lat, node.location.lon))

    def way(self, way):
        if not (way.tags.get('name:fa') or way.tags.get('name')) or not category(dict(way.tags)): return
        points = [(n.lat, n.lon) for n in way.nodes if n.location.valid()]
        if points:
            self.keep(way, 'way', ((min(p[0] for p in points) + max(p[0] for p in points)) / 2,
                                  (min(p[1] for p in points) + max(p[1] for p in points)) / 2))

    def area(self, area):
        if area.from_way() or not (area.tags.get('name:fa') or area.tags.get('name')) or not category(dict(area.tags)): return
        points = [(n.lat, n.lon) for ring in area.outer_rings() for n in ring if n.location.valid()]
        if points:
            self.keep(area, 'relation', ((min(p[0] for p in points) + max(p[0] for p in points)) / 2,
                                        (min(p[1] for p in points) + max(p[1] for p in points)) / 2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pbf', type=Path)
    parser.add_argument('--iran', action='store_true', help='Filter the larger Geofabrik Iran extract to Tehran and its surroundings')
    args = parser.parse_args()
    pbf = args.pbf or ROOT / '.data-cache/Tehran.osm.pbf'
    last_modified = None
    if not args.pbf:
        pbf.parent.mkdir(exist_ok=True)
        request = urllib.request.Request(URL, headers={'User-Agent': 'KojaBerim/1.2 (Tehran city guide)'})
        with urllib.request.urlopen(request, timeout=60) as response:
            last_modified = response.headers.get('Last-Modified')
            pbf.write_bytes(response.read())
    with osmium.io.Reader(str(pbf)) as reader:
        header = reader.header()
        box = header.box()
        bounds = {'south': box.bottom_left.lat, 'west': box.bottom_left.lon,
                  'north': box.top_right.lat, 'east': box.top_right.lon}
        timestamp = header.get('osmosis_replication_timestamp')
    if args.iran: bounds = TEHRAN_BOUNDS
    handler = Places(bounds)
    handler.apply_file(str(pbf), locations=True, idx='flex_mem')
    if not handler.records: raise RuntimeError('Empty extract; existing snapshot retained')
    dest = ROOT / 'public/data/tehran.json'
    previous = json.loads(dest.read_text(encoding='utf-8'))
    records = {(p['type'], p['id']): p for p in previous['elements']}
    records.update(handler.records)
    payload = {'source': 'OpenStreetMap / Geofabrik Iran extract, Tehran region' if args.iran else 'OpenStreetMap / BBBike Tehran regional extract',
        'sourceUrl': 'https://download.geofabrik.de/asia/iran.html' if args.iran else SOURCE,
        'downloadUrl': 'https://download.geofabrik.de/asia/iran-latest.osm.pbf' if args.iran else URL, 'sourceTimestamp': timestamp or last_modified,
        'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'bounds': bounds, 'sha256': hashlib.sha256(pbf.read_bytes()).hexdigest(),
        'coverage': 'All supported named categories inside the regional extract; OSM coverage is not exhaustive.',
        'details': previous.get('details', {}),
        'elements': sorted(records.values(), key=lambda p: (p['type'], p['id']))}
    temporary = dest.with_suffix('.tmp')
    temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
    temporary.replace(dest)
    print(json.dumps({'previous': len(previous['elements']), 'current': len(records), 'bounds': bounds,
        'categories': dict(Counter(category(p['tags']) for p in records.values()))}, ensure_ascii=True), flush=True)
