"""Prepare source-page photographs for review, then import approved place photos.

No search-result thumbnails or automatic nearest-place assignment. Discovery and
approval are separate steps. Original source/credit/rights are retained.
"""
import argparse
import datetime
import hashlib
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import sys
import time
import urllib.parse
import urllib.request
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.data-cache/web-photos'
CACHE.mkdir(parents=True, exist_ok=True)
MANIFEST = ROOT / 'scripts/tehran-web-photos.json'


def fetch(url):
    url = urllib.parse.quote(url, safe=':/?=&%+@,;()-_~')
    path = CACHE / hashlib.sha256(url.encode()).hexdigest()
    if path.exists(): return path.read_bytes()
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 KojaBerim/1.4 (source-attributed city guide)'})
    with urllib.request.urlopen(request, timeout=25) as response:
        body = response.read(20_000_000)
    path.write_bytes(body)
    time.sleep(.5)
    return body


class PageImages(HTMLParser):
    def __init__(self, url):
        super().__init__()
        self.url = url
        self.images = []
        self.title = ''
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title': self.in_title = True
        if tag == 'meta' and (attrs.get('property') or attrs.get('name')) in ['og:image', 'twitter:image']:
            self.add(attrs.get('content'), 'Main article image', True)
        if tag == 'img':
            self.add(attrs.get('data-src') or attrs.get('data-lazy-src') or attrs.get('data-original') or attrs.get('src'), attrs.get('alt', ''), False)

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False

    def handle_data(self, text):
        if self.in_title: self.title += text

    def add(self, url, caption, primary):
        if not url or url.startswith('data:'): return
        url = urllib.parse.urljoin(self.url, url)
        if not url.startswith('https://'): return
        if any(word in url.lower() for word in ['logo', 'avatar', '.svg', 'placeholder', 'loading.gif']): return
        if any(item['url'] == url for item in self.images): return
        item = {'url': url, 'caption': caption}
        if primary: self.images.insert(0, item)
        else: self.images.append(item)


def prepare(entries):
    report = []
    for index, entry in enumerate(entries):
        try:
            page = PageImages(entry['source'])
            page.feed(fetch(entry['source']).decode('utf-8', errors='replace'))
            candidate = {**entry, 'sourceTitle': page.title.strip(), 'candidates': page.images[:60]}
            report.append(candidate)
            # A preview is not an approved photograph and is never added to data.
            preview_url = entry.get('image') or (page.images[0]['url'] if page.images else None)
            if preview_url:
                image = Image.open(io.BytesIO(fetch(preview_url)))
                image.thumbnail((600, 450))
                image.convert('RGB').save(CACHE / f'preview-{index}.jpg')
            print(f'{index}: {entry["name"]}: {len(page.images)} image candidates', flush=True)
        except Exception as error:
            print(f'{index}: source unavailable: {error}', flush=True)
    (CACHE / 'candidates.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


def apply(entries):
    path = ROOT / 'public/data/tehran.json'
    snapshot = json.loads(path.read_text(encoding='utf-8'))
    details = snapshot.setdefault('details', {})
    elements = {f'osm:{e["type"]}/{e["id"]}': e for e in snapshot['elements']}
    featured_path = ROOT / 'public/data/featured.json'
    featured = json.loads(featured_path.read_text(encoding='utf-8'))
    featured_by_id = {p['id']: p for p in featured if p.get('city') == 'tehran'}
    added = 0
    for entry in entries:
        if not all(entry.get(key) for key in ['reviewed', 'visualReview', 'image', 'reviewNotes', 'credit', 'rights']): continue
        identifiers = entry['ids']
        for identifier in identifiers:
            if identifier not in elements and identifier not in featured_by_id:
                raise ValueError(f'Unknown place: {identifier}')
            tags = elements.get(identifier, {}).get('tags', {})
            if tags.get('amenity') == 'cafe' or tags.get('railway') == 'station':
                raise ValueError('This import is restricted to sights, history and nature, excluding cafes and metro.')
        image = Image.open(io.BytesIO(fetch(entry['image'])))
        if image.width < 300 or image.height < 180: raise ValueError('Image is too small for a verified place photo')
        image.thumbnail((780, 600))
        name = str(int(hashlib.sha256(entry['image'].encode()).hexdigest()[:13], 16)) + '.webp'
        image.convert('RGB').save(ROOT / 'public/photos' / name, 'WEBP', quality=82)
        photo = {'url': 'photos/' + name, 'source': entry['source'],
            'author': entry['credit'], 'license': entry['rights']}
        for identifier in identifiers:
            metadata = details.setdefault(identifier, {})
            if metadata.get('photo') or featured_by_id.get(identifier, {}).get('photo'): continue
            metadata['photo'] = photo
            metadata['photoMatch'] = {'method': 'reviewed-source-page', 'source': entry['source'],
                'image': entry['image'], 'reviewed': True, 'visualReview': True, 'reviewNotes': entry['reviewNotes']}
            if identifier in featured_by_id: featured_by_id[identifier]['photo'] = photo
            added += 1
        print(f'Imported: {entry["name"]}', flush=True)
    snapshot['mediaUpdatedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    path.write_text(json.dumps(snapshot, ensure_ascii=False), encoding='utf-8')
    featured_path.write_text(json.dumps(featured, ensure_ascii=False), encoding='utf-8')
    print(f'Added {added} reviewed photographed source records.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    entries = json.loads(MANIFEST.read_text(encoding='utf-8'))['places']
    apply(entries) if args.apply else prepare(entries)
