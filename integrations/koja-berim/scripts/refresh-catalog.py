"""Refresh city snapshots without losing bundled records on provider failure."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
UA = 'KojaBerim/1.1 (city guide; OpenStreetMap snapshot refresh)'
DISCOVERY = json.loads((ROOT / 'src/discovery.json').read_text(encoding='utf-8'))
CITIES = [
    ('tehran', 35.72, 51.413), ('isfahan', 32.657, 51.677),
    ('shiraz', 29.616, 52.542), ('tabriz', 38.073, 46.299),
    ('rasht', 37.28, 49.586), ('mashhad', 36.29, 59.604),
    ('yazd', 31.896, 54.367), ('kashan', 33.985, 51.442),
]
HOSTS = ['https://overpass.private.coffee/api/interpreter',
         'https://overpass.kumi.systems/api/interpreter',
         'https://overpass-api.de/api/interpreter']


def query(lat, lng):
    around = f'(around:15000,{lat},{lng})'
    def named(selector):
        return f'nwr{around}{selector}[~"^(name|name:fa)$"~"."];'
    parts = [named('[amenity=cafe]')]
    parts += [named(f'[{key}~"^({"|".join(values)})$"]')
              for key, values in DISCOVERY.items()]
    parts += [f'nwr{around}[railway=station][station=subway];',
              f'nwr{around}[railway=station][subway=yes];']
    return '[out:json][timeout:25];(' + ''.join(parts) + ');out tags center;'


def prepare_city(city):
    slug, lat, lng = city
    dest = ROOT / 'public/data' / f'{slug}.json'
    previous = json.loads(dest.read_text(encoding='utf-8')) if dest.exists() else {}
    for host in HOSTS:
        try:
            request = urllib.request.Request(
                host + '?' + urllib.parse.urlencode({'data': query(lat, lng)}),
                headers={'User-Agent': UA})
            with urllib.request.urlopen(request, timeout=35) as response:
                data = json.load(response)
            if data.get('remark') or not isinstance(data.get('elements'), list) or not data['elements']:
                raise ValueError('incomplete or empty response; existing snapshot retained')
            records = {(e['type'], e['id']): e for e in previous.get('elements', [])}
            records.update({(e['type'], e['id']): e for e in data['elements']})
            payload = {**previous, 'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                       'source': 'OpenStreetMap / Overpass', 'radius': 15000,
                       'center': {'lat': lat, 'lng': lng}, 'elements': list(records.values())}
            temporary = dest.with_suffix('.tmp')
            temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
            temporary.replace(dest)
            print(f'{slug}: {len(previous.get("elements", []))} -> {len(records)} records', flush=True)
            return True
        except Exception as error:
            print(f'{slug}: {host}: {str(error)[:120]}', flush=True)
    print(f'{slug}: refresh failed; previous snapshot retained', flush=True)
    return False


if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(prepare_city, CITIES))
    print(f'Refreshed {sum(results)}/{len(CITIES)} cities; no existing data deleted.', flush=True)
