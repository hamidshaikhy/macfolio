"""Add source-verified sights; preserve existing photos and skip missing coordinates."""
import concurrent.futures
import json
import math
import time
from pathlib import Path
import urllib.parse
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
TITLES = {
 'tehran': ['کاخ نیاوران', 'موزه آبگینه و سفالینه', 'موزه فرش ایران', 'موزه هنرهای معاصر تهران', 'موزه رضا عباسی', 'باغ موزه قصر', 'باغ فردوس', 'عمارت مسعودیه', 'سردر باغ ملی', 'بازار تهران', 'خانه موزه مقدم', 'موزه زمان', 'کتابخانه و موزه ملی ملک', 'موزه جواهرات ملی', 'برج طغرل', 'چشمه علی', 'دربند', 'درکه', 'بوستان ملت', 'بوستان آب و آتش', 'بوستان چیتگر', 'دریاچه چیتگر', 'پارک جنگلی لویزان', 'پارک جنگلی سرخه حصار', 'بوستان نهج‌البلاغه', 'بوستان پردیسان', 'باغ گیاه‌شناسی ملی ایران', 'توچال'],
 'isfahan': ['چهل‌ستون', 'سی‌وسه‌پل', 'عالی‌قاپو', 'مسجد شیخ لطف‌الله', 'مسجد شاه (اصفهان)', 'مسجد جامع اصفهان', 'کاخ هشت‌بهشت', 'باغ پرندگان اصفهان', 'باغ گل‌های اصفهان', 'کوه صفه', 'آتشگاه اصفهان', 'پل شهرستان', 'پل مارنان', 'بازار قیصریه', 'حمام علیقلی آقا', 'مناره ساربان', 'مناره چهل‌دختران', 'کلیسای بیت‌لحم'],
 'shiraz': ['آرامگاه سعدی', 'باغ دلگشا', 'باغ جهان‌نما', 'مسجد وکیل', 'بازار وکیل', 'حمام وکیل', 'نارنجستان قوام', 'خانه زینت‌الملک', 'دروازه قرآن', 'آرامگاه خواجوی کرمانی', 'موزه پارس', 'مسجد جامع عتیق شیراز', 'شاهچراغ', 'نقش رستم', 'نقش رجب', 'باغ جنت', 'پارک کوهستانی دراک', 'باغ نظر'],
 'tabriz': ['بازار تبریز', 'مسجد کبود', 'مقبرةالشعرا', 'ارگ علیشاه', 'خانه قاجار', 'موزه قاجار', 'خانه استاد شهریار', 'مسجد جامع تبریز', 'کوه عینالی', 'موزه عصر آهن', 'عمارت شهرداری تبریز', 'ربع رشیدی', 'کلیسای مریم مقدس تبریز', 'پارک باغلارباغی', 'خانه بهنام', 'خانه حریری'],
 'rasht': ['باغ محتشم', 'عمارت کلاه فرنگی رشت', 'موزه رشت', 'خانه میرزا کوچک خان', 'آرامگاه میرزا کوچک خان', 'پارک جنگلی سراوان', 'تالاب عینک', 'پارک ملت رشت', 'موزه پست رشت', 'دریاچه سقالکسار'],
 'mashhad': ['حرم امام رضا', 'مسجد گوهرشاد', 'موزه آستان قدس رضوی', 'آرامگاه پیر پالاندوز', 'گنبد سبز (مشهد)', 'گنبد هارونیه', 'بوستان وکیل‌آباد', 'پارک وکیل‌آباد', 'باغ گیاه‌شناسی مشهد', 'طرقبه', 'شاندیز', 'بند گلستان', 'پارک خورشید مشهد', 'بازار رضا', 'خانه داروغه', 'خانه ملک', 'مقبره خواجه ربیع', 'میل اخنگان'],
 'yazd': ['مجموعه امیرچخماق', 'زندان اسکندر', 'دخمه زرتشتیان', 'موزه آب یزد', 'خانه لاری‌ها', 'بقعه دوازده امام', 'آب‌انبار شش بادگیری', 'میدان مارکار', 'مسجد ریگ (یزد)', 'بازار خان یزد', 'حمام خان یزد', 'باغ ناجی', 'نارین قلعه (میبد)', 'کاروانسرای زین‌الدین'],
 'kashan': ['تپه سیلک', 'مسجد آقابزرگ', 'خانه عباسیان', 'خانه عامری‌ها', 'بازار کاشان', 'مسجد جامع کاشان', 'آرامگاه سهراب سپهری', 'شهر زیرزمینی نوش‌آباد', 'حمام فین', 'آتشکده نیاسر', 'باغ تالار نیاسر', 'آبشار نیاسر', 'قمصر', 'مشهد اردهال', 'تیمچه امین‌الدوله'],
}
NATURE = {'دربند', 'درکه', 'توچال', 'باغ گیاه‌شناسی ملی ایران', 'دریاچه چیتگر', 'باغ پرندگان اصفهان', 'باغ گل‌های اصفهان', 'کوه صفه', 'باغ دلگشا', 'باغ جهان‌نما', 'باغ جنت', 'کوه عینالی', 'باغ محتشم', 'تالاب عینک', 'دریاچه سقالکسار', 'باغ گیاه‌شناسی مشهد', 'طرقبه', 'شاندیز', 'بند گلستان', 'باغ ناجی', 'باغ تالار نیاسر', 'آبشار نیاسر', 'قمصر'}
CENTERS = {c[0]: (c[1], c[2]) for c in __import__('runpy').run_path(str(ROOT / 'scripts/refresh-catalog.py'))['CITIES']}


