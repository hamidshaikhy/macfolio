import urllib.request,urllib.parse,json,concurrent.futures,time,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
UA='KojaBerim/1.0 (https://github.com/hamidshaikhy; hamidshaikhy1382@gmail.com)'
def get(url,timeout=45,data=None):
 req=urllib.request.Request(url,data=data,headers={'User-Agent':UA})
 with urllib.request.urlopen(req,timeout=timeout) as r:return r.read()
CITIES=[('tehran',35.707,51.412,15000),('isfahan',32.657,51.677,10000),('shiraz',29.616,52.542,10000),('tabriz',38.073,46.299,10000),('rasht',37.28,49.586,8000),('mashhad',36.29,59.604,12000),('yazd',31.896,54.367,8000),('kashan',33.985,51.442,6500)]
def prepare_city(c):
 slug,lat,lng,r=c
 q=f'[out:json][timeout:35];(nwr(around:{r},{lat},{lng})[amenity=cafe][name];nwr(around:{r},{lat},{lng})[tourism~"^(museum|attraction|gallery|viewpoint)$"][name];nwr(around:{r},{lat},{lng})[historic~"^(monument|castle|ruins|archaeological_site|palace|fort|city_gate|memorial)$"][name];nwr(around:{r},{lat},{lng})[leisure~"^(park|garden)$"][name];nwr(around:{r},{lat},{lng})[railway=station][station=subway];nwr(around:{r},{lat},{lng})[railway=station][subway=yes];);out tags center;'
 for host in ['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.kumi.systems/api/interpreter']:
  try:
   b=get(host+'?'+urllib.parse.urlencode({'data':q}),60)
   d=json.loads(b)
   if 'elements' not in d:raise ValueError('no elements')
   dest=ROOT/'public/data'/f'{slug}.json';dest.write_text(json.dumps({'fetchedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'source':'OpenStreetMap / Overpass','radius':r,'elements':d['elements']},ensure_ascii=False))
   print(slug,len(d['elements']),flush=True);return
  except Exception as e: print(slug,host,str(e)[:90],flush=True)
 print('FAILED',slug,flush=True)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(prepare_city,CITIES))
 style=json.loads(get('https://tiles.openfreemap.org/styles/positron'))
 for layer in style['layers']:
  lid=layer['id'].lower()
  if 'poi' in lid or 'housenumber' in lid or 'airport' in lid or 'transit' in lid:
   layer.setdefault('layout',{})['visibility']='none'
  if layer.get('type')=='symbol' and 'text-field' in layer.get('layout',{}):
   layer['layout']['text-field']=['coalesce',['get','name:fa'],['get','name:nonlatin'],['get','name:latin'],['get','name']]
  paint=layer.get('paint',{})
  for key,val in list(paint.items()):
   if key=='background-color':paint[key]='#eeece4'
   if 'park' in lid and key=='fill-color':paint[key]='#dbe5cd'
   if 'water' in lid and key=='fill-color':paint[key]='#bdd9dc'
 style['name']='Koja Berim — quiet streets';(ROOT/'public/map-style.json').write_text(json.dumps(style))
