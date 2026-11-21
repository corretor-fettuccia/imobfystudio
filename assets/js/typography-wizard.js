(function(){
  'use strict';
  const api=window.ImobifyTypeSystem;
  if(!api)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const labels={family:'Fonte',size:'Tamanho desktop (px)',tablet:'Tamanho tablet (px)',mobile:'Tamanho mobile (px)',weight:'Peso',line:'Entrelinha',tracking:'Tracking (em)',color:'Cor',customColor:'Cor personalizada',transform:'Caixa'};
  let dialog=null,draft=null,active='headline',step=0,device='desktop',originalFocus=null,brand=null,applyCallback=null;
  const get=(sel)=>dialog?.querySelector(sel);
  const all=(sel)=>[...(dialog?.querySelectorAll(sel)||[])];
  const options=(arr,selected)=>arr.map(([value,text])=>`<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(text)}</option>`).join('');
  function roleControls(){
    const d=draft[active];
    return `<div class="ib-tw-roles" role="tablist" aria-label="Papéis tipográficos">${api.ROLES.map(role=>`<button type="button" class="ib-tw-role ${active===role?'is-active':''}" data-tw-role="${role}" role="tab" aria-selected="${active===role}">${esc(api.LABELS[role].split(' · ')[0])}</button>`).join('')}</div>
      <h3>${esc(api.LABELS[active])}</h3><p class="ib-tw-hint">As alterações deste papel alcançam os componentes compatíveis. Ajustes locais continuam disponíveis.</p>
      <div class="ib-tw-fields">
      <label>Fonte<select data-tw-field="family">${options([['heading','Fonte global de títulos'],['body','Fonte global de texto'],...api.FONT_OPTIONS.map(x=>[x,x])],d.family)}</select></label>
      <div class="ib-tw-three"><label>Desktop ≥1440px<input type="number" min="10" max="160" data-tw-field="size" value="${d.size}"></label><label>Tablet 720px<input type="number" min="10" max="120" data-tw-field="tablet" value="${d.tablet}"></label><label>Mobile ≤320px<input type="number" min="10" max="90" data-tw-field="mobile" value="${d.mobile}"></label></div><p class="ib-tw-hint">Entre os três pontos, o tamanho varia suavemente com a largura da tela.</p>
      <div class="ib-tw-two"><label>Peso<input type="number" min="300" max="900" step="50" data-tw-field="weight" value="${d.weight}"></label><label>Entrelinha<input type="number" min=".9" max="2.2" step=".05" data-tw-field="line" value="${d.line}"></label></div>
      <div class="ib-tw-two"><label>Tracking (em)<input type="number" min="-.1" max=".3" step=".005" data-tw-field="tracking" value="${d.tracking}"></label><label>Caixa<select data-tw-field="transform">${options([['none','Original'],['uppercase','Maiúsculas'],['lowercase','Minúsculas']],d.transform)}</select></label></div>
      <div class="ib-tw-two"><label>Cor<select data-tw-field="color">${options([['inherit','Herdar do plugin'],['heading','Títulos da marca'],['body','Texto da marca'],['primary','Cor principal'],['accent','Cor de destaque'],['custom','Personalizada']],d.color)}</select></label><label>Cor personalizada<input type="color" data-tw-field="customColor" value="${esc(d.customColor)}" ${d.color==='custom'?'':'disabled'}></label></div>
      </div>`;
  }
  function profileControls(){
    const kits=window.ImobifyCatalog?.buttonKits||{};
    return `<h3>Escolha um ponto de partida</h3><p class="ib-tw-hint">Os presets são referências, não limitam a personalização. Escolha uma direção e refine os cinco papéis na próxima etapa.</p><div class="ib-tw-presets">${Object.entries(api.PRESETS).map(([key,p])=>`<button type="button" data-tw-preset="${key}"><strong>${esc(p.name)}</strong><span>${esc(p.description)}</span></button>`).join('')}</div>
    <h3>Identidade visual</h3><p class="ib-tw-hint">Cores globais e CTA. As escolhas só serão gravadas ao confirmar a última etapa.</p>
    <div class="ib-tw-fields"><div class="ib-tw-two">
    <label>Cor principal<input type="color" data-tw-brand="primary" value="${esc(brand.primary||'#2259a8')}"></label>
    <label>Cor de destaque<input type="color" data-tw-brand="accent" value="${esc(brand.accent||'#d7ff3f')}"></label>
    <label>Fundo do CTA<input type="color" data-tw-brand="actionButtonBackground" value="${esc(brand.actionButtonBackground||'#2259a8')}"></label>
    <label>Texto do CTA<input type="color" data-tw-brand="actionButtonText" value="${esc(brand.actionButtonText||'#ffffff')}"></label>
    </div><label>Acabamento de botão<select data-tw-brand="actionButtonKit">${options([['custom','Manter configuração atual'],...Object.entries(kits).map(([id,k])=>[id,k.name])],brand.actionButtonKit||'custom')}</select></label>
    <p class="ib-tw-hint" id="ib-tw-contrast-note" role="status" aria-live="polite"></p></div>`;
  }
  function reviewControls(){return `<h3>Revisão da hierarquia</h3><p class="ib-tw-hint">Confira a escala tipográfica, o contraste e o equilíbrio entre as chamadas. O editor e o HTML exportado utilizarão os mesmos tokens.</p><div class="ib-tw-review">${api.ROLES.map(x=>`<div><strong>${esc(api.LABELS[x])}</strong><span>${draft[x].size}px desktop · ${draft[x].tablet}px tablet · ${draft[x].mobile}px mobile · peso ${draft[x].weight}</span></div>`).join('')}</div><p class="ib-tw-hint">Observação: os plugins com tipografia interna explícita podem usar a opção “Preservar estilo próprio” no inspetor. O Wizard não altera o conteúdo nem os links de CTA.</p>`;}
  function fontValue(name){return name==='heading'?(brand.headingFont||'Manrope'):name==='body'?(brand.bodyFont||'Inter'):name;}
  function updatePreview(){
    if(!dialog)return;
    const preview=get('.ib-tw-preview');if(!preview)return;
    const cta=get('[data-tw-sample="cta"]');if(cta){cta.style.background=brand.actionButtonBackground||brand.primary||'#1a3655';cta.style.color=brand.actionButtonText||'#ffffff';} 
    preview.dataset.device=device;
    for(const role of api.ROLES){const el=get(`[data-tw-sample="${role}"]`);if(!el)continue;
      const v=draft[role];el.style.fontFamily='"'+fontValue(v.family).replace(/["<>;\\]/g,'')+'",system-ui,sans-serif';
      el.style.fontSize=(device==='mobile'?v.mobile:device==='tablet'?v.tablet:v.size)+'px';el.style.fontWeight=v.weight;el.style.lineHeight=v.line;el.style.letterSpacing=v.tracking+'em';el.style.textTransform=v.transform;
      el.style.color=v.color==='custom'?v.customColor:v.color==='primary'?brand.primary:v.color==='accent'?brand.accent:v.color==='heading'?brand.headingColor:v.color==='body'?brand.bodyColor:'';
      if(!['heading','body'].includes(v.family))loadFont(v.family);
    }
    const note=get('#ib-tw-contrast-note');if(note){ const c=contrast(brand.actionButtonBackground,brand.actionButtonText);note.textContent=Number.isFinite(c)?(c>=4.5?'✓ Contraste do CTA: '+c.toFixed(2)+':1 · adequado para texto comum.':'⚠ Contraste do CTA: '+c.toFixed(2)+':1. Recomendado ≥ 4,5:1.'):''; }
    all('[data-tw-device]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.twDevice===device)));
  }
  function contrast(a,b){
    const lum=x=>{if(!/^#[0-9a-f]{6}$/i.test(x||''))return NaN;const c=[1,3,5].map(n=>parseInt(x.slice(n,n+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
    const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  const loaded=new Set();
  function loadFont(name){if(!api.FONT_OPTIONS.includes(name)||loaded.has(name))return;loaded.add(name);const link=document.createElement('link');link.rel='stylesheet';link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(name).replace(/%20/g,'+')+':wght@300;400;500;600;700;800;900&display=swap';document.head.append(link);}
  function render(){
    if(!dialog)return;
    get('.ib-tw-step-content').innerHTML=step===0?profileControls():step===1?roleControls():reviewControls();
    all('[data-tw-step]').forEach(el=>{el.classList.toggle('is-active',Number(el.dataset.twStep)===step);el.setAttribute('aria-current',Number(el.dataset.twStep)===step?'step':'false');});
    get('[data-tw-prev]').disabled=step===0;
    get('[data-tw-next]').textContent=step===2?'Aplicar ao projeto':'Continuar →';
    updatePreview();
  }
  function onClick(e){
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.matches('[data-tw-close]'))return close();
    if(btn.dataset.twDevice){device=btn.dataset.twDevice;updatePreview();return;}
    if(btn.dataset.twRole){active=btn.dataset.twRole;render();return;}
    if(btn.dataset.twStep!==undefined){step=Number(btn.dataset.twStep);render();return;}
    if(btn.dataset.twPreset){draft=api.rolePreset(btn.dataset.twPreset);step=1;render();return;}
    if(btn.matches('[data-tw-prev]')){step=Math.max(0,step-1);render();return;}
    if(btn.matches('[data-tw-reset]')){draft=api.normalize();render();return;}
    if(btn.matches('[data-tw-next]')){if(step<2){step++;render();return;}const cb=applyCallback;const copy=api.normalize(draft);const style={primary:brand.primary,accent:brand.accent,actionButtonBackground:brand.actionButtonBackground,actionButtonText:brand.actionButtonText,actionButtonKit:brand.actionButtonKit};close();cb?.(copy,style);}
  }
  function onInput(e){
    const brandInput=e.target.closest('[data-tw-brand]');if(brandInput){brand[brandInput.dataset.twBrand]=brandInput.value;updatePreview();return;}
    const el=e.target.closest('[data-tw-field]');if(!el)return;
    let value=['size','tablet','mobile','weight','line','tracking'].includes(el.dataset.twField)?Number(el.value):el.value;
    draft[active][el.dataset.twField]=value;
    if(el.dataset.twField==='color')get('[data-tw-field="customColor"]').disabled=value!=='custom';
    updatePreview();
  }
  function close(){if(!dialog)return;dialog.close();dialog.remove();dialog=null;originalFocus?.focus?.();}
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab'||!dialog)return;const focusable=all('button:not([disabled]),input:not([disabled]),select:not([disabled])').filter(x=>x.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}
  function open(currentBrand,onApply){
    close();originalFocus=document.activeElement;brand={...(currentBrand||{})};applyCallback=onApply;draft=api.normalize(brand.typographyRoles);active='headline';step=0;device='desktop';
    dialog=document.createElement('dialog');dialog.id='ib-typography-wizard';dialog.className='ib-tw-dialog';
    dialog.innerHTML=`<div class="ib-tw-shell" role="document"><header class="ib-tw-header"><div><small>IMOBIFY DESIGN ENGINEERING</small><h2>Wizard de Tipografia e Estilo</h2><p>Eyebrow · Headline · Subheadline · Body Text · CTA</p></div><button type="button" class="ib-tw-close" data-tw-close aria-label="Fechar sem aplicar">✕</button></header><nav class="ib-tw-steps" aria-label="Etapas">${[['Direção visual'],['Cinco papéis'],['Revisão']].map(([name],i)=>`<button type="button" data-tw-step="${i}"><span>${i+1}</span>${name}</button>`).join('')}</nav><div class="ib-tw-content"><div class="ib-tw-left"><div class="ib-tw-step-content"></div></div><div class="ib-tw-right"><div class="ib-tw-preview-head"><strong>Prévia ao vivo</strong><div class="ib-tw-devices"><button type="button" data-tw-device="desktop" aria-pressed="true">Desktop</button><button type="button" data-tw-device="tablet" aria-pressed="false">Tablet</button><button type="button" data-tw-device="mobile" aria-pressed="false">Mobile</button></div></div><div class="ib-tw-preview"><article><span data-tw-sample="eyebrow">UM NOVO JEITO DE VIVER</span><h1 data-tw-sample="headline">Um endereço que inspira.</h1><h2 data-tw-sample="subheadline">Arquitetura e liberdade para criar a vida que você deseja.</h2><p data-tw-sample="body">Conheça um espaço pensado para você, com localização, conforto e possibilidades que valorizam cada escolha.</p><a href="#" tabindex="-1" data-tw-sample="cta">Quero conhecer a oportunidade →</a></article></div><p class="ib-tw-preview-note">Simulação de hierarquia. Cores de fundo e estilos locais podem variar conforme o plugin.</p></div></div><footer class="ib-tw-footer"><button type="button" data-tw-reset>Restaurar escala</button><span class="ib-tw-grow"></span><button type="button" data-tw-prev>← Voltar</button><button type="button" class="ib-tw-apply" data-tw-next>Continuar →</button></footer></div>`;
    document.body.append(dialog);dialog.addEventListener('click',onClick);dialog.addEventListener('input',onInput);dialog.addEventListener('change',onInput);dialog.addEventListener('keydown',onKey);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.showModal();render();get('[data-tw-close]').focus();
  }
  window.ImobifyTypeWizard={open};
})();
