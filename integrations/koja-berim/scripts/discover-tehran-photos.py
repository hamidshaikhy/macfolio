"""Find additional keyless photos using name AND coordinate confirmation.

Produces an inspectable match report. It does not assign nearby street pictures
to venues or count multiple photos as multiple photographed places.
"""
import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path
import re
import time
import unicodedata
import urllib.parse
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.data-cache'


def normalize(text):
    text = unicodedata.normalize('NFKC', text or '').lower().replace('ي', 'ی').replace('ك', 'ک')
    text = re.sub(r'\([^)]*\)', ' ', text)
    text = re.sub(r'[^\w\s\u200c]', ' ', text)
    text = text.replace('\u200c', ' ')
    return ' '.join(text.split())


def keys(name):
    n = normalize(name)
    variants = {n}
    for prefix in ['ایستگاه مترو ', 'ایستگاه ', 'بوستان ', 'پارک ', 'موزه ', 'کاخ ', 'تهران ', 'tehran ', 'metro station ', 'park ']:
        if n.startswith(prefix): variants.add(n[len(prefix):])
    for suffix in [' metro station', ' park', ' museum', ' palace', ' tehran', ' تهران']:
        if n.endswith(suffix): variants.add(n[:-len(suffix)])
    return {n for n in variants if len(n.replace(' ', '')) >= 4}


def distance(a, b):
    return math.hypot((a['lat'] - b['lat']) * 111200,
                      (a['lng'] - b['lng']) * 111200 * math.cos(math.radians(a['lat'])))


def cached_json(url):
    path = CACHE / 'discovery' / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists(): return json.loads(path.read_text(encoding='utf-8'))
    for attempt in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'KojaBerim/1.3 (Tehran source photo discovery)'}), timeout=40) as response:
                data = json.load(response)
            break
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt: raise
            time.sleep(min(30, max(5, int(error.headers.get('Retry-After', 15)))))
    path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    time.sleep(3)
    return data


def entity_candidates():
    path = CACHE / 'tehran-photo-entities.json'
    if not path.exists():
        query = '''SELECT ?item ?itemLabel ?itemAltLabel ?coord ?image WHERE {
          SERVICE wikibase:box { ?item wdt:P625 ?coord.
            bd:serviceParam wikibase:cornerWest "Point(50.55 35.35)"^^geo:wktLiteral;
                            wikibase:cornerEast "Point(51.80 36.10)"^^geo:wktLiteral. }
          ?item wdt:P18 ?image.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "fa,en". }
        }'''
        data = cached_json('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': query, 'format': 'json'}))
        path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    data = json.loads(path.read_text(encoding='utf-8'))
    for row in data.get('results', {}).get('bindings', []):
        lng, lat = map(float, re.findall(r'[-\d.]+', row['coord']['value']))
        names = [row['itemLabel']['value']] + row.get('itemAltLabel', {}).get('value', '').split(', ')
        filename = urllib.parse.unquote(row['image']['value'].split('Special:FilePath/')[-1])
        yield {'names': names, 'lat': lat, 'lng': lng, 'wikidata': row['item']['value'].rsplit('/', 1)[-1],
               'commons': 'File:' + filename, 'source': row['item']['value'].replace('http:', 'https:'), 'method': 'wikidata-name-and-coordinate'}


def commons_candidates():
    seen = set()
    def cell(lat, lng, radius):
            url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
                'action': 'query', 'format': 'json', 'list': 'geosearch', 'gsnamespace': 6,
                'gscoord': f'{lat}|{lng}', 'gsradius': radius, 'gslimit': 500,
            })
            try:
                rows = cached_json(url).get('query', {}).get('geosearch', [])
                print(f'Commons cell {lat},{lng}: {len(rows)} geotagged files', flush=True)
                for row in rows:
                    if row['pageid'] in seen: continue
                    seen.add(row['pageid'])
                    title = row['title']
                    if not re.search(r'\.(jpe?g|png|webp|tiff?)$', title, re.I): continue
                    yield {'names': [title.split(':', 1)[-1].rsplit('.', 1)[0].replace('_', ' ')],
                           'lat': row['lat'], 'lng': row['lon'], 'commons': title,
                           'source': 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(title),
                           'method': 'commons-filename-and-coordinate'}
                # A capped response misses files in dense central Tehran.
                # Subdivide saturated circles once, reusing cached responses.
                if len(rows) == 500 and radius == 10000:
                    for dlat in [-.04, .04]:
                        for dlng in [-.05, .05]:
                            yield from cell(round(lat + dlat, 2), round(lng + dlng, 2), 6500)
            except Exception as error: print(f'Commons cell unavailable: {error}', flush=True)
    # Overlapping circles; do not perform a request per individual venue.
    for lat in [35.59, 35.71, 35.83, 35.93]:
        for lng in [51.12, 51.27, 51.42, 51.57, 51.72]:
            yield from cell(lat, lng, 10000)


