import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addHistory,addToPlaylist,curatedPlaylists,duration,emptyLibrary,nextIndex,normalizeTrack,normalizePlaylist,safeUrl,toggleLike,type Track} from '../src/model';
const t=(id='abc'):Track=>({id,title:'Track',artist:'Artist',handle:'artist',duration:125,artwork:'',genre:'House',mood:'',permalink:''});
test('normalization rejects paid, unavailable and malformed tracks',()=>{assert.equal(normalizeTrack({id:'abc',title:'Paid',is_stream_gated:true}),null);assert.equal(normalizeTrack({id:'abc',title:'Gone',is_available:false}),null);assert.equal(normalizeTrack({id:'../injection',title:'No'}),null);const normalized=normalizeTrack({id:'abc',title:'Real',duration:60,user:{name:'Name'},artwork:{'480x480':'javascript:alert(1)'}});assert.equal(normalized?.artwork,'');assert.equal(normalized?.artist,'Name');});
test('favorites toggle without mutating source library',()=>{const original=emptyLibrary(),on=toggleLike(original,t());assert.equal(original.liked.length,0);assert.equal(on.liked.length,1);assert.equal(toggleLike(on,t()).liked.length,0);});
test('history deduplicates and keeps newest first',()=>{let l=emptyLibrary();for(let i=0;i<50;i++)l=addHistory(l,t(String(i)));assert.equal(l.history.length,40);l=addHistory(l,t('20'));assert.equal(l.history[0].id,'20');assert.equal(l.history.filter(x=>x.id==='20').length,1);});
test('adding the same track twice does not duplicate playlist',()=>{let l=emptyLibrary();l.playlists=[{id:'local-1',name:'Mix',kind:'local',description:'',artwork:'',owner:'Me',count:0,tracks:[]}];l=addToPlaylist(l,'local-1',t());l=addToPlaylist(l,'local-1',t());assert.equal(l.playlists[0].count,1);assert.equal(l.playlists[0].tracks?.length,1);});
test('queue respects stop, repeat-all and repeat-one at end',()=>{assert.equal(nextIndex(2,3,false,'off',true),null);assert.equal(nextIndex(2,3,false,'all',true),0);assert.equal(nextIndex(1,3,false,'one',true),1);assert.equal(nextIndex(1,3,false,'one',false),2);assert.equal(nextIndex(0,0,false,'off'),null);});
test('shuffle never immediately repeats same track when alternatives exist',()=>{for(let i=0;i<5;i++)for(const random of [0,.2,.5,.99])assert.notEqual(nextIndex(i,5,true,'all',false,()=>random),i);});
test('curated playlists contain real catalog tracks only',()=>{const catalog=[t('a'),t('b'),t('c')];const p=curatedPlaylists(catalog);assert.equal(p.length,4);for(const item of p){assert.equal(item.count,item.tracks?.length);assert.ok(item.tracks?.every(x=>catalog.some(t=>t.id===x.id)));}assert.ok(curatedPlaylists([]).every(x=>x.count===0));});
test('duration formatting and safe URLs',()=>{assert.equal(duration(125),'۲:۰۵');assert.equal(duration(NaN),'۰:۰۰');assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('https://example.com/a.jpg'),'https://example.com/a.jpg');});

test('remote playlist metadata retains the original language, artwork and creator',()=>{
 for(const name of ['Night Drive / Vol. 2 🌙','موسیقی شبانه','夜の音楽']){
  const raw={id:'abc123',playlist_name:name,description:'Original description https://audius.co/artist',track_count:12,user:{name:'Original Artist'},artwork:{'480x480':'https://example.com/original-cover.jpg'}};
  const p=normalizePlaylist(raw);
  assert.equal(p?.name,raw.playlist_name);
  assert.equal(p?.description,raw.description);
  assert.equal(p?.artwork,raw.artwork['480x480']);
  assert.equal(p?.owner,raw.user.name);
  assert.equal(p?.kind,'remote');
 }
});

test('long API titles and descriptions are preserved without replacing or shortening metadata',()=>{
 const name='Original playlist title '.repeat(12),description='Original description. '.repeat(90);
 const playlist=normalizePlaylist({id:'abc123',playlist_name:name,description});
 assert.equal(playlist?.name,name);
 assert.equal(playlist?.description,description);
 const title='Original track title '.repeat(20),artist='Original artist '.repeat(12);
 const track=normalizeTrack({id:'abc123',title,user:{name:artist}});
 assert.equal(track?.title,title);
 assert.equal(track?.artist,artist);
});
