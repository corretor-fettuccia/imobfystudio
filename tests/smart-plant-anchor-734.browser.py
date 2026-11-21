"""7.3.4: reproduz #contato como ancora externa ao formulario destinatario."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json
R=Path(__file__).parent
html=(R/'fixture-732.html').read_text()
html=re.sub(r'<link\b[^>]*>', '', html, flags=re.I|re.S)
html=re.sub(r'<script\s+src=[^>]*>\s*</script>', '', html, flags=re.I|re.S)
html=html.replace('</head>', '<style>'+ (R/'fixture-732.css').read_text() +'</style></head>')
html=html.replace('</body>', '<script>'+(R/'fixture-732.js').read_text()+'</script></body>')
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 page=browser.new_page(viewport={'width':1200,'height':800})
 page.set_default_timeout(45000)
 page.set_default_navigation_timeout(55000)
 page.route('https://**', lambda route: route.abort())
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=55000)
 page.wait_for_function("document.querySelector('[data-ags-mount]')?.dataset.agsReady === 'true'")
 page.evaluate('''() => {
   // Outra secao (ex.: "Contato" customizado) e dona de #contato.
   const old = document.getElementById('contato');
   if(old)old.id='contato-original-form';
   const v4 = document.querySelector('[data-plugin="form-sender-v4"]');
   const external = document.createElement('div');
   external.id='contato';
   external.textContent='SECAO DE CONTATO EXTERNA';
   external.style.cssText='min-height:75px;padding:15px;background:#ddd;scroll-margin-top:0;';
   v4.parentNode.insertBefore(external,v4);
   const spacer=document.createElement('div');spacer.style.height='480px';
   external.after(spacer);
 }''')
 for vw in [1200,390]:
  page.set_viewport_size({'width':vw,'height':800})
  for form in ['form-sender-v4','agendamento-sender']:
   page.evaluate('''(type) => {const root=document.querySelector('.smart-plant');root.dataset.formAnchor='contato';root.dataset.formDestination=type;}''',form)
   page.locator('[data-smart-plant-open]').first.click()
   page.locator('.smart-plant__modal.is-open [data-smart-plant-action]').click()
   page.wait_for_timeout(800)
   r=page.evaluate('''(type) => ({
      scrollY:window.scrollY,
      targetTop:document.getElementById('contato').getBoundingClientRect().top,
      v4Top:document.querySelector('[data-plugin="form-sender-v4"]').getBoundingClientRect().top,
      hash:location.hash,
      modalClosed:!document.querySelector('.smart-plant__modal.is-open'),
      bodyUnlocked:!document.body.classList.contains('smart-plant-body-locked'),
      data: type==='agendamento-sender' ? document.querySelector('[data-ags-mount]').dataset.smartPlantSelected : document.querySelector('.formsenderV4_mount [name=smartPlant]')?.value
   })''',form)
   assert r['bodyUnlocked'] and r['modalClosed'],r
   assert r['hash']=='#contato',r
   assert -30 <= r['targetTop'] <= 95,r
   assert r['v4Top'] > 100,r  # prova que rola para #contato, nao para a secao do V4
   assert r['data'],r
   results.append({'vw':vw,'form':form,**r})
 assert not errors,errors
 browser.close()
print(json.dumps({'passed':len(results),'cases':results},ensure_ascii=False,indent=2))
