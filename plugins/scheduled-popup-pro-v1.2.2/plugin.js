(function(){
  'use strict';

  var KEY='__IMOBIFY_POPUPS__';
  var manager=window[KEY]||(window[KEY]={items:[],active:null,wakeTimer:null,bound:false,scrollQueued:false});

  function bool(value){return /^(?:1|true|yes|on)$/i.test(String(value||''))}
  function pad(n){return String(n).padStart(2,'0')}
  function clamp(value,min,max,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
  function currentDateKey(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
  function validateKey(y,m,d){var date=new Date(y,m-1,d);if(date.getFullYear()!==y||date.getMonth()+1!==m||date.getDate()!==d)return NaN;return y*10000+m*100+d}
  function parseDateKey(value){
    value=String(value||'').trim();
    if(!value)return NaN;
    var m=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(m)return validateKey(+m[1],+m[2],+m[3]);
    m=value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m)return validateKey(+m[3],+m[2],+m[1]);
    return NaN;
  }
  function displayDate(key){if(!Number.isFinite(key))return 'data inválida';var y=Math.floor(key/10000),m=Math.floor((key%10000)/100),d=key%100;return pad(d)+'/'+pad(m)+'/'+y}
  function storageGet(key){try{return sessionStorage.getItem(key)}catch(e){return null}}
  function storageSet(key){try{sessionStorage.setItem(key,'1')}catch(e){}}
  function isEditor(){return Boolean(window.__IMOBIFY_EDITOR__)}
  function isSelected(item){return item.root.classList.contains('editor-selected')}
  function isMobileViewport(){return window.matchMedia?window.matchMedia('(max-width: 720px)').matches:window.innerWidth<=720}
  function viewportAllowed(item){
    var mobile=isMobileViewport();
    if(item.hideMobile&&item.hideDesktop)return false;
    if(mobile&&item.hideMobile)return false;
    if(!mobile&&item.hideDesktop)return false;
    return true;
  }

  function scheduleStatus(item){
    if(item.openAlways)return 'always';
    if(!item.dateRangeEnabled)return 'disabled';
    var today=currentDateKey();
    if(!Number.isFinite(item.start)||!Number.isFinite(item.end))return 'invalid';
    if(item.start>item.end)return 'invalid-range';
    if(today<item.start)return 'before';
    if(today>item.end)return 'after';
    return 'active';
  }
  function scheduleAllowed(item){var s=scheduleStatus(item);return s==='always'||s==='active'}

  function pageScrollPercent(){
    var doc=document.documentElement,body=document.body;
    var scrollTop=window.scrollY||doc.scrollTop||(body&&body.scrollTop)||0;
    var bodyHeight=body?Math.max(body.scrollHeight,body.offsetHeight,body.clientHeight):0;
    var scrollHeight=Math.max(doc.scrollHeight,doc.offsetHeight,doc.clientHeight,bodyHeight);
    var viewport=Math.max(window.innerHeight||0,doc.clientHeight||0);
    var maxScroll=Math.max(0,scrollHeight-viewport);
    if(maxScroll<=1)return 100;
    return Math.max(0,Math.min(100,(scrollTop/maxScroll)*100));
  }
  function scrollConditionMet(item,percent){return !item.scrollEnabled||percent>=item.scrollPercent}

  function behaviorDescription(item){
    var timing=[];
    if(item.scrollEnabled)timing.push('scroll '+item.scrollPercent+'%');
    timing.push('delay '+item.delaySeconds+'s');
    if(item.reopenEnabled)timing.push('reexibir '+item.reopenSeconds+'s após fechar');
    if(item.once)timing.push('uma vez por sessão');
    return timing.join(' · ');
  }
  function statusMessage(item){
    if(item.hideMobile&&item.hideDesktop)return 'Atenção: esta instância está marcada para ocultar no mobile E no desktop.';
    if(!viewportAllowed(item))return isMobileViewport()?'Oculto no mobile nesta instância.':'Oculto no desktop nesta instância.';
    var status=scheduleStatus(item),rule='';
    if(status==='always')rule='Abrir sempre.';
    else if(status==='active')rule='Intervalo ativo: '+displayDate(item.start)+' até '+displayDate(item.end)+'.';
    else if(status==='before')rule='Intervalo ainda não iniciou: '+displayDate(item.start)+'.';
    else if(status==='after')rule='Intervalo encerrado em '+displayDate(item.end)+'.';
    else if(status==='invalid-range')rule='A data final é anterior à data inicial.';
    else if(status==='invalid')rule='Confira as datas. Use AAAA-MM-DD ou DD/MM/AAAA.';
    else rule='Popup desativado: habilite Abrir sempre ou Abrir em intervalo de datas.';
    return rule+' '+behaviorDescription(item)+'.';
  }

  function focusable(dialog){return dialog.querySelector('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')}
  function clearWake(){if(manager.wakeTimer){clearTimeout(manager.wakeTimer);manager.wakeTimer=null}}
  function portalToBody(item,editor){
    if(editor||!document.body||item.overlay.parentNode===document.body)return;
    var sourceStyle=getComputedStyle(item.root);
    [
      '--surface','--body-color','--primary','--heading','--heading-color','--body',
      '--body-size','--body-line','--action-button-bg','--action-button-text',
      '--radius','--h2-max','--element-gap'
    ].forEach(function(name){
      var value=sourceStyle.getPropertyValue(name);
      if(value)item.overlay.style.setProperty(name,value);
    });
    item.overlay.dataset.mobileImage=String(item.showImageMobile);
    item.overlay.removeAttribute('data-hide-mobile');
    item.overlay.removeAttribute('data-hide-desktop');
    document.body.appendChild(item.overlay);
    item.portaled=true;
  }

  function show(item,editor){
    if(item.visible)return;
    if(!editor&&!viewportAllowed(item))return;
    portalToBody(item,editor);
    item.visible=true;
    item.initialShown=true;
    item.overlay.hidden=false;
    item.overlay.setAttribute('aria-hidden','false');
    if(item.status)item.status.hidden=true;
    if(!editor)document.body.classList.add('spp-scroll-lock');
    if(item.once&&!editor)storageSet(item.storageKey);
    requestAnimationFrame(function(){
      var target=focusable(item.dialog)||item.dialog;
      if(target&&target.focus)try{target.focus({preventScroll:true})}catch(e){try{target.focus()}catch(_) {}}
    });
  }

  function hide(item,manual,editor,silent){
    if(item.visible){
      item.visible=false;
      item.overlay.hidden=true;
      item.overlay.setAttribute('aria-hidden','true');
    }
    if(manual&&!editor){
      item.closedOnce=true;
      item.reopenReadyAt=(!item.once&&item.reopenEnabled)?Date.now()+item.reopenSeconds*1000:null;
    }
    if(manager.active===item)manager.active=null;
    if(!editor&&!manager.items.some(function(x){return x.visible}))document.body.classList.remove('spp-scroll-lock');
    if(!silent)evaluate();
  }

  function updateEditor(item){
    if(!item.status)return;
    var selected=isEditor()&&isSelected(item);
    var allowed=viewportAllowed(item);
    item.status.hidden=!selected;
    var message=item.status.querySelector('[data-spp-editor-message]');
    if(message)message.textContent=statusMessage(item);
    if(selected&&allowed&&!item.visible)show(item,true);
    else if((!selected||!allowed)&&item.visible)hide(item,false,true,true);
  }

  function armInitial(item,now,percent){
    if(item.initialShown||item.initialReadyAt!==null)return;
    if(!viewportAllowed(item)||!scheduleAllowed(item)||!scrollConditionMet(item,percent))return;
    item.initialReadyAt=now+item.delaySeconds*1000;
  }

  function eligible(item,now,percent){
    if(!viewportAllowed(item)||!scheduleAllowed(item)||item.visible)return false;
    if(item.once&&storageGet(item.storageKey))return false;
    if(item.closedOnce){
      if(item.once||!item.reopenEnabled)return false;
      return item.reopenReadyAt!==null&&now>=item.reopenReadyAt;
    }
    armInitial(item,now,percent);
    return item.initialReadyAt!==null&&now>=item.initialReadyAt;
  }

  function nextWakeAt(now){
    var at=null;
    manager.items.forEach(function(item){
      if(!viewportAllowed(item)||!scheduleAllowed(item)||item.visible)return;
      if(item.once&&storageGet(item.storageKey))return;
      var candidate=null;
      if(item.closedOnce&&item.reopenEnabled&&!item.once)candidate=item.reopenReadyAt;
      else if(!item.closedOnce)candidate=item.initialReadyAt;
      if(candidate!==null&&candidate>now&&(at===null||candidate<at))at=candidate;
    });
    return at;
  }

  function scheduleWake(now){
    clearWake();
    var at=nextWakeAt(now);
    if(at===null)return;
    manager.wakeTimer=setTimeout(function(){manager.wakeTimer=null;evaluate()},Math.max(0,at-now)+8);
  }

  function prune(){
    manager.items=manager.items.filter(function(item){
      var alive=document.documentElement.contains(item.root);
      if(!alive&&item.portaled&&item.overlay&&item.overlay.parentNode)item.overlay.parentNode.removeChild(item.overlay);
      return alive;
    });
  }

  function evaluate(){
    prune();
    var editor=isEditor();
    var now=Date.now();
    var percent=pageScrollPercent();

    if(editor){
      manager.items.forEach(updateEditor);
      clearWake();
      return;
    }

    manager.items.forEach(function(item){
      if((!viewportAllowed(item)||!scheduleAllowed(item))&&item.visible)hide(item,false,false,true);
      if(!item.closedOnce)armInitial(item,now,percent);
    });

    if(manager.active&&manager.active.visible){scheduleWake(now);return}
    manager.active=null;
    var next=manager.items.find(function(item){return eligible(item,now,percent)});
    if(next){manager.active=next;show(next,false)}
    scheduleWake(now);
  }

  function init(root){
    if(!root||root.dataset.sppReady)return;
    var config=root.querySelector('.spp-config');
    var overlay=root.querySelector('.spp-overlay');
    var dialog=root.querySelector('.spp-dialog');
    var status=root.querySelector('.spp-editor-status');
    if(!config||!overlay||!dialog)return;
    root.dataset.sppReady='1';

    var hasNewSchedule=config.hasAttribute('data-open-always')||config.hasAttribute('data-date-range');
    var openAlways=hasNewSchedule?bool(config.dataset.openAlways):false;
    var dateRangeEnabled=hasNewSchedule?bool(config.dataset.dateRange):true;
    var scrollEnabled=config.hasAttribute('data-scroll-enabled')?bool(config.dataset.scrollEnabled):bool(config.dataset.triggerScroll);
    var sectionId=root.dataset.sectionId||root.id||config.dataset.campaign||('popup-'+String(manager.items.length+1));
    var item={
      root:root,config:config,overlay:overlay,dialog:dialog,status:status,
      openAlways:openAlways,dateRangeEnabled:dateRangeEnabled,
      start:parseDateKey(config.dataset.start),end:parseDateKey(config.dataset.end),
      delaySeconds:clamp(config.dataset.delay,0,3600,0),
      scrollEnabled:scrollEnabled,scrollPercent:clamp(config.dataset.scrollPercent,0,100,50),
      reopenEnabled:bool(config.dataset.reopenEnabled),reopenSeconds:clamp(config.dataset.reopenSeconds,1,86400,30),
      once:bool(config.dataset.onceSession),showImageMobile:bool(config.dataset.mobileImage),
      desktopScale:clamp(config.dataset.desktopScale,80,200,130),
      hideMobile:bool(root.dataset.hideMobile),hideDesktop:bool(root.dataset.hideDesktop),
      visible:false,initialShown:false,closedOnce:false,portaled:false,
      initialReadyAt:null,reopenReadyAt:null,
      storageKey:'imobify-popup:v134:'+sectionId
    };
    item.overlay.style.setProperty('--spp-desktop-width',Math.round(460*(item.desktopScale/100))+'px');
    manager.items.push(item);

    var close=root.querySelector('.spp-close');
    if(close)close.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();hide(item,true,isEditor())});
    overlay.addEventListener('click',function(event){
      if(event.target===overlay&&bool(config.dataset.closeBackdrop)){
        event.preventDefault();event.stopPropagation();hide(item,true,isEditor());
      }
    });
  }

  function scan(scope){
    var root=scope&&scope.querySelectorAll?scope:document;
    if(scope&&scope.matches&&scope.matches('[data-plugin="scheduled-popup-pro"]'))init(scope);
    root.querySelectorAll('[data-plugin="scheduled-popup-pro"]').forEach(init);
  }

  function bindGlobalEvents(){
    if(manager.bound)return;
    manager.bound=true;

    window.addEventListener('scroll',function(){
      if(manager.scrollQueued)return;
      manager.scrollQueued=true;
      requestAnimationFrame(function(){manager.scrollQueued=false;evaluate()});
    },{passive:true});

    document.addEventListener('keydown',function(event){
      if(event.key!=='Escape')return;
      var active=manager.active;
      if(active&&active.visible)hide(active,true,isEditor());
    });

    window.addEventListener('pageshow',evaluate);
    window.addEventListener('resize',function(){
      if(manager.scrollQueued)return;
      manager.scrollQueued=true;
      requestAnimationFrame(function(){manager.scrollQueued=false;evaluate()});
    },{passive:true});

    if(window.matchMedia){
      var mq=window.matchMedia('(max-width: 720px)');
      var onViewportChange=function(){
        manager.items.forEach(function(item){
          if(!viewportAllowed(item)){
            item.initialReadyAt=null;
            if(item.visible)hide(item,false,false,true);
          }else if(!item.initialShown&&!item.closedOnce){
            item.initialReadyAt=null;
          }
        });
        evaluate();
      };
      if(mq.addEventListener)mq.addEventListener('change',onViewportChange);
      else if(mq.addListener)mq.addListener(onViewportChange);
    }
  }

  function boot(){
    scan(document);
    bindGlobalEvents();
    evaluate();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
