"""Build Tehran metro lines, track geometry and stations from an OSM PBF.

Reads actual route membership and stop areas. Does not invent track geometry,
station positions, opening dates or live service status.
"""
import argparse
from collections import defaultdict
import datetime
import json
import math
from pathlib import Path
import re
import osmium

ROOT = Path(__file__).resolve().parents[1]
COLORS = {'1': '#e32636', '2': '#244b98', '3': '#00a8d6', '4': '#f2c500',
          '5': '#008b45', '6': '#e477b0', '7': '#80459b'}


def normalized(name):
    return re.sub(r'[\s\u200c()（）]+', '', name.replace('ي', 'ی').replace('ك', 'ک').replace('ایستگاه', '').replace('مترو', ''))


def distance(a, b):
    return math.hypot((a['lat'] - b['lat']) * 111200,
                      (a['lng'] - b['lng']) * 111200 * math.cos(math.radians(a['lat'])))


class Relations(osmium.SimpleHandler):
    def __init__(self): super().__init__(); self.routes = []; self.areas = {}
    def relation(self, relation):
        tags = dict(relation.tags)
        members = [(m.type, m.ref, m.role) for m in relation.members]
        if tags.get('public_transport') == 'stop_area':
            for kind, ref, role in members:
                self.areas[(kind, ref)] = relation.id
        if (tags.get('network:wikidata') == 'Q714823' or tags.get('network') == 'متروی تهران') and tags.get('type') == 'route' and tags.get('ref') in COLORS:
            self.routes.append({'id': relation.id, 'tags': tags, 'members': members})


