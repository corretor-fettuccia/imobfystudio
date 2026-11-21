"""Regressão real do clique Smart Plant -> âncora V4 ou Agendamento (Chromium).
Pré-requisito: node tests/generate-732-fixture.cjs
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json
R = Path(__file__).parent
html = (R / 'fixture-732.html').read_text()
css = (R / 'fixture-732.css').read_text()
js = (R / 'fixture-732.js').read_text()
# Fixture autocontida para não depender da rede nem dos arquivos compilados em outra pasta.
html = re.sub(r'<link\b[^>]*>', '', html, flags=re.I | re.S)
html = re.sub(r'<script\s+src=[^>]*>\s*</script>', '', html, flags=re.I | re.S)
html = re.sub(r'<meta\s+http-equiv="Content-Security-Policy"[^>]*>', '', html)
html = html.replace('</head>', '<style>' + css + '</style></head>')
html = html.replace('</body>', '<script>' + js + '</script></body>')
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
    page = browser.new_page(viewport={'width':1280, 'height':780})
    errors = []
    page.set_default_timeout(45000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(html, wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('[data-ags-mount]')?.dataset.agsReady === 'true'")
    assert page.locator('[data-smart-plant-open]').count() == 2
    for viewport in [{'width': 1280, 'height': 780}, {'width': 390, 'height': 780}]:
        print('viewport',viewport,flush=True)
        page.set_viewport_size(viewport)
        for anchor in ['agendar', 'contato']:
            print('case',anchor,flush=True)
            page.evaluate('''(anchor) => {
               const plant=document.querySelector('.smart-plant');
               plant.dataset.formAnchor=anchor;
               plant.dataset.formDestination='auto';
            }''', anchor)
            page.locator('[data-smart-plant-open]').first.click()
            page.locator('.smart-plant__modal.is-open [data-smart-plant-action]').click()
            # A navegação deve acontecer imediatamente após fechar, não depois de 0.5-1s.
            page.wait_for_timeout(1300)
            check = page.evaluate('''(anchor) => {
              const target=document.getElementById(anchor);
              return {
                anchor, scrollY:window.scrollY,
                targetTop:target?.getBoundingClientRect().top,
                modalClosed:!document.querySelector('.smart-plant__modal.is-open'),
                unlocked:!document.body.classList.contains('smart-plant-body-locked'),
                focus:document.activeElement?.getAttribute('name'),
                selected: anchor==='agendar'
                   ? document.querySelector('[data-ags-mount]').dataset.smartPlantSelected
                   : document.querySelector('.formsenderV4_mount [name=smartPlant]')?.value
              };
            }''', anchor)
            assert check['modalClosed'] and check['unlocked'], check
            assert check['scrollY'] > 100, check
            assert -35 <= check['targetTop'] <= 125, check
            assert check['focus'] == 'nome', check
            assert check['selected'], check
            results.append({'viewport': viewport['width'], **check})
        # Fechamento simples do modal não aciona navegação para formulário.
        print('normal close',flush=True)
        page.locator('[data-smart-plant-open]').first.click()
        before = page.evaluate("Number(document.querySelector('.smart-plant').closest('[data-section-id]').getBoundingClientRect().top)")
        page.locator('.smart-plant__modal.is-open [data-smart-plant-close].smart-plant__close').click()
        page.wait_for_timeout(900)
        after = page.evaluate("Number(document.querySelector('.smart-plant').closest('[data-section-id]').getBoundingClientRect().top)")
        assert abs(before - after) < 25, (before, after)
        assert not errors, errors
    page.close()
    browser.close()
print(json.dumps({'pass': len(results), 'cases': results}, ensure_ascii=False, indent=2))
