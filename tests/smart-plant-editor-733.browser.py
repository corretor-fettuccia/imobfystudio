"""Isolated end-to-end SmartPlant + editor bridge test for navigation and return focus."""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
R=Path(__file__).parent
plugin=(R.parent/'plugins/smart-plant-v1.4.2/plugin.js').read_text()
source=(R/'fixture-733-editor.html').read_text()
i=source.index('window.__IMOBIFY_EDITOR__');start=source.rfind('(function(){',0,i);end=source.index('})();',i)+len('})();')
bridge=source[start:end]
bridge=re.sub(r'const selected="[^"]+"', 'const selected="sp"',bridge,count=1)
plants=json.dumps([{'id':'p1','title':'Planta Vento','area':'67 m²','code':'A01'}],ensure_ascii=False)
plant_attr=plants.replace('&','&amp;').replace('"','&quot;')
html=f'''<!doctype html><html><head><style>
 body{{margin:0}} html.smart-plant-modal-open,html.smart-plant-modal-open body {{overflow:hidden!important}}
 body.smart-plant-body-locked{{position:fixed!important;left:0;right:0;width:100%;overflow:hidden!important}}
 .smart-plant__modal{{display:none}}.smart-plant__modal.is-open{{display:block;position:fixed;z-index:5000;inset:0;background:#fff}}
 .smart-plant__dialog{{margin:120px 100px}} .smart-plant__dialog button{{padding:20px}}
 .smart-plant__card-button{{padding:16px}}[data-ags-mount],[data-formmount]{{display:block;height:650px}}
 </style></head><body>
 <div style="height:650px">Conteúdo acima</div>
 <div data-plugin="smart-plant" data-section-id="sp" data-editor-block-id="sp">
  <div class="smart-plant" data-action-mode="form" data-form-anchor="agendar" data-form-destination="auto" data-plants="{plant_attr}" data-form-context-message="Informações de {{planta}}">
    <div data-smart-plant-grid></div>
    <div class="smart-plant__modal" data-smart-plant-modal aria-hidden="true"><div class="smart-plant__dialog">
       <button data-smart-plant-close class="smart-plant__close">Fechar</button>
       <div data-smart-plant-modal-title></div><div data-smart-plant-modal-badges></div>
       <button data-smart-plant-action type="button">Quero esta planta</button><p data-smart-plant-action-status></p>
    </div></div>
  </div>
 </div>
 <div style="height:500px">Entre seções</div>
 <section id="agendar" data-plugin="agendamento-sender" data-section-id="ag">
   <div data-ags-mount data-ags-ready="true"><input name="nome" placeholder="Agendar"></div>
 </section>
 <section id="contato" data-plugin="form-sender-v4" data-section-id="v4">
   <div class="formsenderV4_mount" data-formmount><form><input name="nome" placeholder="Contato"><textarea name="msg"></textarea></form></div>
 </section>
 <script>window.imobifyMessages=[];window.addEventListener('message',e=>window.imobifyMessages.push(e.data));{bridge}</script>
 <script>document.addEventListener('imobify:smart-plant-select',e=>{{e.target.dataset.smartPlantSelected=e.detail.plantTitle}});</script>
 <script>{plugin}</script>
 </body></html>'''
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1280,390):
  page=b.new_page(viewport={'width':width,'height':780})
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=12000)
  for anchor in ('agendar','contato'):
   page.evaluate('(a)=>document.querySelector(".smart-plant").dataset.formAnchor=a',anchor)
   page.locator('[data-smart-plant-open]').first.click(timeout=10000)
   page.locator('.smart-plant__modal.is-open [data-smart-plant-action]').click(timeout=10000)
   page.wait_for_timeout(1200)
   result=page.evaluate('''(anchor)=>({
     top:document.getElementById(anchor).getBoundingClientRect().top,
     focus:document.activeElement?.getAttribute('name'),
     open:!!document.querySelector('.smart-plant__modal.is-open'),
     editorSelections:window.imobifyMessages.filter(m=>m.type==='imobify-select').length,
     selected:anchor==='agendar'?document.querySelector('[data-ags-mount]').dataset.smartPlantSelected:document.querySelector('[name=smartPlant]').value
   })''',anchor)
   assert -30<result['top']<140,(anchor,width,result)
   assert result['selected'] and result['focus']=='nome' and not result['open'] and result['editorSelections']==0,(anchor,width,result)
   results.append({'width':width,'anchor':anchor,**result})
  assert not errs,errs
  page.close()
 b.close()
print(json.dumps({'passed':len(results),'scenarios':results},ensure_ascii=False,indent=2))
