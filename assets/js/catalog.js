(function () {
  const esc = window.ImobifyUtil.escapeHtml;
  const lines = (value = '') => String(value).split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const field = (key, label, type = 'text', group = 'Conteúdo', options = []) => ({ key, label, type, group, options });
  const clampNumber = (value, fallback, min, max) => { const n = Number(value); return Math.max(min, Math.min(max, Number.isFinite(n) ? n : fallback)); };
  // Destaques: conserva o formato "titulo|descricao" dos projetos existentes,
  // incluindo descricoes que contenham o caractere |.
  const highlightItems = (value) => lines(value).map((row) => {
    const boundary = row.indexOf('|');
    return boundary < 0
      ? { title:row.trim(), copy:'' }
      : { title:row.slice(0,boundary).trim(), copy:row.slice(boundary+1).trim() };
  }).filter((item) => item.title || item.copy).slice(0,24);
  const highlightLink = (value) => {
    const href = String(value || '').trim();
    return /^(?:https?:\/\/|mailto:|tel:)/i.test(href) || /^#[A-Za-z][\w:.-]*$/.test(href) || /^\/(?!\/)[^\s]*$/.test(href) ? href : '#contato';
  };
  const heroPlusFont = (value, fallbackVar) => { const fonts = { 'Manrope':'system-ui,sans-serif', 'Inter':'system-ui,sans-serif', 'DM Sans':'system-ui,sans-serif', 'Montserrat':'system-ui,sans-serif', 'Poppins':'system-ui,sans-serif', 'Playfair Display':'serif', 'Bodoni Moda':'serif', 'Roboto Serif':'serif' }; const name = String(value || 'preset').trim(); return fonts[name] ? `'${name.replace(/'/g,'')}',${fonts[name]}` : `var(${fallbackVar})`; };
  const heroPlusColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim() : fallback;
  const heroPlusHref = (value, fallback = '#') => { const raw = String(value || '').trim(); return /^#[A-Za-z][\w:.-]*$/.test(raw) || /^(?:https?:|mailto:|tel:)/i.test(raw) || /^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw) ? raw : fallback; };

  const footerSocialChannels = [
    { key:'facebookUrl', label:'Facebook', icon:'fa-brands fa-facebook-f' },
    { key:'whatsappUrl', label:'WhatsApp', icon:'fa-brands fa-whatsapp' },
    { key:'instagramUrl', label:'Instagram', icon:'fa-brands fa-instagram' },
    { key:'tiktokUrl', label:'TikTok', icon:'fa-brands fa-tiktok' },
    { key:'youtubeUrl', label:'YouTube', icon:'fa-brands fa-youtube' },
    { key:'googleBusinessUrl', label:'Google Meu Negócio', icon:'fa-brands fa-google' },
    { key:'linkedinUrl', label:'LinkedIn', icon:'fa-brands fa-linkedin-in' }
  ];

  function safeFooterExternalUrl(value) {
    const raw = String(value || '').trim();
    if (!/^https?:\/\//i.test(raw)) return '';
    try {
      const parsed = new URL(raw);
      return ['http:','https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (_) {
      return '';
    }
  }

  function safeFooterIconUrl(value) {
    const raw = String(value || '').trim();
    if (/^data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp);/i.test(raw)) return raw;
    if (/^(?:\.\.?\/|\/)?assets\/[A-Za-z0-9_./-]+(?:\?[A-Za-z0-9_.~!$&'()*+,;=:@%/?-]*)?$/i.test(raw)) return raw;
    return safeFooterExternalUrl(raw);
  }

  function footerSocialMarkup(props = {}) {
    const openNewTab = props.socialOpenNewTab !== false;
    const linkAttrs = openNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const itemMarkup = ({ label, href, icon, iconUrl }) => {
      if (!label || !href) return '';
      const iconMarkup = iconUrl
        ? `<img src="${esc(iconUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
        : `<i class="${esc(icon || 'fa-solid fa-link')}" aria-hidden="true"></i>`;
      return `<a class="footer-social-link" href="${esc(href)}"${linkAttrs} aria-label="${esc(label)}" title="${esc(label)}"><span class="footer-social-icon" aria-hidden="true">${iconMarkup}</span><span class="footer-social-name">${esc(label)}</span></a>`;
    };
    const nativeItems = footerSocialChannels.map((channel) => itemMarkup({
      label:channel.label,
      href:safeFooterExternalUrl(props[channel.key]),
      icon:channel.icon
    })).filter(Boolean);
    const customItems = lines(props.additionalSocials).map((entry) => {
      const parts = entry.split('|');
      const label = String(parts.shift() || '').trim();
      const iconUrl = safeFooterIconUrl(parts.shift());
      const href = safeFooterExternalUrl(parts.join('|'));
      return itemMarkup({ label, href, iconUrl, icon:'fa-solid fa-link' });
    }).filter(Boolean);
    const items = [...nativeItems, ...customItems];
    if (!items.length) return '';
    const style = ['solid','outline','minimal'].includes(props.socialStyle) ? props.socialStyle : 'outline';
    const labels = props.socialLabels === 'show' ? 'show' : 'icons';
    const iconSize = Math.max(32, Math.min(64, Number(props.socialIconSize) || 44));
    const heading = String(props.socialHeading || '').trim();
    return `<div class="footer-socials" data-style="${style}" data-labels="${labels}" style="--footer-social-size:${iconSize}px">${heading ? `<p class="footer-social-heading">${esc(heading)}</p>` : ''}<nav class="footer-social-list" aria-label="Canais sociais">${items.join('')}</nav></div>`;
  }

  const plugins = {
    hero: {
      name: 'Hero imobiliário', icon: '◆', category: 'Conversão', description: 'Primeira dobra com promessa e CTA', kind: 'section',
      cssPath: 'plugins/hero/plugin.css', jsPath: 'plugins/hero/plugin.js', manifestPath: 'plugins/hero/plugin.json',
      defaults: { eyebrow: 'LANÇAMENTO EM CANOAS', title: 'Seu próximo capítulo começa em um lugar feito para viver bem.', subtitle: 'Apartamentos de 2 e 3 dormitórios com varanda, lazer completo e localização que valoriza seu tempo.', primaryCta: 'Quero conhecer', secondaryCta: 'Ver condições', image: 'assets/images/hero-placeholder.jpg', imageAlt: 'Fachada do Residencial Aurora em Canoas', badge: 'Últimas unidades da fase 1', anchor: '#contato', showScroll: true },
      fields: [field('eyebrow','Chamada superior'), field('title','Título principal','textarea'), field('subtitle','Texto de apoio','textarea'), field('primaryCta','CTA principal'), field('secondaryCta','CTA secundário'), field('anchor','Destino do CTA'), field('badge','Selo comercial'), field('image','Imagem principal','image','Imagem'), field('imageAlt','Texto alternativo da imagem','text','Imagem'), field('showScroll','Indicador de rolagem','toggle','Exibição')],
      render: (p, s, id) => `<section class="hero-section section-shell" data-section-id="${id}" data-plugin="hero"><img class="hero-media" src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title || 'Imagem do empreendimento')}" loading="eager" fetchpriority="high" decoding="async"><div class="hero-shade"></div><div class="site-container hero-content"><p class="eyebrow">${esc(p.eyebrow)}</p><h1>${esc(p.title)}</h1><p class="hero-copy">${esc(p.subtitle)}</p><div class="hero-actions"><a class="button button-primary" href="${esc(p.anchor)}">${esc(p.primaryCta)}</a><a class="button button-ghost" href="#galeria">${esc(p.secondaryCta)}</a></div><span class="hero-badge">${esc(p.badge)}</span></div>${p.showScroll ? '<a class="scroll-cue" href="#destaques"><span></span>Explore o projeto</a>' : ''}</section>`
    },
    'hero-plus': {
      name: 'Hero Imobiliário Plus', icon: '✦', category: 'Conversão', description: 'Hero cinematográfico com slides, movimento, partículas e tipografia avançada', kind: 'section',
      cssPath: 'plugins/hero-plus/plugin.css', jsPath: 'plugins/hero-plus/plugin.js', manifestPath: 'plugins/hero-plus/plugin.json',
      manifest: { id:'hero-plus', name:'Hero Imobiliário Plus', version:'1.1.0', type:'section', advancedInspector:{ enabled:true, label:'Abrir Studio Hero Plus', description:'Tipografia, movimento, perspectiva, partículas, iluminação e animações avançadas.' } },
      defaults: {
        eyebrow:'IMÓVEL EM DESTAQUE', title:'Uma primeira impressão que faz o imóvel parecer único.', subtitle:'Combine arquitetura, localização e desejo em uma abertura cinematográfica feita para prender atenção sem perder elegância.',
        primaryCta:'Quero conhecer', primaryLink:'#contato', secondaryCta:'Ver detalhes', secondaryLink:'#destaques', badge:'Apresentação exclusiva',
        exploreText:'Explore o projeto', exploreLink:'#destaques', showExplore:true,
        ribbonText:'ARQUITETURA · LOCALIZAÇÃO · EXPERIÊNCIA', ribbonAlign:'left', ribbonWidth:'fit',
        image1:'assets/images/hero-placeholder.jpg', image2:'', image3:'', image4:'', imageAlt:'Imagem principal do empreendimento',
        slideAutoplay:true, slideTransition:'crossfade', slideDuration:6500, transitionDuration:1400,
        contentAlign:'left', verticalAlign:'center', contentMaxWidth:820, contentOffsetX:0, contentOffsetY:0,
        bgMotion:'pan-left', motionDuration:20, motionIntensity:24, bgScale:108, imagePositionX:50, imagePositionY:50, bgBlur:0,
        overlayOpacity:56, vignette:38, pointerLight:true, pointerLightStrength:18,
        particlesEnabled:false, particleStyle:'dust', particleDensity:38, particleSpeed:22, particleSize:1.6, particleOpacity:30, particleMagnetic:true, magneticStrength:42,
        typographyPreset:'contemporary', titleFont:'preset', titleSize:92, titleWeight:800, titleLineHeight:.96, titleLetterSpacing:-.045, titleTransform:'none', titleColor:'#ffffff', titleShadow:25,
        subtitleFont:'preset', subtitleSize:20, subtitleWeight:450, subtitleLineHeight:1.55, subtitleLetterSpacing:0, subtitleColor:'#e7ebef',
        ribbonFont:'preset', ribbonSize:11.5, ribbonWeight:800, ribbonLetterSpacing:.13, ribbonColor:'#ffffff',
        eyebrowAnimation:'reveal-up', titleAnimation:'words-rise', subtitleAnimation:'blur-in', ribbonAnimation:'mask-slide', textDuration:850, textDelay:80, textStagger:35,
        magneticCta:true, ctaEffect:'shine'
      },
      fields: [
        field('eyebrow','Chamada superior','text','Conteúdo'), field('title','Título principal','textarea','Conteúdo'), field('subtitle','Texto de apoio','textarea','Conteúdo'),
        field('ribbonText','Texto do ribbon','text','Ribbon'), field('ribbonAlign','Alinhamento do ribbon','select','Ribbon',[{value:'left',label:'Esquerda'},{value:'center',label:'Centro'},{value:'right',label:'Direita'},{value:'justify',label:'Justificado'}]), field('ribbonWidth','Largura do ribbon','select','Ribbon',[{value:'fit',label:'Ajustado ao texto'},{value:'full',label:'Largura total'}]),
        field('primaryCta','CTA principal','text','Ações'), field('primaryLink','Link do CTA principal','text','Ações'), field('secondaryCta','CTA secundário','text','Ações'), field('secondaryLink','Link do CTA secundário','text','Ações'), field('badge','Selo comercial','text','Ações'),
        field('exploreText','Texto de “Explore”','text','Explore'), field('exploreLink','Hiperlink de “Explore”','text','Explore'), field('showExplore','Exibir chamada Explore','toggle','Explore'),
        field('image1','Imagem principal','image','Fundo'), field('image2','Slide 2','image','Fundo'), field('image3','Slide 3','image','Fundo'), field('image4','Slide 4','image','Fundo'), field('imageAlt','Texto alternativo','text','Fundo'),
        field('slideAutoplay','Troca automática dos slides','toggle','Fundo'),
        {...field('slideTransition','Transição entre slides','select','Fundo',[{value:'crossfade',label:'Crossfade'},{value:'horizontal',label:'Movimento horizontal'},{value:'vertical',label:'Movimento vertical'},{value:'zoom-fade',label:'Zoom + fade'},{value:'perspective',label:'Perspectiva'}]), panel:'advanced'},
        {...field('slideDuration','Tempo por slide (ms)','number','Slides'), panel:'advanced', min:1800, max:20000, step:100}, {...field('transitionDuration','Duração da transição (ms)','number','Slides'), panel:'advanced', min:200, max:4000, step:50},
        {...field('contentAlign','Alinhamento do conteúdo','select','Composição',[{value:'left',label:'Esquerda'},{value:'center',label:'Centro'},{value:'right',label:'Direita'}]), panel:'advanced'}, {...field('verticalAlign','Posição vertical','select','Composição',[{value:'top',label:'Superior'},{value:'center',label:'Centro'},{value:'bottom',label:'Inferior'}]), panel:'advanced'},
        {...field('contentMaxWidth','Largura máxima do texto (px)','number','Composição'), panel:'advanced', min:420, max:1400, step:10}, {...field('contentOffsetX','Deslocamento X (px)','number','Composição'), panel:'advanced', min:-320, max:320, step:2}, {...field('contentOffsetY','Deslocamento Y (px)','number','Composição'), panel:'advanced', min:-240, max:240, step:2},
        {...field('bgMotion','Movimento da imagem','select','Movimento',[{value:'none',label:'Sem movimento'},{value:'pan-left',label:'Panorâmica → esquerda'},{value:'pan-right',label:'Panorâmica → direita'},{value:'zoom',label:'Zoom lento'},{value:'ken-burns',label:'Ken Burns'},{value:'perspective',label:'Perspectiva suave'},{value:'drift',label:'Drift cinematográfico'}]), panel:'advanced'},
        {...field('motionDuration','Duração do movimento (s)','number','Movimento'), panel:'advanced', min:4, max:60, step:1}, {...field('motionIntensity','Intensidade do movimento','range','Movimento'), panel:'advanced', min:0, max:100, step:1}, {...field('bgScale','Escala máxima (%)','range','Movimento'), panel:'advanced', min:101, max:125, step:1},
        {...field('imagePositionX','Posição da imagem X (%)','range','Movimento'), panel:'advanced', min:0, max:100, step:1}, {...field('imagePositionY','Posição da imagem Y (%)','range','Movimento'), panel:'advanced', min:0, max:100, step:1}, {...field('bgBlur','Desfoque do fundo (px)','range','Movimento'), panel:'advanced', min:0, max:10, step:.5},
        {...field('overlayOpacity','Escurecimento (%)','range','Iluminação'), panel:'advanced', min:0, max:90, step:1}, {...field('vignette','Vinheta (%)','range','Iluminação'), panel:'advanced', min:0, max:80, step:1}, {...field('pointerLight','Luz que acompanha o cursor','toggle','Iluminação'), panel:'advanced'}, {...field('pointerLightStrength','Intensidade da luz','range','Iluminação'), panel:'advanced', min:0, max:65, step:1},
        {...field('particlesEnabled','Ativar partículas','toggle','Partículas'), panel:'advanced'}, {...field('particleStyle','Estilo','select','Partículas',[{value:'dust',label:'Poeira luminosa'},{value:'bokeh',label:'Bokeh'},{value:'spark',label:'Faíscas'},{value:'lines',label:'Traços'}]), panel:'advanced'}, {...field('particleDensity','Quantidade','range','Partículas'), panel:'advanced', min:8, max:110, step:1}, {...field('particleSpeed','Velocidade','range','Partículas'), panel:'advanced', min:1, max:100, step:1}, {...field('particleSize','Tamanho','range','Partículas'), panel:'advanced', min:.4, max:4, step:.1}, {...field('particleOpacity','Opacidade (%)','range','Partículas'), panel:'advanced', min:4, max:80, step:1}, {...field('particleMagnetic','Partículas magnéticas ao cursor','toggle','Partículas'), panel:'advanced'}, {...field('magneticStrength','Força magnética','range','Partículas'), panel:'advanced', min:0, max:100, step:1},
        {...field('typographyPreset','Preset tipográfico','select','Tipografia',[{value:'popular',label:'Popular premium'},{value:'contemporary',label:'Classe média contemporânea'},{value:'luxury',label:'Alto padrão / Luxury'},{value:'editorial',label:'Editorial magnético'},{value:'architectural',label:'Arquitetônico'}]), panel:'advanced'},
        {...field('titleFont','Fonte do título','select','Título',[{value:'preset',label:'Seguir preset'},{value:'Manrope',label:'Manrope'},{value:'Inter',label:'Inter'},{value:'DM Sans',label:'DM Sans'},{value:'Montserrat',label:'Montserrat'},{value:'Poppins',label:'Poppins'},{value:'Playfair Display',label:'Playfair Display'},{value:'Bodoni Moda',label:'Bodoni Moda'},{value:'Roboto Serif',label:'Roboto Serif'}]), panel:'advanced'}, {...field('titleSize','Tamanho (px)','number','Título'), panel:'advanced', min:42, max:180, step:1}, {...field('titleWeight','Peso','number','Título'), panel:'advanced', min:300, max:900, step:50}, {...field('titleLineHeight','Altura de linha','number','Título'), panel:'advanced', min:.75, max:1.5, step:.01}, {...field('titleLetterSpacing','Tracking (em)','number','Título'), panel:'advanced', min:-.12, max:.18, step:.005}, {...field('titleTransform','Transformação','select','Título',[{value:'none',label:'Normal'},{value:'uppercase',label:'CAIXA ALTA'},{value:'lowercase',label:'minúsculas'}]), panel:'advanced'}, {...field('titleColor','Cor','color','Título'), panel:'advanced'}, {...field('titleShadow','Sombra (%)','range','Título'), panel:'advanced', min:0, max:80, step:1},
        {...field('subtitleFont','Fonte do apoio','select','Texto de apoio',[{value:'preset',label:'Seguir preset'},{value:'Manrope',label:'Manrope'},{value:'Inter',label:'Inter'},{value:'DM Sans',label:'DM Sans'},{value:'Montserrat',label:'Montserrat'},{value:'Poppins',label:'Poppins'},{value:'Playfair Display',label:'Playfair Display'}]), panel:'advanced'}, {...field('subtitleSize','Tamanho (px)','number','Texto de apoio'), panel:'advanced', min:12, max:42, step:1}, {...field('subtitleWeight','Peso','number','Texto de apoio'), panel:'advanced', min:300, max:900, step:50}, {...field('subtitleLineHeight','Altura de linha','number','Texto de apoio'), panel:'advanced', min:1, max:2.2, step:.05}, {...field('subtitleLetterSpacing','Tracking (em)','number','Texto de apoio'), panel:'advanced', min:-.05, max:.16, step:.005}, {...field('subtitleColor','Cor','color','Texto de apoio'), panel:'advanced'},
        {...field('ribbonFont','Fonte do ribbon','select','Ribbon avançado',[{value:'preset',label:'Seguir preset'},{value:'Manrope',label:'Manrope'},{value:'Inter',label:'Inter'},{value:'DM Sans',label:'DM Sans'},{value:'Montserrat',label:'Montserrat'}]), panel:'advanced'}, {...field('ribbonSize','Tamanho (px)','number','Ribbon avançado'), panel:'advanced', min:8, max:24, step:.5}, {...field('ribbonWeight','Peso','number','Ribbon avançado'), panel:'advanced', min:300, max:900, step:50}, {...field('ribbonLetterSpacing','Tracking (em)','number','Ribbon avançado'), panel:'advanced', min:0, max:.4, step:.01}, {...field('ribbonColor','Cor','color','Ribbon avançado'), panel:'advanced'},
        {...field('eyebrowAnimation','Animação da chamada','select','Animação de texto',[{value:'none',label:'Nenhuma'},{value:'reveal-up',label:'Reveal up'},{value:'blur-in',label:'Blur in'},{value:'mask-slide',label:'Mask slide'},{value:'tracking-in',label:'Tracking in'},{value:'glow-in',label:'Glow in'}]), panel:'advanced'}, {...field('titleAnimation','Animação do título','select','Animação de texto',[{value:'none',label:'Nenhuma'},{value:'words-rise',label:'Palavras em sequência'},{value:'chars-wave',label:'Caracteres em onda'},{value:'reveal-up',label:'Reveal up'},{value:'blur-in',label:'Blur in'},{value:'mask-slide',label:'Mask slide'},{value:'tracking-in',label:'Tracking in'},{value:'glow-in',label:'Glow in'}]), panel:'advanced'}, {...field('subtitleAnimation','Animação do apoio','select','Animação de texto',[{value:'none',label:'Nenhuma'},{value:'reveal-up',label:'Reveal up'},{value:'blur-in',label:'Blur in'},{value:'mask-slide',label:'Mask slide'},{value:'tracking-in',label:'Tracking in'}]), panel:'advanced'}, {...field('ribbonAnimation','Animação do ribbon','select','Animação de texto',[{value:'none',label:'Nenhuma'},{value:'reveal-up',label:'Reveal up'},{value:'blur-in',label:'Blur in'},{value:'mask-slide',label:'Mask slide'},{value:'tracking-in',label:'Tracking in'}]), panel:'advanced'}, {...field('textDuration','Duração (ms)','number','Animação de texto'), panel:'advanced', min:150, max:3000, step:50}, {...field('textDelay','Atraso inicial (ms)','number','Animação de texto'), panel:'advanced', min:0, max:2500, step:20}, {...field('textStagger','Intervalo palavra/letra (ms)','number','Animação de texto'), panel:'advanced', min:5, max:180, step:5},
        {...field('magneticCta','Botões magnéticos','toggle','Interação'), panel:'advanced'}, {...field('ctaEffect','Efeito do CTA','select','Interação',[{value:'none',label:'Nenhum'},{value:'glow',label:'Glow'},{value:'shine',label:'Reflexo em movimento'}]), panel:'advanced'}
      ],
      render: (p, s, id) => {
        const slides = [p.image1,p.image2,p.image3,p.image4].filter((value) => String(value || '').trim());
        const alignMap = { left:['flex-start','left','flex-start'], center:['center','center','center'], right:['flex-end','right','flex-end'] };
        const verticalMap = { top:'flex-start', center:'center', bottom:'flex-end' };
        const ribbonJustify = { left:'flex-start', center:'center', right:'flex-end', justify:'space-between' }[p.ribbonAlign] || 'flex-start';
        const ribbonTextAlign = ['left','center','right','justify'].includes(p.ribbonAlign) ? p.ribbonAlign : 'left';
        const align = alignMap[p.contentAlign] || alignMap.left;
        const motionDistance = (clampNumber(p.motionIntensity,34,0,100) * .06).toFixed(2);
        const style = [
          `--hp-overlay:${(clampNumber(p.overlayOpacity,56,0,90)/100).toFixed(2)}`,
          `--hp-vignette:${(clampNumber(p.vignette,38,0,80)/100).toFixed(2)}`,
          `--hp-blur:${clampNumber(p.bgBlur,0,0,10)}px`, `--hp-content-width:${clampNumber(p.contentMaxWidth,820,420,1400)}px`,
          `--hp-content-x:${clampNumber(p.contentOffsetX,0,-320,320)}px`, `--hp-content-y:${clampNumber(p.contentOffsetY,0,-240,240)}px`,
          `--hp-motion-duration:${clampNumber(p.motionDuration,16,4,60)}s`, `--hp-motion-distance:${motionDistance}%`, `--hp-motion-scale:${(clampNumber(p.bgScale,108,101,125)/100).toFixed(3)}`,
          `--hp-image-x:${clampNumber(p.imagePositionX,50,0,100)}%`, `--hp-image-y:${clampNumber(p.imagePositionY,50,0,100)}%`, `--hp-transition-duration:${clampNumber(p.transitionDuration,1200,200,4000)}ms`,
          `--hp-h-align:${align[0]}`, `--hp-text-align:${align[1]}`, `--hp-actions-align:${align[2]}`, `--hp-v-align:${verticalMap[p.verticalAlign] || 'center'}`,
          `--hp-ribbon-justify:${ribbonJustify}`, `--hp-ribbon-align:${ribbonTextAlign}`, `--hp-ribbon-width:${p.ribbonWidth === 'full' ? '100%' : 'max-content'}`,
          `--hp-title-font:${heroPlusFont(p.titleFont,'--hp-preset-title-font')}`, `--hp-title-size:${clampNumber(p.titleSize,92,42,180)}px`, `--hp-title-weight:${clampNumber(p.titleWeight,800,300,900)}`, `--hp-title-line:${clampNumber(p.titleLineHeight,.96,.75,1.5)}`, `--hp-title-track:${clampNumber(p.titleLetterSpacing,-.045,-.12,.18)}em`, `--hp-title-color:${heroPlusColor(p.titleColor,'#ffffff')}`, `--hp-title-shadow:${(clampNumber(p.titleShadow,25,0,80)/100).toFixed(2)}`,
          `--hp-subtitle-font:${heroPlusFont(p.subtitleFont,'--hp-preset-subtitle-font')}`, `--hp-subtitle-size:${clampNumber(p.subtitleSize,20,12,42)}px`, `--hp-subtitle-weight:${clampNumber(p.subtitleWeight,450,300,900)}`, `--hp-subtitle-line:${clampNumber(p.subtitleLineHeight,1.55,1,2.2)}`, `--hp-subtitle-track:${clampNumber(p.subtitleLetterSpacing,0,-.05,.16)}em`, `--hp-subtitle-color:${heroPlusColor(p.subtitleColor,'#e7ebef')}`,
          `--hp-ribbon-font:${heroPlusFont(p.ribbonFont,'--hp-preset-ribbon-font')}`, `--hp-ribbon-size:${clampNumber(p.ribbonSize,11.5,8,24)}px`, `--hp-ribbon-weight:${clampNumber(p.ribbonWeight,800,300,900)}`, `--hp-ribbon-track:${clampNumber(p.ribbonLetterSpacing,.13,0,.4)}em`, `--hp-ribbon-color:${heroPlusColor(p.ribbonColor,'#ffffff')}`,
          `--hp-text-duration:${clampNumber(p.textDuration,850,150,3000)}ms`, `--hp-text-delay:${clampNumber(p.textDelay,80,0,2500)}ms`, `--hp-text-stagger:${clampNumber(p.textStagger,35,5,180)}ms`, `--hp-glow-strength:${p.pointerLight ? (clampNumber(p.pointerLightStrength,18,0,65)/100).toFixed(2) : '0'}`, `--hp-title-transform:${['none','uppercase','lowercase'].includes(p.titleTransform) ? p.titleTransform : 'none'}`
        ].join(';');
        const slideMarkup = (slides.length ? slides : ['assets/images/hero-placeholder.jpg']).map((src,index) => `<figure class="hp-slide ${index === 0 ? 'is-active' : ''}"><img src="${esc(src)}" alt="${esc(index === 0 ? (p.imageAlt || p.title || 'Imagem do empreendimento') : '')}" ${index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async"></figure>`).join('');
        return `<section class="hero-plus-section section-shell" data-section-id="${id}" data-plugin="hero-plus" data-slide-transition="${esc(p.slideTransition || 'crossfade')}" data-slide-autoplay="${p.slideAutoplay ? 'true' : 'false'}" data-slide-duration="${clampNumber(p.slideDuration,6500,1800,20000)}" data-bg-motion="${esc(p.bgMotion || 'pan-left')}" data-content-align="${esc(p.contentAlign || 'left')}" data-type-preset="${esc(p.typographyPreset || 'contemporary')}" data-particles="${p.particlesEnabled ? 'true' : 'false'}" data-particle-style="${esc(p.particleStyle || 'dust')}" data-particle-density="${clampNumber(p.particleDensity,38,8,110)}" data-particle-speed="${clampNumber(p.particleSpeed,22,1,100)}" data-particle-size="${clampNumber(p.particleSize,1.6,.4,4)}" data-particle-opacity="${clampNumber(p.particleOpacity,30,4,80)}" data-particle-magnetic="${p.particleMagnetic ? 'true' : 'false'}" data-magnetic-strength="${clampNumber(p.magneticStrength,42,0,100)}" data-magnetic="${p.magneticCta ? 'true' : 'false'}" data-cta-effect="${esc(p.ctaEffect || 'shine')}" style="${style}"><div class="hp-bg">${slideMarkup}</div>${slides.length > 1 && p.slideAutoplay ? '<button class="hp-slide-control" type="button" aria-label="Pausar apresentação de imagens" aria-pressed="false"><span aria-hidden="true">Ⅱ</span></button>' : ''}<div class="hp-shade"></div><div class="hp-vignette"></div><div class="hp-spotlight"></div><canvas class="hp-particles" aria-hidden="true"></canvas><div class="hp-wrap"><div class="hp-content">${String(p.ribbonText || '').trim() ? `<div class="hp-ribbon" data-ribbon-align="${esc(p.ribbonAlign || 'left')}" data-hp-animate="${esc(p.ribbonAnimation || 'none')}"><span>${esc(p.ribbonText)}</span></div>` : ''}${String(p.eyebrow || '').trim() ? `<p class="hp-eyebrow" data-hp-animate="${esc(p.eyebrowAnimation || 'none')}">${esc(p.eyebrow)}</p>` : ''}<h1 class="hp-title" data-hp-animate="${esc(p.titleAnimation || 'none')}">${esc(p.title)}</h1><p class="hp-subtitle" data-hp-animate="${esc(p.subtitleAnimation || 'none')}">${esc(p.subtitle)}</p><div class="hp-actions">${p.primaryCta ? `<a class="button button-primary" href="${esc(heroPlusHref(p.primaryLink,'#contato'))}">${esc(p.primaryCta)}</a>` : ''}${p.secondaryCta ? `<a class="button button-ghost" href="${esc(heroPlusHref(p.secondaryLink,'#destaques'))}">${esc(p.secondaryCta)}</a>` : ''}</div>${p.badge ? `<span class="hp-badge">${esc(p.badge)}</span>` : ''}</div></div>${p.showExplore && p.exploreText ? `<a class="hp-explore" href="${esc(heroPlusHref(p.exploreLink,'#destaques'))}">${esc(p.exploreText)}</a>` : ''}</section>`;
      }
    },
    highlights: {
      name: 'Destaques', icon: '✦', category: 'Interesse', description: 'Benefícios com layouts editorial, cartões ou compacto', kind: 'section',
      cssPath: 'plugins/highlights/plugin.css', jsPath: 'plugins/highlights/plugin.js', manifestPath: 'plugins/highlights/plugin.json',
      defaults: { eyebrow:'PENSADO NOS DETALHES', title:'O essencial, elevado a outro nível.', subtitle:'', items:'Localização estratégica|Perto de tudo, sem abrir mão da tranquilidade.\nPlantas inteligentes|Espaços que aproveitam cada metro e acompanham sua rotina.\nLazer completo|Ambientes para viver, celebrar e desacelerar todos os dias.', layout:'editorial', columns:'3', marker:'number', textAlign:'left', ctaLabel:'', ctaHref:'#contato' },
      fields: [
        field('eyebrow','Eyebrow · chamada superior','text','Conteúdo'),
        field('title','Headline · título da seção','textarea','Conteúdo'),
        field('subtitle','Subheadline · texto de apoio (opcional)','textarea','Conteúdo'),
        {...field('items','Um destaque por linha: título|descrição','textarea','Destaques'),rows:8,note:'Separe o título da descrição com |. Uma linha corresponde a um destaque.'},
        field('layout','Estilo visual','select','Estilo',[{value:'editorial',label:'Editorial · divisórias'},{value:'cards',label:'Cartões · superfície suave'},{value:'compact',label:'Compacto · linhas'}]),
        field('columns','Colunas no desktop','select','Estilo',[{value:'2',label:'2 colunas'},{value:'3',label:'3 colunas'},{value:'4',label:'4 colunas'}]),
        field('marker','Marcador dos itens','select','Estilo',[{value:'number',label:'Numeração discreta'},{value:'dot',label:'Ponto de destaque'},{value:'none',label:'Sem marcador'}]),
        field('textAlign','Alinhamento do conteúdo','select','Estilo',[{value:'left',label:'Esquerda'},{value:'center',label:'Centralizado'}]),
        field('ctaLabel','CTA opcional · texto do botão','text','Ação'),
        field('ctaHref','CTA opcional · link ou âncora','text','Ação')
      ],
      render: (props, state, id) => {
        const p = props || {};
        const layout = ['editorial','cards','compact'].includes(p.layout) ? p.layout : 'editorial';
        const columns = ['2','3','4'].includes(String(p.columns)) ? String(p.columns) : '3';
        const marker = ['number','dot','none'].includes(p.marker) ? p.marker : 'number';
        const align = p.textAlign === 'center' ? 'center' : 'left';
        const items = highlightItems(p.items);
        const rows = items.map((item,index) => `<article class="highlight-item" role="listitem">${marker !== 'none' ? `<span class="highlight-marker" aria-hidden="true">${marker === 'dot' ? '•' : String(index+1).padStart(2,'0')}</span>` : ''}<div class="highlight-item-copy">${item.title ? `<h3>${esc(item.title)}</h3>` : ''}${item.copy ? `<p>${esc(item.copy)}</p>` : ''}</div></article>`).join('');
        const eyebrow = String(p.eyebrow || '').trim();
        const title = String(p.title || '').trim();
        const subtitle = String(p.subtitle || '').trim();
        const cta = String(p.ctaLabel || '').trim();
        const sectionIntro = (eyebrow || title || subtitle) ? `<div class="section-intro highlights-intro">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}${title ? `<h2>${esc(title)}</h2>` : ''}${subtitle ? `<p class="highlights-subtitle">${esc(subtitle)}</p>` : ''}</div>` : '';
        // Keep the historical #destaques target only on the first visible occurrence.
        const first = (state?.sections || []).find((section) => section.type === 'highlights' && section.settings?.visible !== false);
        const anchor = !first || first.id === id ? 'destaques' : `destaques-${String(id).replace(/[^A-Za-z0-9_-]/g,'-')}`;
        return `<section id="${esc(anchor)}" class="highlights-section section-shell" data-section-id="${esc(id)}" data-plugin="highlights" data-highlight-layout="${layout}" data-highlight-columns="${columns}" data-highlight-marker="${marker}" data-highlight-align="${align}"><div class="site-container">${sectionIntro}<div class="highlight-grid" role="list">${rows}</div>${cta ? `<div class="highlights-action"><a class="button button-primary" href="${esc(highlightLink(p.ctaHref))}">${esc(cta)}</a></div>` : ''}</div></section>`;
      }
    },
    'benefits-showcase': {
      name: 'Benefits Showcase', icon: '◇', category: 'Interesse', description: 'Benefícios com ícones vetoriais SVG, presets, categorias e coreografias', kind: 'section',
      cssPath: 'plugins/benefits-showcase/plugin.css', jsPath: 'plugins/benefits-showcase/plugin.js', manifestPath: 'plugins/benefits-showcase/plugin.json',
      defaults: { eyebrow:'INFRAESTRUTURA E COMODIDADES', title:'Tudo para viver melhor.', subtitle:'Cada detalhe pensado para sua rotina.', profile:'premium', styleSource:'project', layout:'smart', columns:'4', align:'left', animation:'cascade', motionDuration:650, stagger:90, iconStyle:'outlined', iconSize:42, accentColor:'#b99c76', backgroundColor:'#faf9f7', cardColor:'#ffffff', textColor:'#18202d', cornerRadius:18, cardGap:18, categoryFilter:false, showDescriptions:true, backgroundImage:'', backgroundFixed:true, backgroundOverlay:76, backgroundPositionY:50, iconSvgMap:'{}', items:'pool|Piscina & Spa|Rooftop com espaço para relaxar e aproveitar a vista.|Lazer\nlaptop|Coworking|Ambiente funcional para trabalho e estudos.|Conveniência\nfitness_center|Academia|Estrutura prática para manter a rotina ativa.|Bem-estar\nshield|Segurança 24h|Acesso controlado e mais tranquilidade.|Segurança\npets|Pet Place|Espaço pensado para seu pet.|Lazer\ncelebration|Salão de Festas|Encontros e comemorações especiais.|Lazer\nelevator|Elevadores|Mais conforto e praticidade.|Infraestrutura\nlocation_on|Localização Estratégica|Próximo aos serviços e à mobilidade.|Localização' },
      fields: [
        field('eyebrow','Chamada superior','text','Conteúdo'), field('title','Título','textarea','Conteúdo'), field('subtitle','Descrição da section','textarea','Conteúdo'),
        field('profile','Perfil do imóvel','select','Preset',[{value:'premium',label:'Residencial / alto padrão'},{value:'mcmv',label:'Minha Casa Minha Vida'},{value:'nautico',label:'Náutico / resort'},{value:'comercial',label:'Comercial'},{value:'custom',label:'Personalizado'}]),
        field('layout','Composição','select','Preset',[{value:'smart',label:'Smart Grid'},{value:'bento',label:'Bento Benefits'},{value:'editorial',label:'Editorial Premium'},{value:'list',label:'Lista compacta'}]),
        field('items','Gerenciar lista de benefícios','benefits-wizard','Benefícios'),
        field('categoryFilter','Mostrar filtros por categoria','toggle','Benefícios'), field('showDescriptions','Mostrar descrições','toggle','Benefícios'),
        field('columns','Colunas no desktop','select','Layout',[{value:'2',label:'2 colunas'},{value:'3',label:'3 colunas'},{value:'4',label:'4 colunas'}]),
        field('align','Alinhamento','select','Layout',[{value:'left',label:'Esquerda'},{value:'center',label:'Centralizado'}]),
        {...field('cornerRadius','Raio dos cards (px)','range','Layout'),min:0,max:36,step:1},
        {...field('cardGap','Espaçamento entre cards (px)','range','Layout'),min:8,max:40,step:1},
        field('iconStyle','Estilo dos ícones','select','Ícones Google SVG',[{value:'outlined',label:'Outlined'},{value:'rounded',label:'Rounded'},{value:'sharp',label:'Sharp'}]),
        {...field('iconSize','Tamanho do ícone (px)','range','Ícones Google SVG'),min:20,max:64,step:1},
        {...field('backgroundImage','Imagem de fundo (opcional)','image','Imagem de fundo'),note:'Carregue uma foto ou informe a URL. Sem imagem, o fundo original da seção é preservado.'},
        {...field('backgroundFixed','Manter imagem fixa durante o scroll','toggle','Imagem de fundo'),hiddenWhen:{field:'backgroundImage',falsy:true},note:'O fundo acompanha a janela durante a rolagem e termina no limite desta seção.'},
        {...field('backgroundOverlay','Proteção de leitura sobre a imagem (%)','range','Imagem de fundo'),min:55,max:90,step:1,showValue:true,unit:'%',hiddenWhen:{field:'backgroundImage',falsy:true},note:'Escurecimento ajustável. Padrão 76% para preservar o contraste do título e dos benefícios.'},
        {...field('backgroundPositionY','Posição vertical da imagem (%)','range','Imagem de fundo'),min:0,max:100,step:1,showValue:true,unit:'%',hiddenWhen:{field:'backgroundImage',falsy:true}},
        field('styleSource','Fonte das cores','select','Cores',[{value:'project',label:'Herdar do projeto (recomendado)'},{value:'custom',label:'Personalizar neste componente'}]),
        field('accentColor','Cor dos ícones e detalhes · modo personalizado','color','Cores'),field('backgroundColor','Fundo da section','color','Cores'),field('cardColor','Fundo dos cards','color','Cores'),field('textColor','Cor dos textos','color','Cores'),
        field('animation','Coreografia','select','Animação',[{value:'cascade',label:'Cascade Reveal'},{value:'mask',label:'Mask Unfold'},{value:'elevate',label:'Soft Elevation'},{value:'none',label:'Nenhuma'}]),
        {...field('motionDuration','Duração (ms)','range','Animação'),min:200,max:1600,step:50},
        {...field('stagger','Intervalo entre cards (ms)','range','Animação'),min:0,max:300,step:10}
      ],
      render: (p, state, id) => {
        const col = ['2','3','4'].includes(String(p.columns)) ? String(p.columns) : '4';
        const layout = ['smart','bento','editorial','list'].includes(p.layout) ? p.layout : 'smart';
        const motion = ['cascade','mask','elevate','none'].includes(p.animation) ? p.animation : 'cascade';
        const safeColor = (v,f) => /^#[0-9a-f]{6}$/i.test(String(v||'')) ? String(v) : f;
        const data = String(p.items || '').split(/\r?\n/).map(t=>t.trim()).filter(Boolean).slice(0,48).map((line)=>{
          const [icon='',title='',copy='',category=''] = line.split('|');
          return {icon:icon.trim().replace(/^\*/,''),featured:icon.trim().startsWith('*'),title:title.trim(),copy:copy.trim(),category:category.trim()};
        }).filter(it=>it.title);
        const svgPaths = {
          pool:'<path d="M3 18q2-2 4 0t4 0t4 0t4 0t4 0M3 22q2-2 4 0t4 0t4 0t4 0t4 0M7 15V5a2 2 0 0 1 4 0v9M7 10h9V5a2 2 0 0 1 4 0v9"/>',
          laptop:'<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M1 20h22M8 17h8"/>',
          fitness_center:'<path d="M2 9v6m3-9v12m3-7v2m8-2v2m3-7v12m3-9v6M5 12h14"/>',
          shield:'<path d="m12 2 8 4v6c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
          pets:'<circle cx="5" cy="8" r="1.5"/><circle cx="10" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="20" cy="8" r="1.5"/><path d="M12 11c-2 0-3 2-5 4-3 4 1 7 5 5s8-1 5-5c-2-2-3-4-5-4z"/>',
          celebration:'<path d="m4 20 5-14 9 9-14 5zM15 3v3m5 2-3 2m3 8 2 1M10 2l1 2"/>',
          elevator:'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M12 5v14m-3-11 3-3 3 3m-6 8 3 3 3-3"/>',
          location_on:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
          park:'<path d="m12 2 8 13H4L12 2zM12 14v8M6 22h12"/>',
          directions_car:'<path d="m5 11 2-6h10l2 6M5 17v2m14-2v2M3 11h18v6H3z"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
          home:'<path d="m3 11 9-8 9 8v10H3V11zM9 21v-7h6v7"/>', bed:'<path d="M3 4v16M21 11v9M3 16h18v-5H3zM6 11V7h12v4"/>',
          waves:'<path d="M2 9q3-4 6 0t8 0t6 0M2 15q3-4 6 0t8 0t6 0M2 21q3-4 6 0t8 0t6 0"/>',
          sailing:'<path d="M12 2v16M12 3 4 16h8M14 6l6 10h-6M3 19l4 3h10l4-3H3z"/>',
          anchor:'<circle cx="12" cy="4" r="2"/><path d="M12 6v15M5 12H2m20 0h-3M4 14a8 8 0 0 0 16 0M8 9h8"/>',
          wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="21" r="1"/>',
          groups:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-3c0-4 14-4 14 0v3M17 5a3 3 0 0 1 0 6m2 3c2 0 3 2 3 4v2"/>',
          child_care:'<circle cx="12" cy="12" r="9"/><circle cx="9" cy="11" r=".7"/><circle cx="15" cy="11" r=".7"/><path d="M9 15q3 3 6 0M10 3q2 4 4 0"/>',
          spa:'<path d="M12 21c-5-3-9-7-9-12 6 0 9 4 9 12zm0 0c0-8 3-12 9-12 0 5-4 9-9 12zM12 12c-2-4-2-7 0-10 2 3 2 6 0 10z"/>',
          restaurant:'<path d="M5 2v20m-3-20v7c0 3 6 3 6 0V2m10 20V2c-5 3-5 9 0 12"/>',
          sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
          business:'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 3v18m5-14h4m-4 5h4m-4 5h4"/>',
          check_circle:'<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>',
          eco:'<path d="M21 3C8 3 4 8 4 15a6 6 0 0 0 6 6c7 0 12-5 11-18zM4 20q5-8 13-11"/>',
          local_parking:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 18V7h4a3 3 0 0 1 0 6H9"/>'
        };
        // SVGs oficiais selecionados no Wizard sao serializados em iconSvgMap no JSON.
        // Revalidar antes de inserir no HTML impede scripts/atributos perigosos em JSONs externos.
        let googleMap={};try{const v=JSON.parse(p.iconSvgMap||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))googleMap=v;}catch(_){/* projeto antigo */}
        const materialStyle=['outlined','rounded','sharp'].includes(p.iconStyle)?p.iconStyle:'outlined';
        const iconMarkup = (name) => {
          const size=clampNumber(p.iconSize,42,20,64);
          const keys=[materialStyle+'/'+name,'outlined/'+name,'rounded/'+name,'sharp/'+name];
          for(const k of keys){
            const svg=googleMap[k];
            if(typeof svg!=='string'||svg.length>25000)continue;
            // O wizard grava somente viewBox numerico + paths; ainda validar dados importados.
            const m=svg.match(/^<svg viewBox="([0-9.\s-]+)">((?:<path d="[MmLlHhVvCcSsQqTtAaZz0-9\s, .+\-]+"\/>)+)<\/svg>$/);
            if(m)return `<svg viewBox="${m[1]}" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" focusable="false">${m[2]}</svg>`;
          }
          return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${svgPaths[name] || svgPaths.check_circle}</svg>`;
        };
        const list = data.map((item,i)=>`<article class="bs-card${item.featured?' bs-featured':''}" data-bs-category="${esc(item.category)}" style="--bs-index:${i}" role="listitem"><div class="bs-icon">${iconMarkup(item.icon)}</div><div class="bs-copy"><h3>${esc(item.title)}</h3>${p.showDescriptions!==false && item.copy?`<p>${esc(item.copy)}</p>`:''}</div></article>`).join('');
        const categories = [...new Set(data.map(v=>v.category).filter(Boolean))];
        const filters = p.categoryFilter && categories.length>1 ? `<div class="bs-filters" role="group" aria-label="Filtrar benefícios"><button type="button" class="bs-filter is-active" data-bs-filter="*" aria-pressed="true">Todos</button>${categories.map(c=>`<button type="button" class="bs-filter" data-bs-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>` : '';
        // Background opcional: URL sanitizada para contexto CSS e imagem incorporada pelo compilador.
        // O atributo CSS nunca aceita comandos arbitrários de projetos JSON importados.
        const backgroundSource = String(p.backgroundImage || '').trim();
        const validBackground = /^(?:https?:\/\/[^\s]+|\.?\/?assets\/[\w./%?=&+#-]+|\/assets\/[\w./%?=&+#-]+|data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+|blob:[^\s]+)$/i.test(backgroundSource);
        const hasBackground = validBackground;
        const backgroundFixed = p.backgroundFixed !== false;
        const inheritPalette = p.styleSource === 'project'; // Propriedade ausente em projetos antigos preserva suas cores locais.
        const styles = [`--bs-columns:${col}`,`--bs-radius:${clampNumber(p.cornerRadius,18,0,36)}px`,`--bs-gap:${clampNumber(p.cardGap,18,8,40)}px`,`--bs-icon-size:${clampNumber(p.iconSize,42,20,64)}px`,`--bs-accent:${inheritPalette?'var(--primary-on-surface,var(--primary))':safeColor(p.accentColor,'#b99c76')}`,`--bs-bg:${inheritPalette?'var(--surface)':safeColor(p.backgroundColor,'#faf9f7')}`,`--bs-card:${inheritPalette?'color-mix(in srgb,var(--surface) 35%,white)':safeColor(p.cardColor,'#ffffff')}`,`--bs-text:${inheritPalette?'var(--body-color)':safeColor(p.textColor,'#18202d')}`,`--bs-title:${inheritPalette?'var(--heading-color)':safeColor(p.textColor,'#18202d')}`,`--bs-duration:${clampNumber(p.motionDuration,650,200,1600)}ms`,`--bs-stagger:${clampNumber(p.stagger,90,0,300)}ms`,`--bs-overlay:${clampNumber(p.backgroundOverlay,76,55,90)/100}`,`--bs-image-y:${clampNumber(p.backgroundPositionY,50,0,100)}%`].join(';');
        return `<section class="bs-section section-shell" data-plugin="benefits-showcase" data-section-id="${esc(id)}" data-bs-layout="${layout}" data-bs-motion="${motion}" data-bs-icon-style="${['outlined','rounded','sharp'].includes(p.iconStyle)?p.iconStyle:'outlined'}" data-bs-align="${p.align==='center'?'center':'left'}" data-bs-image="${hasBackground?'true':'false'}" data-bs-fixed="${backgroundFixed?'true':'false'}" style="${styles}">${hasBackground?`<div class="bs-backdrop" aria-hidden="true"><img class="bs-bg-image" src="${esc(backgroundSource)}" alt="" loading="lazy" decoding="async"></div>`:''}<div class="site-container"><header class="bs-heading">${p.eyebrow?`<p class="eyebrow">${esc(p.eyebrow)}</p>`:''}${p.title?`<h2>${esc(p.title)}</h2>`:''}${p.subtitle?`<p class="bs-subtitle">${esc(p.subtitle)}</p>`:''}</header>${filters}<div class="bs-grid" role="list">${list}</div></div></section>`;
      }
    },
    'info-objetiva': {
      name: 'Informações objetivas', icon: '▤', category: 'Interesse', description: 'Indicadores e cronograma de entrega, sem parágrafos longos', kind: 'section',
      cssPath: 'plugins/info-objetiva/plugin.css', jsPath: 'plugins/info-objetiva/plugin.js', manifestPath: 'plugins/info-objetiva/plugin.json',
      defaults: { eyebrow:'RESIDENCIAL NÁPOLES', title:'O empreendimento em números', copy:'Uma visão rápida da estrutura e do calendário de entrega.', metrics:'03|Torres residenciais\n07|Pavimentos por torre\n02|Elevadores por torre\n12|Apartamentos por andar', scheduleTitle:'Previsão de entrega', milestones:'Torre A|Junho de 2028\nTorre B|Dezembro de 2028\nTorre C|Junho de 2029', note:'Datas previstas, sujeitas à confirmação contratual.', columns:'4', visualStyle:'cards', showMetrics:true, showSchedule:true },
      fields: [
        field('eyebrow','Chamada superior','text','Conteúdo'),field('title','Título','textarea','Conteúdo'),field('copy','Descrição curta','textarea','Conteúdo'),
        {...field('metrics','Indicadores: número|descrição (um por linha)','textarea','Indicadores'),rows:6},
        field('showMetrics','Exibir indicadores','checkbox','Indicadores'),
        field('columns','Colunas no desktop','select','Estilo',[{value:'2',label:'2 colunas'},{value:'3',label:'3 colunas'},{value:'4',label:'4 colunas'}]),
        field('visualStyle','Visual','select','Estilo',[{value:'cards',label:'Cartões'},{value:'minimal',label:'Minimalista'},{value:'accent',label:'Destaque na cor do tema'}]),
        field('scheduleTitle','Título do cronograma','text','Cronograma'),
        {...field('milestones','Etapas: identificação|data (uma por linha)','textarea','Cronograma'),rows:5},
        field('showSchedule','Exibir cronograma','checkbox','Cronograma'),
        field('note','Observação do cronograma','textarea','Cronograma')
      ],
      render: (p, s, id) => {
        const parse = (input) => String(input || '').split(/\r?\n/).map(v=>v.trim()).filter(Boolean).map(v=>{const x=v.split('|');return {first:(x.shift()||'').trim(),second:x.join('|').trim()}}).filter(v=>v.first);
        const style = ['cards','minimal','accent'].includes(p.visualStyle) ? p.visualStyle : 'cards';
        const cols = ['2','3','4'].includes(String(p.columns)) ? String(p.columns) : '4';
        const metrics = p.showMetrics !== false ? parse(p.metrics).map(v=>`<div class="io-metric"><strong>${esc(v.first)}</strong><span>${esc(v.second)}</span></div>`).join('') : '';
        const milestones = p.showSchedule !== false ? parse(p.milestones).map(v=>`<div class="io-milestone"><strong>${esc(v.first)}</strong><time>${esc(v.second)}</time></div>`).join('') : '';
        return `<section class="info-objetiva-section section-shell" data-plugin="info-objetiva" data-section-id="${esc(id)}" data-io-style="${style}" style="--io-cols:${cols}"><div class="site-container"><header class="io-head">${p.eyebrow?`<p class="eyebrow">${esc(p.eyebrow)}</p>`:''}${p.title?`<h2>${esc(p.title)}</h2>`:''}${p.copy?`<p>${esc(p.copy)}</p>`:''}</header>${metrics?`<div class="io-metrics" role="list">${metrics}</div>`:''}${milestones?`<div class="io-timeline"><h3 class="io-subtitle">${esc(p.scheduleTitle||'Cronograma')}</h3><div class="io-schedule">${milestones}</div>${p.note?`<p class="io-note">${esc(p.note)}</p>`:''}</div>`:''}</div></section>`;
      }
    },
    specs: {
      name: 'Ficha do imóvel', icon: '▦', category: 'Interesse', description: 'Dados técnicos de leitura rápida', kind: 'section',
      cssPath: 'plugins/specs/plugin.css', jsPath: 'plugins/specs/plugin.js', manifestPath: 'plugins/specs/plugin.json',
      defaults: { eyebrow:'FICHA TÉCNICA', title:'Dados do imóvel', copy:'Características e informações essenciais da unidade.', items: '72–96 m²|Área privativa\n2 ou 3|Dormitórios\n1 suíte|Suítes\n2 vagas|Vagas de garagem\n2028|Previsão de entrega', columns:'3', showDescription:true },
      fields: [field('eyebrow','Identificação da ficha','text','Conteúdo'), field('title','Título da ficha','text','Conteúdo'), field('copy','Observação curta','textarea','Conteúdo'), field('showDescription','Exibir observação','toggle','Conteúdo'), field('items','Dados: valor|rótulo (um por linha)','textarea','Dados'), field('columns','Colunas desktop','select','Layout',[{value:'2',label:'2 colunas'},{value:'3',label:'3 colunas'},{value:'4',label:'4 colunas'}])],
      render: (p, s, id) => {
        const data=lines(p.items).map(item=>{const index=item.indexOf('|');return index<0?null:{value:item.slice(0,index).trim(),label:item.slice(index+1).trim()};}).filter(item=>item&&item.label&&item.value).slice(0,40);
        const columns=['2','3','4'].includes(String(p.columns))?String(p.columns):'3';
        return `<section class="specs-section section-shell" data-section-id="${esc(id)}" data-plugin="specs" data-specs-cols="${columns}" style="--specs-cols:${columns}"><div class="site-container specs-sheet"><header class="specs-sheet-head"><div class="specs-sheet-ident"><p class="eyebrow">${esc(p.eyebrow||'FICHA TÉCNICA')}</p><h2>${esc(p.title||'Dados do imóvel')}</h2></div>${p.showDescription!==false&&p.copy?`<p class="specs-sheet-summary">${esc(p.copy)}</p>`:''}</header><dl class="specs-grid" aria-label="Características do imóvel">${data.map(({value,label})=>`<div class="specs-fact"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></div></section>`;
      }
    },
    gallery: {
      name: 'Galeria imersiva', icon: '▧', category: 'Desejo', description: 'Imagens com navegação e lightbox', kind: 'section',
      cssPath: 'plugins/gallery/plugin.css', jsPath: 'plugins/gallery/plugin.js', manifestPath: 'plugins/gallery/plugin.json',
      defaults: { eyebrow: 'ARQUITETURA E ATMOSFERA', title: 'Ambientes que convidam você a ficar.', image1: 'assets/images/gallery-1.jpg', caption1: 'Living integrado', image2: 'assets/images/gallery-2.jpg', caption2: 'Rooftop ao pôr do sol', image3: 'assets/images/gallery-3.jpg', caption3: 'Lazer para toda a família' },
      fields: [field('eyebrow','Chamada superior'), field('title','Título','textarea'), field('image1','Imagem 1','image','Galeria'), field('caption1','Legenda 1','text','Galeria'), field('image2','Imagem 2','image','Galeria'), field('caption2','Legenda 2','text','Galeria'), field('image3','Imagem 3','image','Galeria'), field('caption3','Legenda 3','text','Galeria')],
      render: (p, s, id) => `<section id="galeria" class="gallery-section section-shell" data-section-id="${id}" data-plugin="gallery"><div class="site-container"><div class="section-intro wide"><p class="eyebrow">${esc(p.eyebrow)}</p><h2>${esc(p.title)}</h2></div><div class="gallery-grid">${[1,2,3].map((n) => `<figure><button class="gallery-open" type="button" data-lightbox-src="${esc(p['image'+n])}" aria-label="Ampliar ${esc(p['caption'+n])}"><img src="${esc(p['image'+n])}" alt="${esc(p['caption'+n])}" loading="lazy" decoding="async" fetchpriority="low"><span>↗</span></button><figcaption>${esc(p['caption'+n])}</figcaption></figure>`).join('')}</div></div></section>`
    },
    lifestyle: {
      name: 'Lifestyle', icon: '◒', category: 'Desejo', description: 'Narrativa emocional com imagem', kind: 'section',
      cssPath: 'plugins/lifestyle/plugin.css', jsPath: 'plugins/lifestyle/plugin.js', manifestPath: 'plugins/lifestyle/plugin.json',
      defaults: { eyebrow: 'MAIS VIDA NO SEU DIA', title: 'Menos deslocamento. Mais tempo para você.', titleAlign: 'left', titleAlignMobile: 'inherit', copy: 'Comece a manhã com calma, trabalhe perto de tudo e termine o dia em espaços criados para renovar as energias.', image: 'assets/images/lifestyle.jpg', quote: 'Morar bem é quando a casa melhora também o lado de fora dela.', copyAlign: 'left', lineFit: 'balanced' },
      fields: [field('eyebrow','Chamada superior'), field('title','Título','textarea'), field('titleAlign','Alinhamento do título','select','Tipografia', [['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']].map(([value,label])=>({value,label}))), field('titleAlignMobile','Alinhamento do título · mobile','select','Tipografia', [['inherit','Igual ao desktop'],['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']].map(([value,label])=>({value,label}))), field('copy','Narrativa','textarea'), field('copyAlign','Alinhamento da narrativa','select','Tipografia', [['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']].map(([value,label])=>({value,label}))), field('lineFit','Quebra e ajuste de linha','select','Tipografia', [['normal','Normal'],['editorial','Editorial · sem hífen'],['balanced','Balanceado · recomendado']].map(([value,label])=>({value,label}))), field('quote','Frase de impacto','textarea'), field('image','Imagem','image','Imagem')],
      render: (p, s, id) => `<section class="lifestyle-section section-shell" data-section-id="${id}" data-plugin="lifestyle" data-title-align="${esc(['left','center','right','justify'].includes(p.titleAlign) ? p.titleAlign : 'left')}" data-title-align-mobile="${esc(['inherit','left','center','right','justify'].includes(p.titleAlignMobile) ? p.titleAlignMobile : 'inherit')}" data-copy-align="${esc(['left','center','right','justify'].includes(p.copyAlign) ? p.copyAlign : 'justify')}" data-line-fit="${esc(p.lineFit === 'optical' ? 'balanced' : (['normal','editorial','balanced'].includes(p.lineFit) ? p.lineFit : 'balanced'))}"><div class="lifestyle-image"><img src="${esc(p.image)}" alt="${esc(p.title || 'Experiência de morar')}" loading="lazy" decoding="async" fetchpriority="low"></div><div class="lifestyle-copy"><p class="eyebrow">${esc(p.eyebrow)}</p><h2>${esc(p.title)}</h2><p>${esc(p.copy)}</p><blockquote>${esc(p.quote)}</blockquote></div></section>`
    },
    payment: {
      name: 'Condições de pagamento', icon: 'R$', category: 'Decisão', description: 'Preço, entrada e parcelas', kind: 'section',
      cssPath: 'plugins/payment/plugin.css', jsPath: 'plugins/payment/plugin.js', manifestPath: 'plugins/payment/plugin.json',
      defaults: { eyebrow: 'CONDIÇÃO ESPECIAL', title: 'Um plano possível para chegar ao seu imóvel.', price: 'R$ 389.900', priceLabel: 'unidades a partir de', downPaymentLabel: 'Entrada', downPayment: 'R$ 38.990', installmentsLabel: 'Prazo sugerido', installments: '36x de R$ 2.190', note: '*Condição ilustrativa sujeita à análise de crédito e disponibilidade.', cta: 'Simular meu plano', anchor: '#contato' },
      fields: [field('eyebrow','Chamada superior'), field('title','Título','textarea'), field('priceLabel','Rótulo do preço'), field('price','Preço'), field('downPaymentLabel','Label da entrada'), field('downPayment','Entrada'), field('installmentsLabel','Label das parcelas'), field('installments','Parcelas'), field('note','Observação legal','textarea'), field('cta','Texto do CTA'), field('anchor','Destino do CTA')],
      render: (p, s, id) => `<section class="payment-section section-shell" data-section-id="${id}" data-plugin="payment"><div class="site-container payment-card"><div><p class="eyebrow">${esc(p.eyebrow)}</p><h2>${esc(p.title)}</h2><p class="legal">${esc(p.note)}</p></div><div class="price-block"><span>${esc(p.priceLabel)}</span><strong>${esc(p.price)}</strong><div><small>${esc(p.downPaymentLabel ?? 'Entrada')}</small><b>${esc(p.downPayment)}</b></div><div><small>${esc(p.installmentsLabel ?? 'Prazo sugerido')}</small><b>${esc(p.installments)}</b></div><a class="button button-primary" href="${esc(p.anchor)}">${esc(p.cta)}</a></div></div></section>`
    },
    testimonials: {
      name: 'Depoimentos', icon: '”', category: 'Prova', description: 'Prova social de clientes', kind: 'section',
      cssPath: 'plugins/testimonials/plugin.css', jsPath: 'plugins/testimonials/plugin.js', manifestPath: 'plugins/testimonials/plugin.json',
      defaults: { eyebrow: 'QUEM JÁ ESCOLHEU', title: 'Decisões seguras começam com informação.', items: 'Mariana e Paulo|Compradores|A apresentação foi clara e conseguimos entender qual planta fazia sentido para nossa rotina.\nLuciana M.|Investidora|Recebi dados objetivos sobre localização, condições e potencial do projeto. Isso facilitou minha decisão.\nRafael S.|Comprador|O atendimento não pressionou; organizou os próximos passos e respondeu todas as dúvidas.' },
      fields: [field('eyebrow','Chamada superior'), field('title','Título','textarea'), field('items','Nome|perfil|depoimento','textarea')],
      render: (p,s,id)=>`<section class="testimonials-section section-shell" data-section-id="${id}" data-plugin="testimonials"><div class="site-container"><div class="section-intro"><p class="eyebrow">${esc(p.eyebrow)}</p><h2>${esc(p.title)}</h2></div><div class="testimonial-grid">${lines(p.items).map(item=>{const [name,role,copy]=item.split('|');return `<blockquote><span>“</span><p>${esc(copy)}</p><footer><strong>${esc(name)}</strong><small>${esc(role)}</small></footer></blockquote>`}).join('')}</div></div></section>`
    },
    faq: {
      name: 'Perguntas frequentes', icon: '?', category: 'Objeção', description: 'Accordion para reduzir dúvidas', kind: 'section',
      cssPath: 'plugins/faq/plugin.css', jsPath: 'plugins/faq/plugin.js', manifestPath: 'plugins/faq/plugin.json',
      defaults: { eyebrow: 'DÚVIDAS FREQUENTES', title: 'Informação para decidir com tranquilidade.', items: 'Posso usar FGTS?|Sim. A utilização depende do enquadramento do cliente e do imóvel nas regras vigentes.\nO empreendimento aceita financiamento?|Sim. A simulação é feita conforme sua renda, entrada disponível e modalidade de crédito.\nQuando será entregue?|A previsão contratual é dezembro de 2028, observadas as condições do memorial e do contrato.\nComo recebo a tabela atualizada?|Preencha o formulário e solicite a disponibilidade e as condições do dia.' },
      fields: [field('eyebrow','Chamada superior'), field('title','Título','textarea'), field('items','Pergunta|resposta','textarea')],
      render: (p,s,id)=>`<section class="faq-section section-shell" data-section-id="${id}" data-plugin="faq"><div class="site-container faq-layout"><div><p class="eyebrow">${esc(p.eyebrow)}</p><h2>${esc(p.title)}</h2></div><div class="faq-list">${lines(p.items).map((item,i)=>{const [q,a]=item.split('|');return `<details ${i===0?'open':''}><summary>${esc(q)}<span>+</span></summary><p>${esc(a)}</p></details>`}).join('')}</div></div></section>`
    },
    footer: {
      name: 'Rodapé profissional', icon: '▔', category: 'Confiança', description: 'Marca, CRECI, canais sociais e informações legais', kind: 'section',
      cssPath: 'plugins/footer/plugin.css', jsPath: 'plugins/footer/plugin.js', manifestPath: 'plugins/footer/plugin.json',
      manifest: { id:'footer', name:'Rodapé profissional', version:'1.1.2', type:'section' },
      defaults: {
        brand: 'Roberto Fettuccia',
        role: 'Especialista em Terreno e Construção',
        professionalDescription: 'Roberto Fettuccia — Corretor de imóveis e especialista em Terreno e Construção',
        license: 'CRECI 83599F',
        phone: '(51) 99811-1078',
        email: 'contato@seudominio.com.br',
        socialHeading: 'Você nos encontra também em nossos canais.',
        facebookUrl: 'https://www.facebook.com/roberto.fettuccia',
        whatsappUrl: 'https://wa.me/?phone=5551998111078',
        instagramUrl: 'https://www.instagram.com/roberto.fettuccia',
        tiktokUrl: 'https://www.tiktok.com/@roberto.fettuccia7',
        youtubeUrl: 'https://www.youtube.com/@Corretor-RobertoFettuccia',
        googleBusinessUrl: 'https://g.page/r/CSVAh5ZZppPREAE/review',
        linkedinUrl: 'https://www.linkedin.com/in/roberto-fettuccia/',
        additionalSocials: '',
        socialStyle: 'outline',
        socialLabels: 'icons',
        socialIconSize: 44,
        socialOpenNewTab: true,
        disclaimer: 'Imagens meramente ilustrativas. Valores, condições e disponibilidade podem ser alterados sem aviso prévio.'
      },
      fields: [
        field('brand','Nome ou marca','text','Identidade'),
        field('role','Posicionamento','text','Identidade'),
        { ...field('professionalDescription','Descrição profissional / responsável','text','Identidade'), note:'Texto exibido no bloco de responsabilidade do rodapé. Pode ser alterado livremente.' },
        field('license','CRECI','text','Contato'),
        field('phone','Telefone','text','Contato'),
        field('email','E-mail','text','Contato'),
        field('socialHeading','Chamada dos canais','text','Redes sociais'),
        { ...field('facebookUrl','Facebook — URL do perfil','url','Redes sociais'), note:'Deixe vazio para ocultar o Facebook.' },
        { ...field('whatsappUrl','WhatsApp — URL do perfil','url','Redes sociais'), note:'Deixe vazio para ocultar o WhatsApp.' },
        { ...field('instagramUrl','Instagram — URL do perfil','url','Redes sociais'), note:'Deixe vazio para ocultar o Instagram.' },
        { ...field('tiktokUrl','TikTok — URL do perfil','url','Redes sociais'), note:'Deixe vazio para ocultar o TikTok.' },
        { ...field('youtubeUrl','YouTube — URL do canal','url','Redes sociais'), note:'Deixe vazio para ocultar o YouTube.' },
        { ...field('googleBusinessUrl','Google Meu Negócio — URL','url','Redes sociais'), note:'Pode apontar para o perfil ou diretamente para a página de avaliações.' },
        { ...field('linkedinUrl','LinkedIn — URL do perfil','url','Redes sociais'), note:'Deixe vazio para ocultar o LinkedIn.' },
        { ...field('additionalSocials','Outras redes: Nome | URL do ícone | URL do perfil','textarea','Outras redes'), rows:8, note:'Adicione uma rede por linha. Exemplo: Pinterest | https://site.com/icone.svg | https://pinterest.com/seuperfil' },
        field('socialStyle','Estilo dos ícones','select','Aparência',[
          { label:'Fundo sólido', value:'solid' },
          { label:'Contorno', value:'outline' },
          { label:'Minimalista', value:'minimal' }
        ]),
        field('socialLabels','Exibição dos nomes','select','Aparência',[
          { label:'Somente ícones', value:'icons' },
          { label:'Ícone + nome', value:'show' }
        ]),
        { key:'socialIconSize', label:'Tamanho dos ícones (px)', type:'range', min:32, max:64, step:2, group:'Aparência' },
        field('socialOpenNewTab','Abrir canais em nova aba','toggle','Aparência'),
        field('disclaimer','Aviso legal','textarea','Legal')
      ],
      render: (p,s,id)=>`<footer class="site-footer section-shell" data-section-id="${id}" data-plugin="footer"><div class="site-container"><div class="footer-brand"><strong>${esc(p.brand)}</strong><span>${esc(p.role)}</span></div><div class="footer-contact"><span>${esc(p.phone)}</span><span>${esc(p.email)}</span><span>${esc(p.license)}</span></div>${footerSocialMarkup(p)}${(p.professionalDescription || s.seo?.authorName) ? `<div class="footer-trust" aria-label="Responsabilidade editorial"><strong>Responsável pelas informações</strong><span>${esc(p.professionalDescription || `${s.seo?.authorName || ''}${s.seo?.authorRole ? ` — ${s.seo.authorRole}` : ''}`)}</span>${s.seo?.lastReviewed ? `<span>Revisado em ${esc(s.seo.lastReviewed)}</span>` : ''}${s.seo?.sourceNotes ? `<span>Fontes: ${esc(s.seo.sourceNotes)}</span>` : ''}</div>` : ''}<p>${esc(p.disclaimer)}</p><small>© ${new Date().getFullYear()} ${esc(p.brand)}. Todos os direitos reservados.</small></div></footer>`
    },
    reveal: { name:'Revelação no scroll', icon:'↥', category:'Efeito', description:'Entrada suave e acessível', kind:'behavior', cssPath:'plugins/reveal/plugin.css', jsPath:'plugins/reveal/plugin.js', manifestPath:'plugins/reveal/plugin.json', defaults:{}, fields:[] },
    lightbox: { name:'Lightbox de galeria', icon:'⛶', category:'Efeito', description:'Ampliação das imagens', kind:'behavior', cssPath:'plugins/lightbox/plugin.css', jsPath:'plugins/lightbox/plugin.js', manifestPath:'plugins/lightbox/plugin.json', defaults:{}, fields:[] }
  };

  // Componentes internos anteriores ao sistema de segmentos continuam sendo
  // seções de largura integral. Pacotes Plugin Play legados recebem "both" no
  // loader para não perder compatibilidade quando ainda não declaram o papel.
  Object.values(plugins).forEach((plugin) => {
    if (plugin.kind === 'section' && !plugin.compositionRole) plugin.compositionRole = 'section';
  });

  const compositionRole = (plugin) => {
    if (!plugin || plugin.kind !== 'section') return 'behavior';
    const role = plugin.compositionRole || plugin.manifest?.composition?.role;
    return ['section', 'item', 'both'].includes(role) ? role : 'both';
  };

  const visualDefaults = {
    headingColor:'#101318', bodyColor:'#30383d', mutedColor:'#6b747b', inverseHeadingColor:'#ffffff', inverseBodyColor:'#dbe1e5', actionButtonBackground:'#d7ff3f', actionButtonText:'#101318',
    headingWeight:700, headingLineHeight:1.05, headingTracking:-0.04, bodySize:16, bodyLineHeight:1.6, bodyTracking:0, paragraphIndent:0, paragraphSpacing:0,
    h1Size:107, h2Size:77, h3Size:25, containerWidth:1180, sectionSpace:144, contentGap:56, elementGap:20, componentPadding:36,
    paletteTechnique:'manual', typographyProfile:'conversion', contrastMode:'aa', textEffect:'auto', textEffectStrength:72, textMeasure:66, eyebrowTracking:0.12,
    titleOutlineWidth:0.65, titleOutlineColor:'#000000', titleShadowStyle:'contrast', titleShadowColor:'#000000', titleShadowStrength:72,
    subtitleOutlineWidth:0.22, subtitleOutlineColor:'#000000', subtitleShadowStyle:'contrast', subtitleShadowColor:'#000000', subtitleShadowStrength:52,
    actionButtonKit:'custom', actionButtonEffect:'depth', actionButtonClickEffect:'press', actionButtonDepth:6, actionButtonGlow:32, actionButtonGlassOpacity:28, actionButtonGlassBlur:14, actionButtonShine:38, actionButtonBorderWidth:1, actionButtonHoverScale:100, actionButtonSpeed:180
  };

  /* 5.0.1.19 — Button Kit: presets opticos reutilizaveis por qualquer CTA sem
     alterar texto, href, dimensoes ou mecanica interna do plugin. */
  const buttonKits = {
    solidPremium:{ name:'Sólido Premium', description:'Limpo, firme e com microelevação.', settings:{ actionButtonEffect:'flat', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:0, actionButtonGlassOpacity:100, actionButtonGlassBlur:0, actionButtonShine:28, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:180 } },
    softShadow:{ name:'Soft Shadow', description:'Sombra difusa e movimento discreto.', settings:{ actionButtonEffect:'soft-shadow', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:0, actionButtonShine:24, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:200 } },
    depth3d:{ name:'3D Profundidade', description:'Volume físico e pressão no clique.', settings:{ actionButtonEffect:'depth', actionButtonClickEffect:'press', actionButtonDepth:7, actionButtonGlow:0, actionButtonShine:34, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:170 } },
    depthGlow:{ name:'3D + Glow', description:'Profundidade com halo para CTA principal.', settings:{ actionButtonEffect:'depth-glow', actionButtonClickEffect:'press', actionButtonDepth:6, actionButtonGlow:38, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:180 } },
    glass:{ name:'Glass', description:'Vidro translúcido com blur e borda luminosa.', settings:{ actionButtonEffect:'glass', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:18, actionButtonGlassOpacity:30, actionButtonGlassBlur:16, actionButtonShine:58, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:220 } },
    liquidGlass:{ name:'Liquid Glass', description:'Vidro mais espesso, brilho interno e profundidade.', settings:{ actionButtonEffect:'liquid-glass', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:26, actionButtonGlassOpacity:24, actionButtonGlassBlur:22, actionButtonShine:78, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:240 } },
    glow:{ name:'Glow', description:'Halo luminoso crescente no hover.', settings:{ actionButtonEffect:'glow', actionButtonClickEffect:'flash', actionButtonDepth:0, actionButtonGlow:58, actionButtonShine:38, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:180 } },
    shine:{ name:'Shine Sweep', description:'Reflexo diagonal atravessando o CTA.', settings:{ actionButtonEffect:'shine', actionButtonClickEffect:'press', actionButtonDepth:1, actionButtonGlow:12, actionButtonShine:78, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:420 } },
    gradient:{ name:'Gradient Flow', description:'Gradiente de marca com movimento suave.', settings:{ actionButtonEffect:'gradient', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:16, actionButtonShine:36, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:350 } },
    pulse:{ name:'Pulse CTA', description:'Pulsação sutil para chamada prioritária.', settings:{ actionButtonEffect:'pulse', actionButtonClickEffect:'press', actionButtonDepth:1, actionButtonGlow:34, actionButtonShine:34, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:190 } },
    borderReveal:{ name:'Border Reveal', description:'Borda de destaque surge no hover.', settings:{ actionButtonEffect:'border-reveal', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:8, actionButtonShine:24, actionButtonBorderWidth:2, actionButtonHoverScale:101, actionButtonSpeed:240 } },
    fillSlide:{ name:'Fill Slide', description:'Cor de destaque desliza pelo fundo.', settings:{ actionButtonEffect:'fill-slide', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:12, actionButtonShine:28, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:320 } },
    magnetic:{ name:'Magnetic Hover', description:'CTA acompanha levemente o ponteiro.', settings:{ actionButtonEffect:'magnetic', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:18, actionButtonShine:32, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:140 } },
    scalePop:{ name:'Scale Pop', description:'Expansão rápida com profundidade no hover.', settings:{ actionButtonEffect:'scale-pop', actionButtonClickEffect:'bounce', actionButtonDepth:2, actionButtonGlow:14, actionButtonShine:30, actionButtonBorderWidth:1, actionButtonHoverScale:108, actionButtonSpeed:160 } },
    ripple:{ name:'Ripple Click', description:'Onda circular a partir do ponto do clique.', settings:{ actionButtonEffect:'ripple', actionButtonClickEffect:'ripple', actionButtonDepth:1, actionButtonGlow:8, actionButtonShine:26, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:180 } },
    neon:{ name:'Neon Edge', description:'Contorno elétrico com halo externo.', settings:{ actionButtonEffect:'neon', actionButtonClickEffect:'flash', actionButtonDepth:0, actionButtonGlow:72, actionButtonShine:36, actionButtonBorderWidth:2, actionButtonHoverScale:102, actionButtonSpeed:200 } },
    minimalOutline:{ name:'Clean Outline', category:'Clean', description:'Linha fina e sensação de leveza.', settings:{ actionButtonEffect:'outline-minimal', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:220 } },
    minimalGhost:{ name:'Ghost Minimal', category:'Clean', description:'Sem preenchimento, só tipografia e contorno discreto.', settings:{ actionButtonEffect:'ghost-minimal', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:220 } },
    underlineEditorial:{ name:'Editorial Underline', category:'Elegante', description:'Substitui volume por detalhe linear.', settings:{ actionButtonEffect:'underline-editorial', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:0, actionButtonHoverScale:101, actionButtonSpeed:230 } },
    quietLuxury:{ name:'Quiet Luxury', category:'Elegante', description:'Acabamento acetinado e sombra refinada.', settings:{ actionButtonEffect:'satin-luxury', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:12, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:230 } },
    metallicGold:{ name:'Metal Dourado', category:'Mecânico', description:'Reflexos de metal escovado.', settings:{ actionButtonEffect:'metal-gold', actionButtonClickEffect:'press', actionButtonDepth:3, actionButtonGlow:18, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:240 } },
    machinedSteel:{ name:'Aço Usinado', category:'Mecânico', description:'Superfície metálica industrial com relevo.', settings:{ actionButtonEffect:'machined-steel', actionButtonClickEffect:'press', actionButtonDepth:5, actionButtonGlow:10, actionButtonShine:42, actionButtonBorderWidth:2, actionButtonHoverScale:101, actionButtonSpeed:170 } },
    industrialPlate:{ name:'Placa Industrial', category:'Mecânico', description:'Chapa em alto relevo com vincos de luz.', settings:{ actionButtonEffect:'industrial-plate', actionButtonClickEffect:'press', actionButtonDepth:8, actionButtonGlow:6, actionButtonShine:42, actionButtonBorderWidth:2, actionButtonHoverScale:100, actionButtonSpeed:130 } },
    carbonFiber:{ name:'Fibra de Carbono', category:'Mecânico', description:'Trama de carbono e reflexo tecnológico.', settings:{ actionButtonEffect:'carbon-fiber', actionButtonClickEffect:'press', actionButtonDepth:4, actionButtonGlow:8, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:180 } },
    embossed:{ name:'Relevo Emboss', category:'Mecânico', description:'Volume sutil de peça prensada.', settings:{ actionButtonEffect:'embossed', actionButtonClickEffect:'press', actionButtonDepth:3, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:200 } },
    claySoft:{ name:'Clay 3D', category:'Lúdico', description:'Volume macio com luz e sombra.', settings:{ actionButtonEffect:'clay', actionButtonClickEffect:'bounce', actionButtonDepth:4, actionButtonGlow:12, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:105, actionButtonSpeed:230 } },
    bubbleCandy:{ name:'Bubble Candy', category:'Lúdico', description:'Plástico colorido e brilho suave.', settings:{ actionButtonEffect:'bubble', actionButtonClickEffect:'bounce', actionButtonDepth:3, actionButtonGlow:22, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:108, actionButtonSpeed:230 } },
    jelly:{ name:'Jelly Gel', category:'Lúdico', description:'Gel translúcido e profundidade vibrante.', settings:{ actionButtonEffect:'jelly', actionButtonClickEffect:'bounce', actionButtonDepth:3, actionButtonGlow:26, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:106, actionButtonSpeed:280 } },
    sticker:{ name:'Sticker Pop', category:'Lúdico', description:'Adesivo ilustrado com contorno marcado.', settings:{ actionButtonEffect:'sticker', actionButtonClickEffect:'bounce', actionButtonDepth:4, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:3, actionButtonHoverScale:108, actionButtonSpeed:160 } },
    comic:{ name:'Comic Impact', category:'Lúdico', description:'Sombra deslocada e borda expressiva.', settings:{ actionButtonEffect:'comic', actionButtonClickEffect:'bounce', actionButtonDepth:6, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:3, actionButtonHoverScale:107, actionButtonSpeed:140 } },
    softNeumorph:{ name:'Neumorphism', category:'Moderno', description:'Relevo suave, contemporâneo e discreto.', settings:{ actionButtonEffect:'neumorph', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:250 } },
    aurora:{ name:'Aurora Gradient', category:'Moderno', description:'Gradiente luminoso com atmosfera digital.', settings:{ actionButtonEffect:'aurora', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:35, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:370 } },
    holographic:{ name:'Holográfico', category:'Moderno', description:'Interferência de cores e vidro tecnológico.', settings:{ actionButtonEffect:'holographic', actionButtonClickEffect:'flash', actionButtonDepth:0, actionButtonGlow:32, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:320 } },
    cyberCircuit:{ name:'Cyber Circuit', category:'Moderno', description:'Contorno energético e iluminação de circuito.', settings:{ actionButtonEffect:'cyber', actionButtonClickEffect:'flash', actionButtonDepth:0, actionButtonGlow:60, actionButtonShine:42, actionButtonBorderWidth:2, actionButtonHoverScale:102, actionButtonSpeed:200 } },
    spotlight:{ name:'Spotlight', category:'Moderno', description:'Foco luminoso direcional sobre a superfície.', settings:{ actionButtonEffect:'spotlight', actionButtonClickEffect:'press', actionButtonDepth:0, actionButtonGlow:24, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:260 } },
    brutalist:{ name:'Brutalista', category:'Moderno', description:'Geometria crua e contraste rígido.', settings:{ actionButtonEffect:'brutalist', actionButtonClickEffect:'press', actionButtonDepth:7, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:3, actionButtonHoverScale:100, actionButtonSpeed:130 } },
    paperCut:{ name:'Papel Recortado', category:'Criativo', description:'Camadas de papel com sombras secas.', settings:{ actionButtonEffect:'paper-cut', actionButtonClickEffect:'press', actionButtonDepth:4, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:220 } },
    retroPixel:{ name:'Pixel Retrô', category:'Criativo', description:'Bordas e sombras retas de interface retrô.', settings:{ actionButtonEffect:'pixel', actionButtonClickEffect:'press', actionButtonDepth:5, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:2, actionButtonHoverScale:100, actionButtonSpeed:110 } },
    ceramic:{ name:'Cerâmica', category:'Orgânico', description:'Esmalte artesanal com iluminação suave.', settings:{ actionButtonEffect:'ceramic', actionButtonClickEffect:'press', actionButtonDepth:1, actionButtonGlow:8, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:250 } },
    wood:{ name:'Madeira', category:'Orgânico', description:'Veios sutis e acabamento natural.', settings:{ actionButtonEffect:'wood', actionButtonClickEffect:'press', actionButtonDepth:3, actionButtonGlow:0, actionButtonShine:42, actionButtonBorderWidth:1, actionButtonHoverScale:101, actionButtonSpeed:260 } }
  };

  Object.assign(buttonKits, {
    magnetPro:{ name:'Magnetic Orbit', category:'Interativo', description:'Atrai o CTA em direção ao cursor com mais amplitude.', settings:{ actionButtonEffect:'magnet-orbit', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:125, actionButtonSpeed:150 } },
    tiltCard:{ name:'Tilt 3D', category:'Interativo', description:'Inclinação tridimensional seguindo o cursor.', settings:{ actionButtonEffect:'tilt-3d', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:105, actionButtonSpeed:220 } },
    cursorHalo:{ name:'Cursor Halo', category:'Interativo', description:'Luz circular rastreia o ponteiro.', settings:{ actionButtonEffect:'cursor-halo', actionButtonClickEffect:'flash', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:160 } },
    liquidFollow:{ name:'Liquid Follow', category:'Lúdico', description:'Gradiente líquido reativo à posição do cursor.', settings:{ actionButtonEffect:'liquid-follow', actionButtonClickEffect:'bounce', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:105, actionButtonSpeed:230 } },
    rubberWobble:{ name:'Rubber Wobble', category:'Lúdico', description:'Botão elástico oscila e retorna.', settings:{ actionButtonEffect:'rubber-wobble', actionButtonClickEffect:'bounce', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:107, actionButtonSpeed:340 } },
    splitCurtain:{ name:'Split Curtain', category:'Surpresa', description:'Cortina luminosa abre a partir do centro.', settings:{ actionButtonEffect:'split-curtain', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:103, actionButtonSpeed:350 } },
    glitchShift:{ name:'Glitch Shift', category:'Digital', description:'Fragmentação digital breve no hover.', settings:{ actionButtonEffect:'glitch-shift', actionButtonClickEffect:'flash', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:170 } },
    orbitRing:{ name:'Orbit Ring', category:'Digital', description:'Anel orbital percorre a borda do CTA.', settings:{ actionButtonEffect:'orbit-ring', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:104, actionButtonSpeed:360 } },
    neonTrace:{ name:'Neon Trace', category:'Digital', description:'Contorno animado em rotação suave.', settings:{ actionButtonEffect:'neon-trace', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:102, actionButtonSpeed:310 } },
    liftGravity:{ name:'Gravity Lift', category:'Interativo', description:'Elevação forte com sombra física.', settings:{ actionButtonEffect:'gravity-lift', actionButtonClickEffect:'bounce', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:107, actionButtonSpeed:260 } },
    flipReveal:{ name:'Flip Reveal', category:'Surpresa', description:'Flip em 3D sem esconder o texto da ação.', settings:{ actionButtonEffect:'flip-reveal', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:104, actionButtonSpeed:420 } },
    shimmerNoise:{ name:'Prism Shimmer', category:'Surpresa', description:'Refração de luz e deslocamento cromático.', settings:{ actionButtonEffect:'prism-shimmer', actionButtonClickEffect:'flash', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:104, actionButtonSpeed:280 } },
    heartbeat:{ name:'Heartbeat', category:'Lúdico', description:'Duas pulsações suaves para atrair atenção.', settings:{ actionButtonEffect:'heartbeat', actionButtonClickEffect:'press', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:104, actionButtonSpeed:340 } },
    springPop:{ name:'Spring Pop', category:'Lúdico', description:'Salto com retorno amortecido.', settings:{ actionButtonEffect:'spring-pop', actionButtonClickEffect:'bounce', actionButtonDepth:2, actionButtonGlow:22, actionButtonShine:48, actionButtonBorderWidth:1, actionButtonHoverScale:109, actionButtonSpeed:330 } }
  });


  Object.assign(buttonKits,{
    kineticOutline:{ name:'Kinetic Outline',category:'Clean',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'kinetic-outline',actionButtonClickEffect:'rings',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    satinReveal:{ name:'Satin Reveal',category:'Elegante',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'satin-reveal',actionButtonClickEffect:'glow-burst',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    industrialImpact:{ name:'Industrial Impact',category:'Mecânico',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'industrial-impact',actionButtonClickEffect:'shake',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    liquidJelly:{ name:'Liquid Jelly',category:'Lúdico',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'liquid-jelly',actionButtonClickEffect:'jelly',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    cyberPixel:{ name:'Cyber Pixel',category:'Digital',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'cyber-pixel',actionButtonClickEffect:'pixel-burst',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    neonExplosion:{ name:'Neon Explosion',category:'Digital',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'neon-explosion',actionButtonClickEffect:'glow-burst',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    editorialStamp:{ name:'Editorial Stamp',category:'Editorial',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'editorial-stamp',actionButtonClickEffect:'stamp',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    mechanicalSwitch:{ name:'Mechanical Switch',category:'Mecânico',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'mechanical-switch',actionButtonClickEffect:'stamp',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    auroraSpark:{ name:'Aurora Spark',category:'Moderno',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'aurora-spark',actionButtonClickEffect:'sparks',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    glassPrism:{ name:'Glass Prism',category:'Premium',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'glass-prism',actionButtonClickEffect:'shockwave',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    magnetShock:{ name:'Magnet Shock',category:'Interativo',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'magnet-shock',actionButtonClickEffect:'shockwave',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } },
    playfulConfetti:{ name:'Playful Confetti',category:'Lúdico',description:'Modelo interativo com resposta visual ao clique.',settings:{ actionButtonEffect:'playful-confetti',actionButtonClickEffect:'confetti',actionButtonDepth:3,actionButtonGlow:24,actionButtonShine:46,actionButtonBorderWidth:1,actionButtonHoverScale:105,actionButtonSpeed:240 } }
  });

  const presets = {
    premium: { ...visualDefaults, paletteTechnique:'complementary', typographyProfile:'editorial', titleShadowStyle:'cinematic', titleOutlineWidth:0.45, actionButtonEffect:'depth-glow', actionButtonDepth:5, actionButtonGlow:24, actionButtonBackground:'#c8a96b', actionButtonText:'#10100e', name:'Premium Noite', description:'Elegante, editorial e de alto contraste.', primary:'#c8a96b', accent:'#e7d3a5', surface:'#f7f4ed', ink:'#171713', dark:'#10100e', headingColor:'#171713', bodyColor:'#3c3a32', mutedColor:'#736f63', headingFont:'Playfair Display', bodyFont:'Inter', radius:6, swatch:'linear-gradient(135deg,#10100e 0 58%,#c8a96b 58%)' },
    urban: { ...visualDefaults, paletteTechnique:'triadic', typographyProfile:'conversion', actionButtonEffect:'depth-glow', actionButtonDepth:6, actionButtonGlow:28, actionButtonBackground:'#d7ff3f', actionButtonText:'#101318', name:'Urbano Limão', description:'Atual, energético e orientado a conversão.', primary:'#d7ff3f', accent:'#7ca1ff', surface:'#f5f7f8', ink:'#101318', dark:'#0e1218', headingColor:'#101318', bodyColor:'#30383d', mutedColor:'#6b747b', headingFont:'Manrope', bodyFont:'DM Sans', radius:14, swatch:'linear-gradient(135deg,#101318 0 58%,#d7ff3f 58%)' },
    nature: { ...visualDefaults, paletteTechnique:'analogous', typographyProfile:'humanist', actionButtonBackground:'#356b55', actionButtonText:'#ffffff', name:'Natural', description:'Acolhedor, orgânico e familiar.', primary:'#356b55', accent:'#d9a965', surface:'#f5f0e7', ink:'#1e2b25', dark:'#18362a', headingColor:'#1e2b25', bodyColor:'#3d4d45', mutedColor:'#748178', headingFont:'DM Sans', bodyFont:'Inter', radius:22, swatch:'linear-gradient(135deg,#18362a 0 58%,#d9a965 58%)' },
    coastal: { ...visualDefaults, paletteTechnique:'complementary', typographyProfile:'airy', actionButtonBackground:'#176b87', actionButtonText:'#ffffff', name:'Litoral', description:'Claro, arejado e sofisticado.', primary:'#176b87', accent:'#e4a861', surface:'#f4fafb', ink:'#12303b', dark:'#0d3b4b', headingColor:'#12303b', bodyColor:'#36545f', mutedColor:'#6f8992', headingFont:'Josefin Sans', bodyFont:'Source Sans 3', radius:10, swatch:'linear-gradient(135deg,#176b87 0 58%,#e4a861 58%)' },
    whiteEssential: { ...visualDefaults, paletteTechnique:'monochromatic', typographyProfile:'conversion', contrastMode:'comfort', textEffect:'auto', textEffectStrength:78, titleOutlineWidth:0.25, titleShadowStyle:'soft', titleShadowStrength:34, subtitleOutlineWidth:0, subtitleShadowStyle:'none', actionButtonEffect:'depth', actionButtonDepth:4, actionButtonGlow:0, actionButtonShine:22, name:'Branco Essencial', description:'Branco dominante, preto profundo e hierarquia limpa de alto contraste.', primary:'#111318', accent:'#69717b', surface:'#ffffff', ink:'#111318', dark:'#111318', headingColor:'#111318', bodyColor:'#2d333a', mutedColor:'#59616b', inverseHeadingColor:'#ffffff', inverseBodyColor:'#eef1f4', actionButtonBackground:'#111318', actionButtonText:'#ffffff', headingFont:'Manrope', bodyFont:'Inter', headingWeight:800, headingTracking:-0.035, h1Size:98, h2Size:66, bodySize:17, bodyLineHeight:1.64, radius:10, swatch:'linear-gradient(135deg,#ffffff 0 58%,#eceff2 58% 78%,#111318 78%)' },

    popularBlue: { ...visualDefaults, paletteTechnique:'60-30-10', typographyProfile:'popular', titleOutlineWidth:0.75, titleShadowStyle:'contrast', actionButtonEffect:'depth-glow', actionButtonDepth:6, actionButtonGlow:36, name:'Casa Própria Azul', description:'Confiança, clareza e leitura rápida para produto popular.', primary:'#1469d8', accent:'#ffb020', surface:'#f6f9fd', ink:'#132033', dark:'#0b2548', headingColor:'#132033', bodyColor:'#33445c', mutedColor:'#6b7b90', actionButtonBackground:'#1469d8', actionButtonText:'#ffffff', headingFont:'Montserrat', bodyFont:'Inter', headingWeight:800, headingTracking:-0.035, h1Size:96, h2Size:64, bodySize:17, bodyLineHeight:1.62, radius:14, swatch:'linear-gradient(135deg,#0b2548 0 58%,#1469d8 58% 82%,#ffb020 82%)' },
    popularGreen: { ...visualDefaults, paletteTechnique:'analogous', typographyProfile:'humanist', name:'Família Verde', description:'Acolhimento, segurança e sensação de estabilidade.', primary:'#187a55', accent:'#e5aa35', surface:'#f7faf5', ink:'#173329', dark:'#0e3b2d', headingColor:'#173329', bodyColor:'#38554a', mutedColor:'#70857b', actionButtonBackground:'#187a55', actionButtonText:'#ffffff', headingFont:'DM Sans', bodyFont:'Source Sans 3', headingWeight:700, h1Size:92, h2Size:62, bodySize:17, radius:18, swatch:'linear-gradient(135deg,#0e3b2d 0 58%,#187a55 58% 82%,#e5aa35 82%)' },
    popularSolar: { ...visualDefaults, paletteTechnique:'complementary', typographyProfile:'conversion', titleOutlineWidth:0.7, actionButtonEffect:'glow', actionButtonGlow:46, actionButtonShine:44, name:'Chave Solar', description:'Popular, positivo e direto sem aparência de promoção barata.', primary:'#f0a51a', accent:'#1857a7', surface:'#fffaf0', ink:'#282216', dark:'#14243a', headingColor:'#282216', bodyColor:'#4e4738', mutedColor:'#807766', actionButtonBackground:'#f0a51a', actionButtonText:'#201a0f', headingFont:'Manrope', bodyFont:'Inter', headingWeight:800, h1Size:98, h2Size:66, radius:12, swatch:'linear-gradient(135deg,#14243a 0 58%,#f0a51a 58% 82%,#1857a7 82%)' },
    patioTerracotta: { ...visualDefaults, paletteTechnique:'analogous', typographyProfile:'humanist', name:'Casa + Pátio', description:'Terra, lar e espaço próprio com apelo mais humano.', primary:'#b65332', accent:'#e3a94a', surface:'#fbf6f1', ink:'#30241f', dark:'#3b2119', headingColor:'#30241f', bodyColor:'#57463e', mutedColor:'#897970', actionButtonBackground:'#b65332', actionButtonText:'#ffffff', headingFont:'DM Sans', bodyFont:'Inter', headingWeight:800, h1Size:94, h2Size:64, bodySize:17, radius:16, swatch:'linear-gradient(135deg,#3b2119 0 58%,#b65332 58% 82%,#e3a94a 82%)' },
    trustNavy: { ...visualDefaults, paletteTechnique:'60-30-10', typographyProfile:'popular', name:'Confiança Popular', description:'Visual bancário/imobiliário com contraste e credibilidade.', primary:'#2259a8', accent:'#2fa66f', surface:'#f5f8fc', ink:'#17263d', dark:'#0d2242', headingColor:'#17263d', bodyColor:'#3c4d64', mutedColor:'#748198', actionButtonBackground:'#2259a8', actionButtonText:'#ffffff', headingFont:'Montserrat', bodyFont:'Source Sans 3', headingWeight:800, h1Size:92, h2Size:62, radius:10, swatch:'linear-gradient(135deg,#0d2242 0 58%,#2259a8 58% 82%,#2fa66f 82%)' },
    cleanCoral: { ...visualDefaults, paletteTechnique:'complementary', typographyProfile:'conversion', name:'Popular Coral', description:'Mais calor humano com CTA destacado e leitura simples.', primary:'#e85d45', accent:'#176f78', surface:'#fff7f4', ink:'#2d2422', dark:'#253638', headingColor:'#2d2422', bodyColor:'#584b48', mutedColor:'#8c7b77', actionButtonBackground:'#e85d45', actionButtonText:'#ffffff', headingFont:'Manrope', bodyFont:'Inter', headingWeight:800, h1Size:94, h2Size:64, radius:14, swatch:'linear-gradient(135deg,#253638 0 58%,#e85d45 58% 82%,#176f78 82%)' }
  };

  // Perfis de cor adicionais — preservam os presets anteriores e os controles globais.
  Object.assign(presets, {
    obsidianGold: { ...visualDefaults, name:"Obsidiana & Ouro", description:"Luxo noturno e alto padrão", paletteTechnique:"complementary", typographyProfile:"conversion", primary:"#bda16a", accent:"#e7d9b5", surface:"#faf8f3", ink:"#201e1a", dark:"#101216", headingColor:"#201e1a", bodyColor:"#201e1a", mutedColor:"#e7d9b5", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#bda16a", actionButtonText:"#ffffff", headingFont:"Playfair Display", bodyFont:"Inter", radius:8, swatch:"linear-gradient(135deg,#101216 0 46%,#bda16a 46% 77%,#e7d9b5 77%)" },
    champagne: { ...visualDefaults, name:"Champagne Editorial", description:"Clássico leve e sofisticado", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#ad8650", accent:"#6b796f", surface:"#fffaf2", ink:"#332c25", dark:"#302820", headingColor:"#332c25", bodyColor:"#332c25", mutedColor:"#6b796f", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#ad8650", actionButtonText:"#ffffff", headingFont:"Cormorant Garamond", bodyFont:"Inter", radius:8, swatch:"linear-gradient(135deg,#302820 0 46%,#ad8650 46% 77%,#6b796f 77%)" },
    stone: { ...visualDefaults, name:"Pedra & Concreto", description:"Arquitetura minimalista e tons minerais", paletteTechnique:"monochromatic", typographyProfile:"conversion", primary:"#687478", accent:"#b5a390", surface:"#f5f5f2", ink:"#22292b", dark:"#242b2f", headingColor:"#22292b", bodyColor:"#22292b", mutedColor:"#b5a390", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#687478", actionButtonText:"#ffffff", headingFont:"Manrope", bodyFont:"Inter", radius:4, swatch:"linear-gradient(135deg,#242b2f 0 46%,#687478 46% 77%,#b5a390 77%)" },
    terracotta: { ...visualDefaults, name:"Terracota Contemporânea", description:"Calor, autenticidade e design natural", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#ae5941", accent:"#78866a", surface:"#fff8f1", ink:"#372c28", dark:"#57372d", headingColor:"#372c28", bodyColor:"#372c28", mutedColor:"#78866a", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#ae5941", actionButtonText:"#ffffff", headingFont:"Outfit", bodyFont:"DM Sans", radius:14, swatch:"linear-gradient(135deg,#57372d 0 46%,#ae5941 46% 77%,#78866a 77%)" },
    olive: { ...visualDefaults, name:"Oliva Mediterrânea", description:"Paisagismo, natureza e luxo tranquilo", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#66734d", accent:"#c2a16b", surface:"#faf8ee", ink:"#2a3024", dark:"#2d3929", headingColor:"#2a3024", bodyColor:"#2a3024", mutedColor:"#c2a16b", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#66734d", actionButtonText:"#ffffff", headingFont:"Lora", bodyFont:"Inter", radius:14, swatch:"linear-gradient(135deg,#2d3929 0 46%,#66734d 46% 77%,#c2a16b 77%)" },
    forest: { ...visualDefaults, name:"Floresta Profunda", description:"Sustentabilidade e empreendimentos verdes", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#23634c", accent:"#d9b573", surface:"#f5f8f2", ink:"#183a2d", dark:"#0b3027", headingColor:"#183a2d", bodyColor:"#183a2d", mutedColor:"#d9b573", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#23634c", actionButtonText:"#ffffff", headingFont:"Manrope", bodyFont:"DM Sans", radius:16, swatch:"linear-gradient(135deg,#0b3027 0 46%,#23634c 46% 77%,#d9b573 77%)" },
    marine: { ...visualDefaults, name:"Marina Atlântica", description:"Projetos náuticos, marinas e condomínios costeiros", paletteTechnique:"complementary", typographyProfile:"conversion", primary:"#076c8b", accent:"#d9b87a", surface:"#f4fafc", ink:"#173846", dark:"#082c41", headingColor:"#173846", bodyColor:"#173846", mutedColor:"#d9b87a", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#076c8b", actionButtonText:"#ffffff", headingFont:"Outfit", bodyFont:"Source Sans 3", radius:12, swatch:"linear-gradient(135deg,#082c41 0 46%,#076c8b 46% 77%,#d9b87a 77%)" },
    lagoon: { ...visualDefaults, name:"Lagoa Turquesa", description:"Água, lazer e lifestyle de verão", paletteTechnique:"complementary", typographyProfile:"conversion", primary:"#008d91", accent:"#ffbd75", surface:"#f3fcfa", ink:"#173c40", dark:"#123d46", headingColor:"#173c40", bodyColor:"#173c40", mutedColor:"#ffbd75", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#008d91", actionButtonText:"#ffffff", headingFont:"Sora", bodyFont:"Inter", radius:18, swatch:"linear-gradient(135deg,#123d46 0 46%,#008d91 46% 77%,#ffbd75 77%)" },
    midnightBlue: { ...visualDefaults, name:"Azul Meia-Noite", description:"Institucional premium e credibilidade", paletteTechnique:"60-30-10", typographyProfile:"conversion", primary:"#385d9b", accent:"#d4a96e", surface:"#f7f9fc", ink:"#1f2c42", dark:"#111f3b", headingColor:"#1f2c42", bodyColor:"#1f2c42", mutedColor:"#d4a96e", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#385d9b", actionButtonText:"#ffffff", headingFont:"Manrope", bodyFont:"Inter", radius:10, swatch:"linear-gradient(135deg,#111f3b 0 46%,#385d9b 46% 77%,#d4a96e 77%)" },
    corporate: { ...visualDefaults, name:"Azul Corporativo", description:"Negócios, serviços e confiança profissional", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#2266b0", accent:"#42bfa9", surface:"#f6f9fd", ink:"#172c40", dark:"#103454", headingColor:"#172c40", bodyColor:"#172c40", mutedColor:"#42bfa9", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#2266b0", actionButtonText:"#ffffff", headingFont:"Montserrat", bodyFont:"Inter", radius:10, swatch:"linear-gradient(135deg,#103454 0 46%,#2266b0 46% 77%,#42bfa9 77%)" },
    techPurple: { ...visualDefaults, name:"Violeta Digital", description:"Tecnologia, inovação e experiências digitais", paletteTechnique:"triadic", typographyProfile:"conversion", primary:"#7452d6", accent:"#29d3c2", surface:"#f9f7fe", ink:"#27203e", dark:"#211938", headingColor:"#27203e", bodyColor:"#27203e", mutedColor:"#29d3c2", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#7452d6", actionButtonText:"#ffffff", headingFont:"Sora", bodyFont:"Inter", radius:14, swatch:"linear-gradient(135deg,#211938 0 46%,#7452d6 46% 77%,#29d3c2 77%)" },
    cyber: { ...visualDefaults, name:"Cyber Neon", description:"Contraste intenso e campanhas arrojadas", paletteTechnique:"complementary", typographyProfile:"conversion", primary:"#b8f52e", accent:"#00dcce", surface:"#f7fbf4", ink:"#19221c", dark:"#101518", headingColor:"#19221c", bodyColor:"#19221c", mutedColor:"#00dcce", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#b8f52e", actionButtonText:"#101518", headingFont:"Outfit", bodyFont:"Inter", radius:8, swatch:"linear-gradient(135deg,#101518 0 46%,#b8f52e 46% 77%,#00dcce 77%)" },
    blush: { ...visualDefaults, name:"Rosé & Areia", description:"Delicadeza editorial e atmosfera acolhedora", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#b96f7b", accent:"#c4a77a", surface:"#fff8f8", ink:"#443138", dark:"#432d35", headingColor:"#443138", bodyColor:"#443138", mutedColor:"#c4a77a", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#b96f7b", actionButtonText:"#ffffff", headingFont:"Playfair Display", bodyFont:"DM Sans", radius:18, swatch:"linear-gradient(135deg,#432d35 0 46%,#b96f7b 46% 77%,#c4a77a 77%)" },
    lavender: { ...visualDefaults, name:"Lavanda Suave", description:"Bem-estar, delicadeza e serviços pessoais", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#8466b1", accent:"#e1aeac", surface:"#fcfaff", ink:"#373145", dark:"#44375a", headingColor:"#373145", bodyColor:"#373145", mutedColor:"#e1aeac", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#8466b1", actionButtonText:"#ffffff", headingFont:"DM Sans", bodyFont:"Inter", radius:20, swatch:"linear-gradient(135deg,#44375a 0 46%,#8466b1 46% 77%,#e1aeac 77%)" },
    sunset: { ...visualDefaults, name:"Pôr do Sol", description:"Energia, campanhas e empreendimentos turísticos", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#e36b43", accent:"#efb344", surface:"#fff9f1", ink:"#493127", dark:"#522e28", headingColor:"#493127", bodyColor:"#493127", mutedColor:"#efb344", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#e36b43", actionButtonText:"#ffffff", headingFont:"Outfit", bodyFont:"Inter", radius:18, swatch:"linear-gradient(135deg,#522e28 0 46%,#e36b43 46% 77%,#efb344 77%)" },
    amber: { ...visualDefaults, name:"Âmbar Industrial", description:"Estética mecânica, vigor e personalidade", paletteTechnique:"complementary", typographyProfile:"conversion", primary:"#d18a25", accent:"#73838a", surface:"#faf8f2", ink:"#332c21", dark:"#252a2d", headingColor:"#332c21", bodyColor:"#332c21", mutedColor:"#73838a", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#d18a25", actionButtonText:"#ffffff", headingFont:"Rajdhani", bodyFont:"Inter", radius:8, swatch:"linear-gradient(135deg,#252a2d 0 46%,#d18a25 46% 77%,#73838a 77%)" },
    monochrome: { ...visualDefaults, name:"Preto & Branco", description:"Identidade essencial, minimalista e editorial", paletteTechnique:"monochromatic", typographyProfile:"conversion", primary:"#16191e", accent:"#858b94", surface:"#ffffff", ink:"#16191e", dark:"#111318", headingColor:"#16191e", bodyColor:"#16191e", mutedColor:"#858b94", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#16191e", actionButtonText:"#ffffff", headingFont:"Manrope", bodyFont:"Inter", radius:4, swatch:"linear-gradient(135deg,#111318 0 46%,#16191e 46% 77%,#858b94 77%)" },
    copper: { ...visualDefaults, name:"Cobre Arquitetônico", description:"Materiais nobres, aconchego e sofisticação", paletteTechnique:"analogous", typographyProfile:"conversion", primary:"#a66749", accent:"#a8a08e", surface:"#fbf8f4", ink:"#382922", dark:"#332b28", headingColor:"#382922", bodyColor:"#382922", mutedColor:"#a8a08e", inverseHeadingColor:"#ffffff", inverseBodyColor:"#f2f2f2", actionButtonBackground:"#a66749", actionButtonText:"#ffffff", headingFont:"Cormorant Garamond", bodyFont:"DM Sans", radius:12, swatch:"linear-gradient(135deg,#332b28 0 46%,#a66749 46% 77%,#a8a08e 77%)" },
  });

  const typographyProfiles = {
    conversion: { name:'Conversão direta', description:'Títulos fortes, compactos e leitura rápida.', headingFont:'Manrope', bodyFont:'Inter', headingWeight:800, headingLineHeight:1.02, headingTracking:-0.045, bodySize:17, bodyLineHeight:1.58, textMeasure:64, eyebrowTracking:0.13 },
    popular: { name:'Popular clara', description:'Alta legibilidade, linguagem visual familiar e hierarquia objetiva.', headingFont:'Montserrat', bodyFont:'Inter', headingWeight:800, headingLineHeight:1.06, headingTracking:-0.03, bodySize:17, bodyLineHeight:1.64, textMeasure:68, eyebrowTracking:0.1 },
    humanist: { name:'Humana e acolhedora', description:'Formas mais suaves para moradia, família e relacionamento.', headingFont:'DM Sans', bodyFont:'Source Sans 3', headingWeight:700, headingLineHeight:1.08, headingTracking:-0.025, bodySize:17, bodyLineHeight:1.68, textMeasure:70, eyebrowTracking:0.11 },
    editorial: { name:'Editorial premium', description:'Contraste entre título editorial e texto neutro.', headingFont:'Playfair Display', bodyFont:'Inter', headingWeight:700, headingLineHeight:1.02, headingTracking:-0.025, bodySize:16, bodyLineHeight:1.68, textMeasure:66, eyebrowTracking:0.14 },
    airy: { name:'Leve e arquitetônica', description:'Mais respiro, títulos finos e composição contemporânea.', headingFont:'Josefin Sans', bodyFont:'Source Sans 3', headingWeight:700, headingLineHeight:1.08, headingTracking:-0.015, bodySize:16, bodyLineHeight:1.7, textMeasure:68, eyebrowTracking:0.16 }
  };

  const strategies = {
    aida: { group:'Clássicos', name:'AIDA', summary:'Abre com impacto, desenvolve benefícios, transforma características em desejo e encerra com uma ação clara.', stages:['Atenção','Interesse','Desejo','Ação'], sections:['hero','highlights','specs','gallery','lifestyle','testimonials','payment','location','faq','form-sender-v4','footer'] },
    pas: { group:'Clássicos', name:'PAS', summary:'Torna um problema reconhecível, demonstra seu impacto e apresenta o empreendimento como solução concreta.', stages:['Problema','Agitação','Solução'], sections:['hero','lifestyle','highlights','specs','location','gallery','payment','testimonials','faq','form-sender-v4','footer'] },
    bab: { group:'Clássicos', name:'BAB', summary:'Contrasta a situação atual com a vida desejada e usa o empreendimento como ponte entre as duas.', stages:['Antes','Depois','Ponte'], sections:['hero','lifestyle','gallery','highlights','specs','location','testimonials','payment','faq','form-sender-v4','footer'] },
    fourps: { group:'Clássicos', name:'4 Ps', summary:'Combina uma promessa forte, visualização do futuro, prova confiável e impulso objetivo para avançar.', stages:['Promessa','Imagem','Prova','Impulso'], sections:['hero','gallery','lifestyle','specs','location','testimonials','highlights','payment','faq','form-sender-v4','footer'] },

    mcmvResult: {
      group:'Minha Casa Minha Vida / produto popular',
      name:'MCMV — Resultado primeiro',
      summary:'Começa pelo efeito final que a pessoa quer — casa própria — e só depois explica caminho, condição e próximos passos. Ideal para público imediatista.',
      stages:['Resultado','Possibilidade','Prova','Ação'],
      sections:['hero','highlights','payment','specs','lifestyle','testimonials','faq','form-sender-v4','footer'],
      copy:{ hero:['Sua casa própria pode começar por uma escolha mais simples.','Veja uma opção pensada para transformar orçamento em um caminho concreto para sair do aluguel, sujeito à análise de crédito e às condições aplicáveis.'], lead:'Descubra quais possibilidades fazem sentido para a sua renda.', paymentTitle:'Veja um caminho possível para organizar sua compra.', paymentCta:'Quero analisar minha possibilidade' }
    },
    mcmvRent: {
      group:'Minha Casa Minha Vida / produto popular',
      name:'MCMV — Saída do aluguel',
      summary:'Usa a dor do aluguel como contexto, sem prometer economia automática, e conduz para comparação de cenário, possibilidade de compra e análise.',
      stages:['Dor atual','Comparação','Caminho','Ação'],
      sections:['hero','lifestyle','highlights','payment','specs','testimonials','faq','form-sender-v4','footer'],
      copy:{ hero:['Antes de renovar o aluguel, descubra se já existe um caminho para a casa própria.','Compare sua realidade atual com uma alternativa de compra e entenda o que pode ser estruturado para você.'], lead:'Quero comparar aluguel e possibilidade de compra.', paymentTitle:'Troque suposição por números e próximos passos claros.', paymentCta:'Quero comparar meu cenário' }
    },
    mcmvPatio: {
      group:'Minha Casa Minha Vida / produto popular',
      name:'MCMV — Casa + pátio',
      summary:'Vende primeiro o efeito desejado: casa com espaço próprio, liberdade e pátio. Depois apresenta terreno, construção, planejamento e análise.',
      stages:['Casa + pátio','Personalização','Plano','Ação'],
      sections:['hero','gallery','highlights','timeline-process-pro','payment','faq','form-sender-v4','footer'],
      copy:{ hero:['Pare de procurar uma casa pronta que nunca encaixa. Construa a sua com pátio.','Conheça um caminho de terreno + construção para planejar a casa do seu jeito, dentro das possibilidades do seu perfil e sujeito à análise de crédito.'], lead:'Quero entender como chegar à minha casa com pátio.', paymentTitle:'Terreno, projeto e construção organizados em uma decisão só.', paymentCta:'Quero estruturar meu plano' },
      timeline:{ title:'Da ideia da casa ao caminho para construir.', intro:'Organize terreno, projeto, documentação e crédito em etapas compreensíveis antes de assumir qualquer compromisso.' }
    },
    mcmvConstruction: {
      group:'Minha Casa Minha Vida / produto popular',
      name:'MCMV — Terreno + Construção',
      summary:'Apresenta terreno e construção como solução para quem não encontra imóvel pronto adequado. Explica processo, personalização e análise financeira.',
      stages:['Problema','Projeto próprio','Processo','Análise'],
      sections:['hero','highlights','timeline-process-pro','financing-simulator-pro','specs','payment','faq','form-sender-v4','footer'],
      copy:{ hero:['A casa que você procura pode não estar pronta. Ela pode ser construída.','Estruture terreno + construção, escolha o que realmente importa na planta e entenda as etapas antes de decidir.'], lead:'Quero analisar terreno + construção para o meu perfil.', paymentTitle:'Planeje o projeto antes de comprometer o orçamento.', paymentCta:'Quero uma análise de terreno + construção' },
      timeline:{ title:'Terreno + construção sem mistério.', intro:'Uma sequência clara para entender terreno, projeto, documentação, crédito e execução.' }
    },
    mcmvObjections: {
      group:'Minha Casa Minha Vida / produto popular',
      name:'MCMV — Quebra de objeções',
      summary:'Antecipação de dúvidas sobre entrada, renda, processo, terreno e financiamento antes do CTA. Boa para tráfego frio e leads inseguros.',
      stages:['Dúvida','Clareza','Prova','Próximo passo'],
      sections:['hero','highlights','specs','financing-simulator-pro','testimonials','faq','payment','form-sender-v4','footer'],
      copy:{ hero:['Não comece perguntando “será que eu consigo?”. Comece entendendo o que precisa ser analisado.','Renda, entrada, imóvel, terreno e crédito podem ser organizados em etapas para você enxergar o cenário com mais clareza.'], lead:'Quero tirar minhas dúvidas e entender meu cenário.', paymentTitle:'Primeiro entenda a possibilidade. Depois decida.', paymentCta:'Quero analisar sem compromisso' }
    },
    mcmvFast: {
      group:'Minha Casa Minha Vida / produto popular',
      name:'MCMV — Oferta direta / imediatista',
      summary:'Abordagem curta: produto, benefício final, condição real e CTA. Use somente escassez e disponibilidade que possam ser verificadas.',
      stages:['Oferta','Benefício','Condição','CTA'],
      sections:['hero','highlights','payment','faq','form-sender-v4','footer'],
      copy:{ hero:['Casa própria sem enrolação: veja a opção, a condição e o próximo passo.','Se o produto encaixar no que você procura, faça a análise agora e descubra as possibilidades reais para o seu perfil.'], lead:'Quero saber se esta opção faz sentido para mim.', paymentTitle:'Condição clara. Próximo passo claro.', paymentCta:'Quero verificar agora' }
    }
  };

  const profiles = {
    consultive:{ name:'Consultivo', note:'prioriza clareza, segurança e próximos passos sem pressão.' },
    family:{ name:'Moradia', note:'valoriza rotina, conforto, pertencimento e qualidade de vida.' },
    investment:{ name:'Investimento', note:'destaca localização, liquidez, demanda e potencial de valorização.' },
    urgency:{ name:'Oportunidade', note:'usa disponibilidade e condição real como motivo legítimo para agir.' },
    popular:{ name:'Popular / MCMV', note:'usa linguagem simples, benefício concreto, acessibilidade percebida e CTA direto sem prometer aprovação.' },
    firstHome:{ name:'Primeira casa', note:'reduz complexidade, explica o caminho e reforça segurança para quem ainda não domina o processo.' },
    patio:{ name:'Casa + pátio', note:'prioriza o efeito final — casa própria com espaço externo — e apresenta terreno + construção como caminho possível.' }
  };

  // Fundo externo de toda seção: independente da aparência interna de cada plugin.
  // Ausência em projetos antigos mantém o CSS original sem nenhuma mudança visual.
  const sectionBackgroundDefaults = () => ({
    enabled:false, type:'color', colorMode:'solid', color1:'#ffffff', color2:'#101318',
    angle:135, image:'', imageMode:'static'
  });

  const sectionStyleDefaults = () => ({
    enabled:false,
    panelOpen:false,
    backgroundMode:'inherit',
    backgroundColor:'#ffffff',
    backgroundColor2:'#101318',
    gradientAngle:135,
    primaryMode:'inherit',
    primaryColor:'#d7ff3f',
    accentMode:'inherit',
    accentColor:'#7ca1ff',
    actionBackgroundMode:'auto',
    actionBackgroundColor:'#d7ff3f',
    actionTextMode:'auto',
    actionTextColor:'#101318',
    headingColorMode:'auto',
    headingColor:'#101318',
    bodyColorMode:'auto',
    bodyColor:'#30383d',
    eyebrowColorMode:'auto',
    eyebrowColor:'#d7ff3f',
    headingFont:'inherit',
    bodyFont:'inherit',
    headingWeight:'inherit',
    headingTracking:'inherit',
    headingAlign:'inherit',
    headingAlignMobile:'inherit',
    bodySize:'inherit',
    bodyLineHeight:'inherit',
    bodyAlign:'inherit',
    bodyAlignMobile:'inherit',
    bodyLineFit:'inherit',
    eyebrowAlign:'heading',
    blockPosition:'auto',
    textMeasure:'inherit',
    justifyHyphens:'auto',
    titleEffect:'inherit',
    titleEffectColor:'#000000',
    titleEffectStrength:62,
    bodyEffect:'inherit',
    bodyEffectColor:'#000000',
    bodyEffectStrength:36,
    paddingMode:'inherit',
    paddingTop:96,
    paddingBottom:96
  });

  const createInstanceToken = (prefix = 'item') => `${String(prefix || 'item').replace(/[^a-z0-9-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase() || 'item'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const refreshSectionIdentity = (section, options = {}) => {
    if (!section) return section;
    const plugin = plugins[section.type];
    if (options.keepSectionId !== true) section.id = `${section.type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const field = plugin?.manifest?.instanceIdField;
    if (field) {
      section.props = { ...(section.props || {}) };
      section.props[field] = createInstanceToken(plugin.manifest?.instanceIdPrefix || section.type);
    }
    return section;
  };
  const createSection = (type) => {
    const plugin = plugins[type];
    if (!plugin) return null;
    const section = { id: '', type, props: JSON.parse(JSON.stringify(plugin.defaults || {})), settings:{ visible:true, hideMobile:false, hideDesktop:false, transition:'default', cssClass:'', anchorId:'', style:sectionStyleDefaults(), background:sectionBackgroundDefaults() } };
    return refreshSectionIdentity(section);
  };
  const defaultState = () => ({
    version: '6.0.84', projectId:`project-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, projectName:'Residencial Aurora', preset:'urban',
    strategy:{ method:'aida', profile:'consultive' },
    brand:{ ...presets.urban },
    seo:{ title:'Residencial Aurora em Canoas | Apartamentos de 2 e 3 dormitórios', description:'Conheça o Residencial Aurora em Canoas: apartamentos com varanda, lazer completo e condições especiais. Solicite plantas, valores e disponibilidade.', keywords:'apartamentos em Canoas, lançamento imobiliário, imóvel na planta', canonical:'https://residencialaurora.com.br/', sitemapEnabled:'yes', sitemapChangefreq:'weekly', sitemapPriority:'1.0', ogImage:'', favicon:'', robots:'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', propertyName:'Residencial Aurora', propertySchemaType:'Place', address:'Av. Getúlio Vargas, 2450', city:'Canoas', region:'RS', postalCode:'92000-000', price:'389900', currency:'BRL', authorName:'Roberto Fettuccia', authorRole:'Corretor de imóveis e especialista em Terreno e Construção', authorUrl:'', organizationName:'Roberto Fettuccia Negócios Imobiliários', organizationUrl:'', lastReviewed:new Date().toISOString().slice(0,10), sourceNotes:'Informações comerciais, tabela vigente e materiais oficiais do empreendimento.', localInsight:'Conteúdo revisado com foco na localização, produto e condições aplicáveis ao mercado de Canoas.', aiSearch:'allow', aiTraining:'disallow' },
    behaviorPlugins:['reveal','lightbox'],
    pageSettings:{ scrollMode:'flow', motion:'subtle' },
    siteData:{ propertyName:'Residencial Aurora', city:'Canoas', address:'Av. Getúlio Vargas, 2450 — Canoas/RS', price:'R$ 389.900', whatsapp:'5551998111078', phone:'(51) 99811-1078', broker:'Roberto Fettuccia', license:'CRECI 83599F', email:'contato@seudominio.com.br', endpoint:'' },
    sections: strategies.aida.sections.map(createSection).filter(Boolean),
    selectedSectionId:null,
    updatedAt:new Date().toISOString()
  });

  const blueprints = {
    launch:{ name:'Lançamento imobiliário', strategy:'aida', profile:'family', sections:['hero','highlights','specs','property-slider','gallery','lifestyle','testimonials','payment','location','faq','form-sender-v4','footer'] },
    construction:{ name:'Terreno e construção', strategy:'pas', profile:'consultive', sections:['hero','highlights','specs','gallery','payment','faq','form-sender-v4','footer'] },
    investment:{ name:'Imóvel para investimento', strategy:'fourps', profile:'investment', sections:['hero','property-slider','specs','location','testimonials','payment','faq','form-sender-v4','footer'] },
    quick:{ name:'Oferta rápida', strategy:'aida', profile:'urgency', sections:['hero','highlights','payment','form-sender-v4','footer'] },
    mcmvHome:{ name:'MCMV — Casa própria', strategy:'mcmvResult', profile:'popular', preset:'popularBlue', sections:['hero','highlights','payment','specs','financing-simulator-pro','faq','form-sender-v4','footer'] },
    mcmvPatio:{ name:'MCMV — Casa + pátio', strategy:'mcmvPatio', profile:'patio', preset:'patioTerracotta', sections:['hero','gallery','highlights','timeline-process-pro','payment','faq','form-sender-v4','footer'] },
    mcmvConstruction:{ name:'MCMV — Terreno + construção', strategy:'mcmvConstruction', profile:'firstHome', preset:'popularGreen', sections:['hero','highlights','timeline-process-pro','financing-simulator-pro','specs','payment','faq','form-sender-v4','footer'] },
    mcmvFast:{ name:'MCMV — Oferta direta', strategy:'mcmvFast', profile:'popular', preset:'popularSolar', sections:['hero','highlights','payment','faq','form-sender-v4','footer'] }
  };

  const createFromBlueprint = (key = 'launch') => {
    const state = defaultState();
    const blueprint = blueprints[key] || blueprints.launch;
    state.strategy = { method:blueprint.strategy, profile:blueprint.profile };
    if (blueprint.preset && presets[blueprint.preset]) {
      state.preset = blueprint.preset;
      state.brand = { ...state.brand, ...presets[blueprint.preset] };
    }
    state.sections = blueprint.sections.filter((type) => plugins[type]).map(createSection).filter(Boolean);
    const strategy = strategies[blueprint.strategy];
    if (strategy?.copy) {
      const hero = state.sections.find((section) => section.type === 'hero');
      const lead = state.sections.find((section) => section.type === 'form-sender-v4');
      const payment = state.sections.find((section) => section.type === 'payment');
      const timeline = state.sections.find((section) => section.type === 'timeline-process-pro');
      if (hero && strategy.copy.hero) { hero.props.title = strategy.copy.hero[0]; hero.props.subtitle = strategy.copy.hero[1]; }
      if (lead && strategy.copy.lead && 'title' in lead.props) lead.props.title = strategy.copy.lead;
      if (payment && strategy.copy.paymentTitle) payment.props.title = strategy.copy.paymentTitle;
      if (payment && strategy.copy.paymentCta) payment.props.cta = strategy.copy.paymentCta;
      if (timeline && strategy.timeline) Object.assign(timeline.props, strategy.timeline);
    }
    return state;
  };

  window.ImobifyCatalog = { plugins, presets, buttonKits, typographyProfiles, strategies, profiles, blueprints, createSection, refreshSectionIdentity, createFromBlueprint, defaultState, sectionStyleDefaults, sectionBackgroundDefaults, compositionRole, esc };
})();
