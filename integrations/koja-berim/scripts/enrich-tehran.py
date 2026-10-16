"""Resolve Tehran photos using explicit references or reviewed geographic matches.

No name-only image matching. Commons authors, file pages and licenses are retained.
Requires Pillow for local WebP conversion. Existing photos are never removed.
"""
import argparse
from collections import defaultdict
import datetime
import hashlib
import html
import io
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UA = 'KojaBerim/1.2 (Tehran guide; Wikimedia attribution provided)'


def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=25) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code == 429 and urllib.parse.urlparse(url).hostname == 'upload.wikimedia.org': raise
            if error.code not in [429, 503] or attempt == 3: raise
            time.sleep(min(30, max(5, int(error.headers.get('Retry-After', 5 * (attempt + 1))))))


def api(host, params):
    url = f'https://{host}/w/api.php?' + urllib.parse.urlencode({'format': 'json', **params})
    cache = ROOT / '.data-cache/media'
    cache.mkdir(parents=True, exist_ok=True)
    path = cache / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if path.exists(): return json.loads(path.read_text(encoding='utf-8'))
    result = json.loads(get(url))
    path.write_text(json.dumps(result), encoding='utf-8')
    return result


def chunks(items, count=40):
    items = list(items)
    for start in range(0, len(items), count): yield items[start:start + count]


def clean(value):
    return html.unescape(re.sub('<[^>]+>', '', value or ''))[:220]


