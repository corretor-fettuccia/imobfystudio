(function(){
  const $ = id => document.getElementById(id);
  const MAX = 400;               // lado máximo processado
  let srcCanvas = null, lastSVG = '', timer = null, fileName = 'icone';

  const presets = {
    icon:   {colors:2,  smooth:1.5, omit:12},
    logo:   {colors:4,  smooth:1.0, omit:8},
    detail: {colors:16, smooth:0.5, omit:2}
  };

  function sampleCanvas(){
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0,0,256,256);
    x.fillStyle = '#1d7a4a';
    x.beginPath(); x.roundRect ? x.roundRect(28,28,200,200,44) : x.rect(28,28,200,200); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(78,184);
    x.bezierCurveTo(70,110,120,70,186,72); x.bezierCurveTo(190,140,150,186,78,184); x.fill();
    x.strokeStyle = '#1d7a4a'; x.lineWidth = 9; x.lineCap = 'round';
    x.beginPath(); x.moveTo(84,178); x.quadraticCurveTo(124,130,166,94); x.stroke();
    return c;
  }

  function loadImage(src){
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(1, MAX / Math.max(w,h));
      w = Math.max(1, Math.round(w*s)); h = Math.max(1, Math.round(h*s));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      setSource(c);
    };
    img.onerror = () => setStatus('Não consegui abrir essa imagem. Tente PNG, JPG ou WebP.', false);
    img.src = src;
  }

  function setSource(c){
    srcCanvas = c;
    $('orig').src = c.toDataURL('image/png');
    $('dim').textContent = c.width + '×' + c.height + ' px';
    applyZoom(); schedule();
  }

  function readFile(f){
    if(!f || !f.type.startsWith('image/')) { setStatus('Esse arquivo não é uma imagem.', false); return; }
    fileName = (f.name || 'icone').replace(/\.[^.]+$/, '') || 'icone';
    const r = new FileReader(); r.onload = e => loadImage(e.target.result); r.readAsDataURL(f);
  }

  function setStatus(t, ok){ const s=$('status'); s.textContent=t; s.className='status'+(ok?' ok':''); }

  function schedule(){ clearTimeout(timer); setStatus('convertendo…'); timer = setTimeout(trace, 60); }

  function getImageData(){
    const ctx = srcCanvas.getContext('2d');
    const d = ctx.getImageData(0,0,srcCanvas.width,srcCanvas.height);
    const p = d.data, W = d.width, H = d.height;
    if($('nobg').checked){
      // preenche a partir das 4 bordas: só some o fundo conectado, não o branco de dentro do ícone
      const seen = new Uint8Array(W*H), stack = [];
      const ref = [p[0], p[1], p[2], p[3]];
      const near = i => { const k=i*4;
        if(ref[3] < 20) return p[k+3] < 20;
        const dr=p[k]-ref[0], dg=p[k+1]-ref[1], db=p[k+2]-ref[2];
        return p[k+3] > 20 && dr*dr+dg*dg+db*db < 48*48; };
      for(let x=0;x<W;x++){ stack.push(x, (H-1)*W+x); }
      for(let y=0;y<H;y++){ stack.push(y*W, y*W+W-1); }
      while(stack.length){
        const i = stack.pop();
        if(seen[i] || !near(i)) continue;
        seen[i] = 1; p[i*4+3] = 0;
        const x = i%W;
        if(x>0) stack.push(i-1); if(x<W-1) stack.push(i+1);
        if(i>=W) stack.push(i-W); if(i<W*(H-1)) stack.push(i+W);
      }
    }
    // borda nítida: cada pixel fica opaco ou transparente (evita dezenas de formas semitransparentes)
    for(let k=3;k<p.length;k+=4) p[k] = p[k] < 128 ? 0 : 255;
    return d;
  }

  function trace(){
    if(!srcCanvas) return;
    if(typeof ImageTracer === 'undefined'){ setStatus('O conversor não carregou. Recarregue a página.', false); return; }
    const mono = $('mono').checked;
    const t0 = performance.now();
    const opts = {
      numberofcolors: mono ? 2 : (+$('colors').value) + ($('nobg').checked ? 1 : 0),
      ltres: +$('smooth').value, qtres: +$('smooth').value,
      pathomit: +$('omit').value, rightangleenhance: true,
      colorsampling: 2, colorquantcycles: 3, roundcoords: 1,
      strokewidth: 1, viewbox: true, desc: false
    };
    let raw;
    try { raw = ImageTracer.imagedataToSVG(getImageData(), opts); }
    catch(e){ setStatus('Falhou ao converter. Tente menos cores.', false); return; }

    const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
    const svg = doc.documentElement;
    let paths = 0, nodes = 0;
    [...svg.querySelectorAll('path')].forEach(p => {
      const op = parseFloat(p.getAttribute('opacity') ?? '1');
      if(op < 0.5){ p.remove(); return; }
      p.removeAttribute('opacity');
      if(mono){ p.setAttribute('fill','currentColor'); p.setAttribute('stroke','currentColor'); }
      paths++; nodes += (p.getAttribute('d').match(/[MLQ]/g)||[]).length;
    });
    svg.removeAttribute('version'); svg.removeAttribute('desc');
    let out = new XMLSerializer().serializeToString(svg)
      .replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,'')
      .replace(/^<svg/,'<svg xmlns="http://www.w3.org/2000/svg"')
      .replace(/\/>\s*/g,'/>\n').replace(/>\s*<path/,'>\n<path');
    lastSVG = out;
    $('code').value = out;
    $('out').innerHTML = out;
    applyZoom();
    const kb = new Blob([out]).size / 1024;
    $('stats').innerHTML =
      `<span>tamanho <b>${kb.toFixed(1)} KB</b></span><span>formas <b>${paths}</b></span><span>pontos <b>${nodes}</b></span><span>tempo <b>${Math.round(performance.now()-t0)} ms</b></span>`;
    setStatus(kb > 30 ? 'pronto · arquivo pesado, reduza as cores' : 'pronto', kb <= 30);
  }

  function applyZoom(){
    const z = +$('zoom').value; $('o-zoom').textContent = z + '×';
    if(!srcCanvas) return;
    const w = srcCanvas.width*z, h = srcCanvas.height*z;
    $('orig').style.width = w+'px'; $('orig').style.height = h+'px';
    $('out').style.width = w+'px'; $('out').style.height = h+'px';
  }

  function syncOutputs(){
    $('o-colors').textContent = $('colors').value;
    $('o-smooth').textContent = (+$('smooth').value).toFixed(1);
    $('o-omit').textContent = $('omit').value + ' px';
    $('colors').disabled = $('mono').checked;
  }

  async function copy(text, label){
    try { await navigator.clipboard.writeText(text); $('copied').textContent = label; }
    catch(e){ $('code').focus(); $('code').select(); $('copied').textContent = 'Selecionei o código. Use Ctrl+C.'; }
    setTimeout(()=>{$('copied').textContent='';}, 2500);
  }

  $('file').addEventListener('change', e => readFile(e.target.files[0]));
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => { e.preventDefault(); readFile(e.dataTransfer.files[0]); });
  document.addEventListener('paste', e => {
    const it = [...(e.clipboardData?.items||[])].find(i => i.type.startsWith('image/'));
    if(it) readFile(it.getAsFile());
  });
  $('preset').addEventListener('change', () => {
    const p = presets[$('preset').value];
    $('colors').value = p.colors; $('smooth').value = p.smooth; $('omit').value = p.omit;
    syncOutputs(); schedule();
  });
  ['colors','smooth','omit','nobg','mono'].forEach(id => $(id).addEventListener('input', () => { syncOutputs(); schedule(); }));
  $('zoom').addEventListener('input', applyZoom);
  $('applyProject').addEventListener('click', () => {
    if (!lastSVG || window.parent === window) return;
    const blob = new Blob([lastSVG], {type:'image/svg+xml'});
    const reader = new FileReader();
    reader.onload = () => window.parent.postMessage({type:'imobify-seo-svg', data:reader.result, bytes:blob.size}, window.location.origin);
    reader.readAsDataURL(blob);
  });
  $('download').addEventListener('click', () => {
    if(!lastSVG) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lastSVG], {type:'image/svg+xml'}));
    a.download = (fileName || 'icone') + '.svg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('copy').addEventListener('click', () => lastSVG && copy(lastSVG, 'SVG copiado.'));
  $('copyImg').addEventListener('click', () => lastSVG && copy(
    '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(lastSVG) + '" alt="ícone" width="24" height="24">', 'Tag <img> copiada.'));

  syncOutputs();
  setSource(sampleCanvas());
})();
