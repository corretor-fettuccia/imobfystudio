const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');process.chdir(root);
const get=(s)=>fs.readFileSync(path.join(root,s),'utf8');
const registry=JSON.parse(get('plugins/registry.json'));
for(const id of ['hero360-tour','parallax360-tour']){
  const dir=`plugins/${id}/`;
  const manifest=JSON.parse(get(dir+'plugin.json'));
  assert.equal(manifest.schemaVersion,3);assert.equal(manifest.type,'section');assert.equal(manifest.editor?.mode,'modal');
  assert(registry.packages.some(x=>x.manifest===dir+'plugin.json'),id+' ausente no registro');
  for(const rel of ['template.html','plugin.css','plugin.js','editor/index.html','editor/styles.css','editor/app.js']) assert(fs.existsSync(path.join(root,dir,rel)),id+' sem '+rel);
  assert.equal(JSON.parse(manifest.defaults.tourConfig).format,'ImobStudioTour360');
  const script=get(dir+'plugin.js');new vm.Script(script,{filename:dir+'plugin.js'});
  assert(script.includes(id==='hero360-tour'?'function loadScene':'viewer.lookAt'), 'navegação panorâmica não configurada');
  assert(script.includes(id==='hero360-tour'?'function createGL':'pannellum.viewer'), 'motor panorâmico não registrado');
  assert(script.includes('sceneOrder'), 'não preserva ordem do Tour360');
  assert(script.includes('safeUrl'), 'URLs de CTA precisam de normalização');
  assert(get(dir+'editor/app.js').includes('data-hs="info"'), 'banner não editável no modal');
  assert(get(dir+'editor/app.js').includes('Informação/Texto de apresentação')||get(dir+'editor/app.js').includes('Texto de apresentação (banner)'), 'campo de apresentação ausente');
}
const hero=JSON.parse(get('plugins/hero360-tour/plugin.json'));assert.equal(hero.defaults.idleSeconds,10);assert(hero.fields.some(x=>x.key==='swayYaw'));assert(get('plugins/hero360-tour/plugin.js').includes('window.matchMedia'));
const parallax=JSON.parse(get('plugins/parallax360-tour/plugin.json'));assert.equal(parallax.defaults.scrollNavigation,true);assert(get('plugins/parallax360-tour/plugin.js').includes('passive:false'));assert(get('plugins/parallax360-tour/plugin.js').includes('advance(dir)'));
assert(get('assets/js/compiler.js').includes("['tour360-pro','hero360-tour','parallax360-tour'].includes(section.type)"));
const JSZip=require(path.join(root,'vendor/jszip.min.js'));
const ctx={console,window:{JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}},JSZip,fetch:async(resource)=>{const file=path.join(root,String(resource).replace(/^\.\//,''));if(!fs.existsSync(file))return {ok:false,status:404};const b=fs.readFileSync(file);return {ok:true,status:200,headers:{get:()=>null},text:async()=>b.toString(),json:async()=>JSON.parse(b.toString()),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}},setTimeout,clearTimeout,Blob,URL,TextEncoder,TextDecoder};ctx.global=ctx;vm.createContext(ctx);
(async()=>{
  for(const f of ['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js','assets/js/renderer.js','assets/js/compiler.js']) vm.runInContext(get(f),ctx,{filename:f});
  await ctx.window.ImobifyPluginLoader.ready;
  for(const id of ['hero360-tour','parallax360-tour']){
    const state=ctx.window.ImobifyCatalog.defaultState();const section=ctx.window.ImobifyCatalog.createSection(id);
    assert(section, 'plugin não aparece no editor: '+id);const img='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
    const tour=JSON.parse(section.props.tourConfig);tour.scenes={a:{id:'a',title:'Sala',panorama:img,initialView:{yaw:9,pitch:0,hfov:99},hotspots:[{id:'h1',type:'info',text:'Iluminação natural',pitch:0,yaw:15,info:'Grandes aberturas'}]}};tour.sceneOrder=['a'];tour.settings.firstSceneId='a';section.props.tourConfig=JSON.stringify(tour);
    state.sections=[section];state.seo.sitemapEnabled='no';
    const result=await ctx.window.ImobifyCompiler.compile(state);const zip=await JSZip.loadAsync(await result.blob.arrayBuffer());const html=await zip.file('index.html').async('string');
    assert(html.includes('data-plugin="'+id+'"'), 'plugin não aparece na exportação');
    assert(html.includes('ims360'), 'template HTML do plugin não renderizado');
    const imgPath=JSON.parse((await zip.file('content/project.json').async('string'))).sections[0].props.tourConfig;
    const packedTour=JSON.parse(imgPath);const file=packedTour.scenes.a.panorama;
    assert(/^assets\/images\//.test(file),`Panorama ainda é Data URL no ZIP: ${file.slice(0,40)}`);assert(zip.file(file), 'Panorama físico ausente');
    assert(html.includes(file), 'HTML não recebeu o novo caminho do panorama');
  }
  console.log('immersive 360: manifests, imports, editor, cenas, hotspot, panorama ZIP e HTML OK');
})().catch(error=>{console.error(error);process.exitCode=1});