def file_key(value):
    return urllib.parse.unquote(value.split('File:')[-1]).replace('_', ' ').casefold()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reviewed-matches', type=Path,
        help='Import only a reviewed name/coordinate match manifest, not raw discovery output')
    parser.add_argument('--metro-only', action='store_true', help='Resolve the explicit references of metro stations only')
    args = parser.parse_args()
    snapshot_path = ROOT / 'public/data/tehran.json'
    featured_path = ROOT / 'public/data/featured.json'
    snapshot = json.loads(snapshot_path.read_text(encoding='utf-8'))
    featured = json.loads(featured_path.read_text(encoding='utf-8'))
    metro_path = ROOT / 'public/data/tehran-metro.json'
    metro = json.loads(metro_path.read_text(encoding='utf-8')) if metro_path.exists() else {'stations': []}
    rejections = json.loads((ROOT / 'scripts/tehran-photo-rejections.json').read_text(encoding='utf-8'))
    rejected_files = {file_key(item['source']) for item in rejections['rejections']}
    for entry in [*snapshot.get('details', {}).values(), *featured, *metro['stations']]:
        if file_key(entry.get('photo', {}).get('source', '')) in rejected_files:
            entry.pop('photo', None)
            entry.pop('photoMatch', None)
    records = []
    for element in snapshot['elements']:
        tags = element['tags']
        if tags.get('wikidata') or tags.get('wikipedia') or tags.get('wikimedia_commons'):
            records.append({'id': f'osm:{element["type"]}/{element["id"]}', 'wikidata': tags.get('wikidata'),
                'wikipedia': tags.get('wikipedia'), 'commons': tags.get('wikimedia_commons')})
    for place in featured:
        if place.get('city') == 'tehran' and not place.get('photo'):
            title = urllib.parse.unquote(urllib.parse.urlparse(place.get('wiki', '')).path.split('/wiki/')[-1]).replace('_', ' ')
            records.append({'id': place['id'], 'wikidata': place.get('wikidata'), 'wikipedia': 'fa:' + title if title else None})
    metadata = snapshot.setdefault('details', {})
    metro_records = []
    for station in metro['stations']:
        if station.get('photo') or metadata.get(station['id'], {}).get('photo'): continue
        title = urllib.parse.unquote(urllib.parse.urlparse(station.get('wiki', '')).path.split('/wiki/')[-1]).replace('_', ' ')
        metro_records.append({'id': station['id'], 'wikidata': station.get('wikidata'),
            'wikipedia': 'fa:' + title if title else None})
    records = metro_records if args.metro_only else records + metro_records
    if args.reviewed_matches:
        reviewed = json.loads(args.reviewed_matches.read_text(encoding='utf-8'))
        if reviewed.get('visualReview') is not True:
            raise ValueError('A visually reviewed manifest is required; raw discovery output cannot be imported.')
        records = [{'id': match['id'], 'commons': match['commons'], 'photoMatch': match}
            for match in reviewed['matches'] if match.get('reviewed') is True and
            not metadata.get(match['id'], {}).get('photo')]
    filenames = {}
    qids = {r['wikidata'] for r in records if re.fullmatch(r'Q\d+', r.get('wikidata') or '')}
    for group in chunks(sorted(qids)):
        try:
            data = api('www.wikidata.org', {'action': 'wbgetentities', 'ids': '|'.join(group), 'props': 'claims'})
            for qid, entity in data.get('entities', {}).items():
                for claim in entity.get('claims', {}).get('P18', []):
                    if claim.get('rank') == 'deprecated': continue
                    value = claim.get('mainsnak', {}).get('datavalue', {}).get('value')
                    if value: filenames[qid] = 'File:' + value; break
            print(f'Wikidata: {len(filenames)} explicit photos found', flush=True)
            time.sleep(1)
        except Exception as error: print(f'Wikidata batch failed: {error}', flush=True)
    languages = defaultdict(set)
    for record in records:
        wikipedia = record.get('wikipedia') or ''
        if ':' in wikipedia:
            language, title = wikipedia.split(':', 1)
            if re.fullmatch('[a-z-]+', language): languages[language].add(title.replace('_', ' '))
    wiki = {}
    for language, titles in languages.items():
        for group in chunks(sorted(titles), 20):
            try:
                data = api(f'{language}.wikipedia.org', {'action': 'query', 'formatversion': 2, 'titles': '|'.join(group),
                    'redirects': 1, 'prop': 'pageimages|extracts', 'piprop': 'name', 'exintro': 1, 'explaintext': 1})
                pages = {p['title']: p for p in data.get('query', {}).get('pages', [])}
                redirects = {p['from']: p['to'] for p in data.get('query', {}).get('normalized', []) + data.get('query', {}).get('redirects', [])}
                for title in group:
                    target = title
                    for _ in range(5):
                        if target not in redirects: break
                        target = redirects[target]
                    wiki[f'{language}:{title}'] = pages.get(target, {})
                time.sleep(1)
            except Exception as error: print(f'Wikipedia batch failed: {error}', flush=True)
    requests = defaultdict(list)
    for record in records:
        page = wiki.get((record.get('wikipedia') or '').replace('_', ' '), {})
        filename = record.get('commons') or filenames.get(record.get('wikidata')) or ('File:' + page['pageimage'] if page.get('pageimage') else None)
        if filename and filename.startswith('File:') and file_key(filename) not in rejected_files and not metadata.get(record['id'], {}).get('photo'):
            requests[filename].append(record)
        if (record.get('wikipedia') or '').startswith('fa:') and page.get('extract'):
            metadata.setdefault(record['id'], {})['description'] = page['extract'].split('\n')[0][:320]
    downloaded = 0
    for group in chunks(sorted(requests), 20):
        try:
            data = api('commons.wikimedia.org', {'action': 'query', 'formatversion': 2, 'titles': '|'.join(group),
                'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 500})
            normalized = {r['from']: r['to'] for r in data.get('query', {}).get('normalized', [])}
            pages = {p['title']: p for p in data.get('query', {}).get('pages', [])}
            for filename in group:
                info = pages.get(normalized.get(filename, filename), {}).get('imageinfo', [{}])[0]
                ext = info.get('extmetadata', {})
                license_name = clean(ext.get('LicenseShortName', {}).get('value'))
                # A known free license is required before bundling the photograph.
                if not re.search('CC|Public domain|PDM|GFDL', license_name, re.I) or re.search('NC|ND', license_name): continue
                url = info.get('thumburl') or info.get('url')
                if not url: continue
                name = str(int(hashlib.sha256(filename.encode()).hexdigest()[:13], 16)) + '.webp'
                local = ROOT / 'public/photos' / name
                try:
                    if not local.exists():
                        image = Image.open(io.BytesIO(get(url)))
                        image.thumbnail((780, 600))
                        image.convert('RGB').save(local, 'WEBP', quality=80)
                    photo = {'url': 'photos/' + name, 'source': info.get('descriptionurl') or 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(filename),
                        'author': clean(ext.get('Artist', {}).get('value')) or 'Wikimedia Commons',
                        'license': license_name, 'licenseUrl': ext.get('LicenseUrl', {}).get('value', '')}
                    for record in requests[filename]:
                        metadata.setdefault(record['id'], {})['photo'] = photo
                        if record.get('photoMatch'):
                            metadata[record['id']]['photoMatch'] = record['photoMatch']
                    downloaded += 1
                    time.sleep(.3)
                except Exception as error: print(f'Photo skipped: {error}', flush=True)
            print(f'Photos bundled: {downloaded}', flush=True)
            time.sleep(1)
        except Exception as error: print(f'Commons batch failed: {error}', flush=True)
    for place in featured:
        if place.get('city') == 'tehran' and place['id'] in metadata:
            place.update({k: v for k, v in metadata[place['id']].items() if v and not place.get(k)})
    for station in metro['stations']:
        if metadata.get(station['id'], {}).get('photo'):
            station['photo'] = metadata[station['id']]['photo']
    snapshot['mediaUpdatedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False), encoding='utf-8')
    featured_path.write_text(json.dumps(featured, ensure_ascii=False), encoding='utf-8')
    if metro_path.exists(): metro_path.write_text(json.dumps(metro, ensure_ascii=False), encoding='utf-8')
    print(f'Enriched {len(metadata)} records; {downloaded} verified free photographs.', flush=True)
