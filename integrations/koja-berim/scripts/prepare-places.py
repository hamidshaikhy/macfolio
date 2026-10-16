from pathlib import Path
import urllib.request,urllib.parse,json,concurrent.futures,time,re,io
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
UA='KojaBerim/1.0 (https://github.com/hamidshaikhy; hamidshaikhy1382@gmail.com)'
CITIES={
 'tehran':['کاخ گلستان','باغ نگارستان','کاخ سعدآباد','کاخ نیاوران','موزه ملی ایران','پل طبیعت','برج آزادی','برج میلاد','پارک ملت','پارک لاله','پارک جمشیدیه','دربند','کافه نادری','کافه گل رضاییه'],
 'isfahan':['میدان نقش جهان','کاخ چهل‌ستون','سی‌وسه‌پل','پل خواجو','عمارت عالی‌قاپو','کلیسای وانک','منارجنبان'],
 'shiraz':['تخت جمشید','حافظیه','آرامگاه سعدی','باغ ارم','مسجد نصیرالملک','ارگ کریم‌خان','باغ عفیف‌آباد'],
 'tabriz':['بازار تبریز','ائل‌گلی','مسجد کبود','موزه آذربایجان','خانه مشروطه تبریز'],
 'rasht':['میدان شهرداری رشت','موزه میراث روستایی گیلان','باغ محتشم','بازار رشت'],
 'mashhad':['آرامگاه فردوسی','کوهسنگی','پارک ملت مشهد','باغ نادری'],
 'yazd':['باغ دولت‌آباد','مجموعه امیرچخماق','آتشکده یزد','مسجد جامع یزد','زندان اسکندر'],
 'kashan':['باغ فین','خانه طباطبایی‌ها','خانه بروجردی‌ها','حمام سلطان امیراحمد','تپه سیلک']}
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=25) as r:return r.read()
def wiki(params,lang='fa'):
 return json.loads(get(f'https://{lang}.wikipedia.org/w/api.php?'+urllib.parse.urlencode({'format':'json',**params})))
def item(args):
 city,title=args
 try:
  d=wiki({'action':'query','titles':title,'redirects':1,'prop':'pageimages|coordinates|extracts|info|pageprops','piprop':'thumbnail|name','pithumbsize':700,'exintro':1,'explaintext':1,'inprop':'url','colimit':1})
  p=next(iter(d['query']['pages'].values()))
  coord=p.get('coordinates',[None])[0]
  if not coord:return None
  cat='cafe' if 'کافه' in title else ('nature' if any(s in title for s in ['پارک','باغ','دربند','ائل','کوهسنگی']) and not any(s in title for s in ['نگارستان','نادری','دولت','فین','ارم','عفیف']) else 'sight')
  rec={'id':'wiki:'+str(p['pageid']),'name':p['title'],'lat':coord['lat'],'lng':coord['lon'],'category':cat,'city':city,'featured':True,'wiki':p.get('fullurl','https://fa.wikipedia.org/wiki/'+urllib.parse.quote(p['title'])),'wikidata':p.get('pageprops',{}).get('wikibase_item'),'description':p.get('extract','').split('\n')[0][:300],'source':'Wikipedia','photo':None}
  if p.get('thumbnail') and p.get('pageimage'):
   url=p['thumbnail']['source'];b=get(url);image=Image.open(io.BytesIO(b));image.thumbnail((780,600));filename=str(p['pageid'])+'.webp';image.convert('RGB').save(ROOT/'public/photos'/filename,'WEBP',quality=80)
   meta={}
   try:
    md=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':'File:'+p['pageimage'],'prop':'imageinfo','iiprop':'extmetadata|url'})))
    mp=next(iter(md['query']['pages'].values()));ii=mp.get('imageinfo',[{}])[0];meta=ii.get('extmetadata',{})
   except: pass
   clean=lambda k:re.sub('<[^>]+>','',meta.get(k,{}).get('value',''))[:180]
   rec['photo']={'url':'photos/'+filename,'source':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(p['pageimage']),'author':clean('Artist') or 'Wikimedia Commons','license':clean('LicenseShortName') or 'مشاهده مجوز در منبع','licenseUrl':meta.get('LicenseUrl',{}).get('value','')}
  print(city,title,'photo' if rec['photo'] else 'no-photo',flush=True);return rec
 except Exception as e: print(title,str(e)[:70],flush=True);return None
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:places=[p for p in pool.map(item,[(c,t) for c,ts in CITIES.items() for t in ts]) if p]
(ROOT/'public/data/featured.json').write_text(json.dumps(places,ensure_ascii=False))
print('TOTAL',len(places),sum(bool(x['photo']) for x in places),flush=True)