class Geometry(osmium.SimpleHandler):
    def __init__(self, routes):
        super().__init__()
        self.needed_nodes = {ref for r in routes for kind, ref, role in r['members'] if kind == 'n'}
        self.needed_ways = {ref for r in routes for kind, ref, role in r['members'] if kind == 'w' and role not in ['platform', 'inactive']}
        self.nodes = {}; self.ways = {}; self.station_candidates = {}

    def node(self, node):
        if not node.location.valid(): return
        required = node.id in self.needed_nodes
        station = node.tags.get('railway') == 'station' and (node.tags.get('station') == 'subway' or node.tags.get('subway') == 'yes')
        if required or (station and 35.3 <= node.location.lat <= 36.1 and 50.4 <= node.location.lon <= 51.8):
            record = {'id': f'osm:node/{node.id}', 'lat': node.location.lat, 'lng': node.location.lon, 'tags': dict(node.tags)}
            self.nodes[node.id] = record
            if station: self.station_candidates[record['id']] = record

    def way(self, way):
        if way.id not in self.needed_ways: return
        if way.tags.get('railway') in ['construction', 'proposed', 'disused', 'abandoned']: return
        points = [[round(n.lon, 6), round(n.lat, 6)] for n in way.nodes if n.location.valid()]
        if len(points) >= 2: self.ways[way.id] = points


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pbf', type=Path, default=ROOT / '.data-cache/iran-latest.osm.pbf')
    args = parser.parse_args()
    relations = Relations(); relations.apply_file(str(args.pbf))
    geometry = Geometry(relations.routes); geometry.apply_file(str(args.pbf), locations=True, idx='flex_mem')
    with osmium.io.Reader(str(args.pbf)) as reader:
        timestamp = reader.header().get('osmosis_replication_timestamp')
    stations = {}; lines = {}; area_stations = {}; alias_stations = {}

    def station_for(node_id):
        point = geometry.nodes.get(node_id)
        if not point: return None
        tags = point['tags']; name = tags.get('name:fa') or tags.get('name')
        if not name or tags.get('railway') in ['construction', 'proposed', 'disused', 'abandoned']: return None
        area = relations.areas.get(('n', node_id))
        if area in area_stations: return area_stations[area]
        key = normalized(name)
        for existing in alias_stations.get(key, []):
            if distance(existing, point) < 650:
                if area: area_stations[area] = existing
                return existing
        candidates = [candidate for candidate in geometry.station_candidates.values()
                      if normalized(candidate['tags'].get('name:fa') or candidate['tags'].get('name', '')) == key and distance(candidate, point) < 650]
        chosen = min(candidates, key=lambda candidate: distance(candidate, point)) if candidates else point
        source_tags = chosen['tags']
        station = {'id': chosen['id'], 'name': source_tags.get('name:fa') or source_tags.get('name') or name,
                   'lat': chosen['lat'], 'lng': chosen['lng'], 'category': 'metro', 'city': 'tehran',
                   'metroLines': [], 'aliases': [name], 'source': 'OpenStreetMap / Tehran Metro route relations',
                   'osmType': 'node', 'osmId': int(chosen['id'].split('/')[-1])}
        if source_tags.get('wikidata'): station['wikidata'] = source_tags['wikidata']
        if source_tags.get('wikipedia') and ':' in source_tags['wikipedia']:
            import urllib.parse
            language, title = source_tags['wikipedia'].split(':', 1)
            station['wiki'] = f'https://{language}.wikipedia.org/wiki/' + urllib.parse.quote(title)
        if station['id'] in stations: station = stations[station['id']]
        else:
            stations[station['id']] = station
            alias_stations.setdefault(key, []).append(station)
        if area: area_stations[area] = station
        return station

    for route in sorted(relations.routes, key=lambda r: (r['tags']['ref'], r['id'])):
        tags = route['tags']; ref = tags['ref']
        line = lines.setdefault(ref, {'id': ref, 'name': f'خط {ref}', 'color': COLORS[ref], 'stationIds': [], 'routes': []})
        ordered = []; segments = []
        for kind, member_id, role in route['members']:
            if kind == 'n' and role.startswith('stop'):
                station = station_for(member_id)
                if not station: continue
                if ref not in station['metroLines']: station['metroLines'].append(ref)
                if station['id'] not in line['stationIds']: line['stationIds'].append(station['id'])
                if not ordered or ordered[-1] != station['id']: ordered.append(station['id'])
            if kind == 'w' and role not in ['platform', 'inactive'] and member_id in geometry.ways:
                segments.append(geometry.ways[member_id])
        # Keep both directions and branch paths to retain stations and all track coverage.
        line['routes'].append({'id': str(route['id']), 'from': tags.get('from', ''), 'to': tags.get('to', ''),
            'name': tags.get('name:fa') or tags.get('name', ''), 'stationIds': ordered, 'segments': segments,
            'sourceUrl': f'https://www.openstreetmap.org/relation/{route["id"]}'})
    for line in lines.values():
        line['routes'].sort(key=lambda route: -len(route['stationIds']))
        line['stationIds'] = list(dict.fromkeys(sid for route in line['routes'] for sid in route['stationIds']))
        for order, sid in enumerate(line['stationIds']):
            stations[sid].setdefault('metroOrder', {})[line['id']] = order
    payload = {'source': 'OpenStreetMap route relations; geometry from Geofabrik Iran extract',
        'sourceUrl': 'https://download.geofabrik.de/asia/iran.html', 'sourceTimestamp': timestamp,
        'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'coverage': 'Seven numbered Tehran metro lines with mapped branches; OSM is not live operating information.',
        'lines': sorted(lines.values(), key=lambda line: int(line['id'])), 'stations': list(stations.values())}
    if len(lines) != 7 or any(not line['stationIds'] or not line['routes'] for line in lines.values()):
        raise RuntimeError('Incomplete network import; previous network retained')
    dest = ROOT / 'public/data/tehran-metro.json'
    temp = dest.with_suffix('.tmp'); temp.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8'); temp.replace(dest)
    print(json.dumps({'stations': len(stations), 'interchanges': sum(len(s['metroLines']) > 1 for s in stations.values()),
        'lines': {key: {'stations': len(line['stationIds']), 'routes': len(line['routes']),
        'segments': sum(len(r['segments']) for r in line['routes'])} for key, line in lines.items()}}), flush=True)
