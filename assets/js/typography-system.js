(function(root){
  'use strict';
  const ROLES=['eyebrow','headline','subheadline','body','cta'];
  const LABELS={eyebrow:'Eyebrow · chamada superior',headline:'Headline · título de impacto',subheadline:'Subheadline · apoio',body:'Body Text · leitura',cta:'CTA · chamada para ação'};
  const FONT_OPTIONS=['Inter','Manrope','DM Sans','Montserrat','Playfair Display','Source Sans 3','Plus Jakarta Sans','Outfit','Sora','Urbanist','Poppins','Lato','Nunito Sans','Work Sans','Raleway','Archivo','Barlow','Roboto','Merriweather','Lora','Cormorant Garamond','Libre Baskerville','Bodoni Moda','Space Grotesk','Figtree'];
  const RULES={
    eyebrow:{family:'body',size:12,mobile:11,weight:750,line:1.35,tracking:0.14,color:'inherit',customColor:'#345678',transform:'uppercase'},
    headline:{family:'heading',size:88,mobile:42,weight:800,line:1.03,tracking:-0.042,color:'inherit',customColor:'#101318',transform:'none'},
    subheadline:{family:'body',size:24,mobile:19,weight:500,line:1.42,tracking:-0.01,color:'inherit',customColor:'#30383d',transform:'none'},
    body:{family:'body',size:17,mobile:16,weight:400,line:1.65,tracking:0,color:'inherit',customColor:'#30383d',transform:'none'},
    cta:{family:'body',size:15,mobile:15,weight:750,line:1.25,tracking:0.005,color:'inherit',customColor:'#ffffff',transform:'none'}
  };
  const PRESETS={
    institucional:{name:'Institucional',description:'Clareza, confiança e hierarquia sóbria.',roles:{headline:{size:76,mobile:38,weight:750,tracking:-.035},subheadline:{size:23,mobile:19},body:{size:17,line:1.65},cta:{size:15}}},
    editorial:{name:'Editorial premium',description:'Título serifado com texto contemporâneo.',roles:{headline:{family:'Playfair Display',size:94,mobile:46,weight:700,tracking:-.02,line:1.08},subheadline:{size:23,mobile:19},eyebrow:{tracking:.2},body:{line:1.72}}},
    impacto:{name:'Impacto / conversão',description:'Chamada concentrada, CTA decisivo.',roles:{headline:{family:'Manrope',size:104,mobile:48,weight:900,line:.99,tracking:-.057},subheadline:{size:23,mobile:18},eyebrow:{weight:850},cta:{size:16,weight:800}}},
    minimalista:{name:'Minimalista',description:'Poucos contrastes, ritmo generoso.',roles:{headline:{family:'DM Sans',size:79,mobile:39,weight:600,tracking:-.038,line:1.09},eyebrow:{weight:650},subheadline:{size:21,mobile:18},body:{line:1.77},cta:{weight:650}}},
    acolhedor:{name:'Humano / residencial',description:'Proximidade, legibilidade e suavidade.',roles:{headline:{family:'DM Sans',size:80,mobile:39,weight:750,tracking:-.028,line:1.08},subheadline:{size:23,mobile:19,line:1.55},body:{size:18,mobile:16,line:1.7},cta:{weight:750}}}
  };
  function bound(v,min,max,fallback){let n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
  function normalize(input){
    const result={}; const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    for(const key of ROLES){
      const d=RULES[key],v=source[key]&&typeof source[key]==='object'?source[key]:{};
      let family=String(v.family||d.family);
      if(!['heading','body'].includes(family)&&!FONT_OPTIONS.includes(family))family=d.family;
      let color=String(v.color||d.color);
      if(!['inherit','heading','body','primary','accent','custom'].includes(color))color='inherit';
      const desktop=bound(v.size,10,160,d.size),mobile=bound(v.mobile,10,90,d.mobile);
      const suggestedTablet=Math.round(mobile+(desktop-mobile)*.40);
      result[key]={family,size:desktop,mobile,tablet:bound(v.tablet,10,120,suggestedTablet),weight:bound(v.weight,300,900,d.weight),line:bound(v.line,.9,2.2,d.line),tracking:bound(v.tracking,-.1,.3,d.tracking),color,customColor:/^#[\da-f]{6}$/i.test(v.customColor||'')?v.customColor:d.customColor,transform:['none','uppercase','lowercase'].includes(v.transform)?v.transform:d.transform};
    }
    return result;
  }
  function rolePreset(key){ const item=PRESETS[key]||PRESETS.institucional;const result=normalize();for(const role of ROLES)Object.assign(result[role],item.roles[role]||{});return result; }
  function familyCss(name){ if(name==='heading')return 'var(--heading)';if(name==='body')return 'var(--body)';return '"'+name.replace(/["<>;\\]/g,'')+'",system-ui,sans-serif'; }
  function colorCss(item){return {inherit:'inherit',heading:'var(--heading-color)',body:'var(--body-color)',primary:'var(--primary)',accent:'var(--accent)',custom:item.customColor}[item.color]||'inherit';}
  function variables(brand){
    if(!brand?.typographyWizardEnabled)return '';
    const data=normalize(brand.typographyRoles);const desktop=[],mobile=[];
    const mobileFluid=[],tabletFluid=[];
    const fluid=(start,end,widthStart,widthEnd)=>{
      const slope=(end-start)*100/(widthEnd-widthStart);
      const intercept=start-slope*widthStart/100;
      return 'clamp('+Math.min(start,end)+'px,calc('+Number(intercept.toFixed(5))+'px + '+Number(slope.toFixed(5))+'vw),'+Math.max(start,end)+'px)';
    };
    for(const role of ROLES){const x=data[role],prefix='--ib-'+role+'-';
      desktop.push(prefix+'font:'+familyCss(x.family),prefix+'size:'+x.size+'px',prefix+'weight:'+x.weight,prefix+'line:'+x.line,prefix+'tracking:'+x.tracking+'em',prefix+'color:'+colorCss(x),prefix+'transform:'+x.transform);
      mobile.push(prefix+'size:'+x.mobile+'px');
      mobileFluid.push(prefix+'size:'+fluid(x.mobile,x.tablet,320,720));
      tabletFluid.push(prefix+'size:'+fluid(x.tablet,x.size,720,1440));
    }
    return ':root{'+desktop.join(';')+'}\n@media(max-width:720px){:root{'+mobile.join(';')+'}}'+
      '\n@supports(font-size:clamp(1px,2vw,3px)){'+
      '@media(min-width:321px) and (max-width:720px){:root{'+mobileFluid.join(';')+'}}'+
      '@media(min-width:721px) and (max-width:1439px){:root{'+tabletFluid.join(';')+'}}}';
  }
  // CSS attached only when the wizard has been applied to the project.
  // section-local overrides may opt out using data-ib-type-mode="local".
  const SCOPE=':where([data-plugin]:not([data-ib-type-mode="local"]))';
  const SELECTORS={
    eyebrow:':where(.eyebrow,[class*="eyebrow"],[class*="kicker"],[class*="overline"],[class*="ribbon-text"])',
    headline:':where(h1,h2,[class$="__title"]:not(.imobify-design-title),[class$="-title"]:not(.imobify-design-title),[class*="_headline"],[class*="-headline"],.hero-title,.svp-hero-title)',
    subheadline:':where(h3,.hero-copy,.section-intro>p:not(.eyebrow),[class*="subtitle"],[class*="sub-title"],[class*="subheadline"],[class*="lead-text"],[class*="intro-text"])',
    body:':where(p:not(.eyebrow):not(.hero-copy),li,[class*="__description"],[class*="-description"],[class*="__body"],[class*="-body"],[class*="__text"]:not(input):not(textarea))',
    cta:':where(a.button,button.button,.button-primary,.button-ghost,[class*="-cta"],[class*="__cta"],[class*="_cta"],.btn-flip,.formsenderCSS_button ,.svp-hero-button,.ibs-button,.iwfp-button)'
  };
  function bridgeCss(brand){
    if(!brand?.typographyWizardEnabled)return '';
    const declarations={};const roleData=normalize(brand.typographyRoles);
    for(const role of ROLES){const pre='--ib-'+role+'-';declarations[role]='font-family:var('+pre+'font)!important;font-size:var('+pre+'size)!important;font-weight:var('+pre+'weight)!important;line-height:var('+pre+'line)!important;letter-spacing:var('+pre+'tracking)!important;text-transform:var('+pre+'transform)!important;'+(roleData[role].color==='inherit'?'':'color:var('+pre+'color)!important;');}
    const base = ['body','subheadline','headline','eyebrow','cta'].map(role => SCOPE+' '+SELECTORS[role]+'{'+declarations[role]+'}').join('\n');
    return base+'\n'+SCOPE+' h2{font-size:calc(var(--ib-headline-size) * .74)!important;}'+
      '\n'+SCOPE+' .ims360-banner-title{font-size:clamp(24px,calc(var(--ib-headline-size) * .45),34px)!important;}'+
      '\n'+SCOPE+' :where(a,button){-webkit-tap-highlight-color:transparent}'+
      '\n@media(prefers-reduced-motion:reduce){'+SCOPE+' :where(a,button){scroll-behavior:auto;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}';
  }
  function usedFonts(brand){if(!brand?.typographyWizardEnabled)return [];return [...new Set(Object.values(normalize(brand.typographyRoles)).map(r=>r.family).filter(f=>!['heading','body'].includes(f)))];}
  root.ImobifyTypeSystem={ROLES,LABELS,FONT_OPTIONS,RULES,PRESETS,normalize,rolePreset,variables,bridgeCss,usedFonts,colorCss};
})(typeof window!=='undefined'?window:globalThis);