def api(host, params):
    url = f'https://{host}/w/api.php?' + urllib.parse.urlencode({'format': 'json', **params})
    request = urllib.request.Request(url, headers={'User-Agent': 'KojaBerim/1.1 (city guide; Wikipedia attribution provided)'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code not in [429, 503] or attempt == 3: raise
            delay = int(error.headers.get('Retry-After', 5 * (attempt + 1)))
            time.sleep(min(30, max(3, delay)))


def fetch_city(args):
    city, titles = args
    try:
        data = api('fa.wikipedia.org', {'action': 'query', 'formatversion': 2, 'titles': '|'.join(titles),
          'redirects': 1, 'prop': 'coordinates|extracts|info|pageprops', 'exintro': 1,
          'explaintext': 1, 'inprop': 'url', 'colimit': 1})
        pages = [p for p in data.get('query', {}).get('pages', []) if 'missing' not in p]
        ids = [p['pageprops']['wikibase_item'] for p in pages if p.get('pageprops', {}).get('wikibase_item')]
        entities = api('www.wikidata.org', {'action': 'wbgetentities', 'ids': '|'.join(ids), 'props': 'claims'}).get('entities', {}) if ids else {}
        records = []
        for page in pages:
            qid = page.get('pageprops', {}).get('wikibase_item')
            coords = page.get('coordinates', [])
            point = coords[0] if coords else None
            if not point:
                claims = entities.get(qid, {}).get('claims', {}).get('P625', [])
                claims = sorted(claims, key=lambda c: c.get('rank') != 'preferred')
                for claim in claims:
                    if claim.get('rank') == 'deprecated': continue
                    value = claim.get('mainsnak', {}).get('datavalue', {}).get('value', {})
                    if value.get('globe', '').endswith('/Q2') and 'latitude' in value:
                        point = {'lat': value['latitude'], 'lon': value['longitude']}
                        break
            if not point:
                print(f'{city}: skipped {page["pageid"]}: no verified coordinates', flush=True)
                continue
            lat, lng = point['lat'], point['lon']
            center = CENTERS[city]
            # Reject ambiguous redirects to a place outside the selected city region.
            km = math.hypot((lat - center[0]) * 111.2, (lng - center[1]) * 111.2 * math.cos(math.radians(lat)))
            if km > 85: continue
            title = page['title']
            category = 'nature' if title in NATURE or any(w in title for w in ['بوستان', 'پارک ', 'آبشار']) else 'sight'
            records.append({'id': f'wiki:{page["pageid"]}', 'name': title, 'category': category, 'city': city,
                'lat': lat, 'lng': lng, 'wikidata': qid, 'wiki': page['fullurl'], 'featured': True,
                'description': page.get('extract', '').split('\n')[0][:320],
                'source': 'Wikipedia / Wikidata', 'coordinateSource': f'https://www.wikidata.org/wiki/{qid}' if qid else page['fullurl']})
        print(f'{city}: {len(records)} verified sights', flush=True)
        return records
    except Exception as error:
        print(f'{city}: {error}; existing records retained', flush=True)
        return []


if __name__ == '__main__':
    dest = ROOT / 'public/data/featured.json'
    previous = json.loads(dest.read_text(encoding='utf-8'))
    records = {p['id']: p for p in previous}
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        for group in pool.map(fetch_city, TITLES.items()):
            for record in group:
                if record['id'] not in records: records[record['id']] = record
    temporary = dest.with_suffix('.tmp')
    temporary.write_text(json.dumps(list(records.values()), ensure_ascii=False), encoding='utf-8')
    temporary.replace(dest)
    print(f'Featured sights: {len(previous)} -> {len(records)}; existing photos retained.', flush=True)