def same_kind(place, candidate):
    names = ' '.join(candidate['names']).lower()
    original = normalize(place['name'])
    # A district, square, person's birthplace or nearby church is not a park photo.
    if original.startswith(('بوستان ', 'پارک ')):
        if not any(word in names for word in ['بوستان', 'پارک', 'park']): return False
    if place['category'] == 'cafe':
        if not any(word in names for word in ['کافه', 'قهوه', 'cafe', 'café', 'coffee']): return False
    if candidate['method'].startswith('commons'):
        if any(word in names for word in ['نزدیک', 'بالای', 'حوالی', ' near ', ' from ', ' looking toward ', ' close to ']): return False
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--commons', action='store_true', help='Also inspect geotagged Commons photographs')
    args = parser.parse_args()
    snapshot = json.loads((ROOT / 'public/data/tehran.json').read_text(encoding='utf-8'))
    metadata = snapshot.get('details', {})
    places = []
    for element in snapshot['elements']:
        tags = element['tags']; point = element.get('center', element)
        identifier = f'osm:{element["type"]}/{element["id"]}'
        names = [tags.get(k, '') for k in ['name', 'name:fa', 'name:en', 'alt_name', 'old_name']]
        names = [name for text in names for name in (text or '').split(';') if name]
        places.append({'id': identifier, 'name': tags.get('name:fa') or tags.get('name') or tags.get('name:en') or '',
            'names': names, 'lat': point['lat'], 'lng': point.get('lon'),
            'category': 'cafe' if tags.get('amenity') == 'cafe' else 'metro' if tags.get('railway') == 'station' else 'other',
            'wikidata': tags.get('wikidata'), 'hasPhoto': bool(metadata.get(identifier, {}).get('photo')),
            'keys': set().union(*(keys(n) for n in names))})
    index = defaultdict(list)
    for place in places:
        for key in place['keys']: index[key].append(place)
    candidates = list(entity_candidates())
    if args.commons: candidates += list(commons_candidates())
    matches = {}; ambiguous = []
    for candidate in candidates:
        candidate_keys = set().union(*(keys(n) for n in candidate['names']))
        nearby = {}
        for key in candidate_keys:
            for place in index.get(key, []):
                if place['hasPhoto']: continue
                if not same_kind(place, candidate): continue
                meters = distance(place, candidate)
                limit = 200 if place['category'] == 'cafe' else 650
                if meters > limit: continue
                if place['wikidata'] and candidate.get('wikidata') and place['wikidata'] != candidate['wikidata']: continue
                nearby[place['id']] = (place, meters, key)
        # For descriptive file names require a full, distinctive venue name,
        # and use a stricter geographic distance than entity coordinates.
        if not nearby and candidate['method'].startswith('commons'):
            filename = normalize(candidate['names'][0])
            for place in places:
                if place['hasPhoto'] or distance(place, candidate) > 250: continue
                if not same_kind(place, candidate): continue
                matching = [key for key in place['keys'] if len(key.replace(' ', '')) >= 8 and
                            (' ' + key + ' ') in (' ' + filename + ' ')]
                if matching: nearby[place['id']] = (place, distance(place, candidate), max(matching, key=len))
        # Different named sites that happen to share a photo location are rejected.
        if len({normalize(place['name']) for place, _, _ in nearby.values()}) > 1:
            ambiguous.append({'candidate': candidate, 'places': [p['name'] for p, _, _ in nearby.values()]})
            continue
        for identifier, (place, meters, name_key) in nearby.items():
            proposal = {'id': identifier, 'name': place['name'], 'commons': candidate['commons'],
                'wikidata': candidate.get('wikidata'), 'source': candidate['source'],
                'method': candidate['method'], 'distanceMeters': round(meters), 'matchedName': name_key}
            if identifier not in matches or meters < matches[identifier]['distanceMeters']:
                matches[identifier] = proposal
    report = {'candidates': len(candidates), 'matches': list(matches.values()), 'ambiguous': ambiguous,
              'previousPhotographedRecords': sum(p['hasPhoto'] for p in places),
              'newMatchedRecords': len(matches), 'unmatchedRecords': len(places) - sum(p['hasPhoto'] for p in places) - len(matches)}
    (CACHE / 'tehran-photo-matches.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if not isinstance(v, list)}, ensure_ascii=True), flush=True)
