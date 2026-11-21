/* Agendamento Sender 1.3.0 — FormSender v4 POST contract */
(function(){
  'use strict';
function configureFixedBackgrounds(){document.querySelectorAll('.ags-section[data-fixed-background="true"]').forEach(function(el){var url=el.dataset.backgroundImage||'';if(/^https:\/\//i.test(url)){el.style.setProperty('--sender-fixed-image','url('+JSON.stringify(url)+')')}else{el.style.removeProperty('--sender-fixed-image')}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',configureFixedBackgrounds);else configureFixedBackgrounds();

  var ROOT='[data-plugin="agendamento-sender"] [data-ags-mount]';
  var WEEK=['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
  var MONTH=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  function bool(value){return value===true||value==='true'||value==='1'||value==='on';}
  function num(value,min,max,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;}
  function safe(value){return String(value == null?'':value).trim();}
  // Calendário civil no fuso do empreendimento; UTC-only internamente para não sofrer desvios do navegador.
  function iso(date){return date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0');}
  function civilDate(y,m,d){return new Date(Date.UTC(y,m-1,d,12,0,0));}
  function addDays(date,days){var clone=new Date(date.getTime());clone.setUTCDate(clone.getUTCDate()+days);return clone;}
  function format(date){return String(date.getUTCDate()).padStart(2,'0')+'/'+String(date.getUTCMonth()+1).padStart(2,'0')+'/'+date.getUTCFullYear();}
  function label(date){return WEEK[date.getUTCDay()].toLowerCase()+', '+format(date);}
  function validTimeZone(tz){try{new Intl.DateTimeFormat('pt-BR',{timeZone:tz}).format(new Date());return tz;}catch(_){return 'America/Sao_Paulo';}}
  function todayAtTimeZone(tz){
    var fields=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
    var o={};fields.forEach(function(item){if(item.type!=='literal')o[item.type]=+item.value;});
    return civilDate(o.year,o.month,o.day);
  }
  function stampAtTimeZone(tz){return new Intl.DateTimeFormat('pt-BR',{timeZone:tz,dateStyle:'short',timeStyle:'medium'}).format(new Date())+' ('+tz+')';}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function eligibleDate(date,config){
    if(config.blocked.has(iso(date)))return {available:false,reason:'Data bloqueada para visitas'};
    if(!config.weekdays[date.getUTCDay()])return {available:false,reason:'Dia da semana não atendido'};
    if(!config.turnsByDay[date.getUTCDay()].length)return {available:false,reason:'Sem turnos disponíveis neste dia'};
    return {available:true,reason:''};
  }
  function makeDates(config){
    var today=todayAtTimeZone(config.timeZone), dates=[];
    for(var offset=config.leadDays;offset<=config.horizonDays;offset++){
      var d=addDays(today,offset), availability=eligibleDate(d,config);
      dates.push({date:d,available:availability.available,reason:availability.reason});
    }
    return dates;
  }
  // Feedback visual do FormSender V4: usa notify_Send_notification quando disponível.
  // Fallback autônomo para landing pages que usam apenas Agendamento Sender.
  var noticeGlyphs={
    success:'<path d="m5 12 4 4L19 6"/>',
    error:'<path d="m6 6 12 12M18 6 6 18"/>',
    warning:'<path d="M12 8v5m0 3h.01"/><path d="m10.3 3.9-8.5 14.7A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.4L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    info:'<path d="M12 11v6m0-10h.01"/><circle cx="12" cy="12" r="10"/>'
  };
  function notify(mount,type,message,title){
    var external=window.notify_Send_notification;
    if(typeof external==='function'){
      try{external(type,message,title);return;}catch(err){console.warn('[Agendamento Sender] Notificação externa indisponível:',err);}
    }
    var stack=document.getElementById('ags-notification-container');
    if(!stack){
      stack=document.createElement('div');stack.id='ags-notification-container';
      stack.className='ags-notification-container';stack.setAttribute('aria-live','polite');
      stack.setAttribute('aria-relevant','additions');document.body.appendChild(stack);
    }
    var notice=document.createElement('div');notice.className='ags-notification '+(noticeGlyphs[type]?type:'info');
    notice.setAttribute('role',type==='error'?'alert':'status');
    var avatar=document.createElement('span');avatar.className='ags-notification-avatar';avatar.setAttribute('aria-hidden','true');
    avatar.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">'+noticeGlyphs[type||'info']+'</svg>';
    var content=document.createElement('span');content.className='ags-notification-content';
    var heading=document.createElement('strong');heading.className='ags-notification-title';heading.textContent=title||'Agendamento';
    var detail=document.createElement('span');detail.className='ags-notification-message';detail.textContent=message;
    content.appendChild(heading);content.appendChild(detail);
    var close=document.createElement('button');close.type='button';close.className='ags-notification-close';close.setAttribute('aria-label','Fechar notificação');close.textContent='×';
    var bar=document.createElement('span');bar.className='ags-notification-progress';bar.setAttribute('aria-hidden','true');
    notice.appendChild(avatar);notice.appendChild(content);notice.appendChild(close);notice.appendChild(bar);
    Array.from(stack.children).forEach(function(previous){previous.remove();});
    stack.appendChild(notice);
    var timer=0;
    function dismiss(){window.clearTimeout(timer);notice.classList.remove('show');notice.classList.add('hide');window.setTimeout(function(){notice.remove();},300);}
    close.addEventListener('click',dismiss);
    window.requestAnimationFrame(function(){notice.classList.add('show');bar.classList.add('running');});
    timer=window.setTimeout(dismiss,type==='error'?7500:5500);
  }
  function init(mount){
    if(mount.dataset.agsReady==='true')return;
    mount.dataset.agsReady='true';
    var settings=mount.dataset;
    var allTurns=safe(settings.turns).split('|').map(safe).filter(Boolean);if(!allTurns.length)allTurns=['Manhã','Tarde','Noite'];
    var timeZone=validTimeZone(safe(settings.timeZone)||'America/Sao_Paulo');
    function resolveTurns(key){var v=safe(settings[key]||'all').toLowerCase();if(v==='none')return [];if(v==='all')return allTurns.slice();return v.split(',').map(function(v){return Number(v.trim())-1;}).filter(function(i){return Number.isInteger(i)&&i>=0&&i<allTurns.length;}).map(function(i){return allTurns[i];});}
    var config={leadDays:num(settings.leadDays,0,30,1),horizonDays:num(settings.horizonDays,7,180,60),
      visibleDays:num(settings.visibleDays,3,8,6),
      weekdays:['allowSunday','allowMonday','allowTuesday','allowWednesday','allowThursday','allowFriday','allowSaturday'].map(function(key){return bool(settings[key]);}),
      timeZone:timeZone,turnsByDay:['sundayTurns','mondayTurns','tuesdayTurns','wednesdayTurns','thursdayTurns','fridayTurns','saturdayTurns'].map(resolveTurns),
      blocked:new Set(safe(settings.blockedDates).split(/[\s,;|]+/).filter(function(s){return /^\d{4}-\d{2}-\d{2}$/.test(s);}))};
    config.horizonDays=Math.max(config.leadDays,config.horizonDays);
    var dates=makeDates(config),dayWrap=mount.querySelector('.ags-day-list'),prev=mount.querySelector('.ags-prev'),next=mount.querySelector('.ags-next'),
      form=mount.querySelector('.ags-form'),status=mount.querySelector('.ags-status'),submit=mount.querySelector('.ags-submit'),
      email=form.querySelector('[name=email]'),turn=form.querySelector('[name=turnoPreferido]'),phone=form.querySelector('[name=telefone]');
    if(!dayWrap||!form||!prev||!next)return;
    // Contexto direcionado pelo Smart Plant. Um mount recebe uma única seleção
    // por vez, evitando transferência a outros agendamentos da landing page.
    var smartPlantContext = null;
    var selectedPlantLabel = mount.querySelector('[data-ags-selected-plant]');
    mount.addEventListener('imobify:smart-plant-select',function(event){
      var d=event.detail||{};
      if(d.destination && d.destination!=='agendamento-sender')return;
      smartPlantContext = {
        plantId:safe(d.plantId), plantCode:safe(d.plantCode),
        plantTitle:safe(d.plantTitle), area:safe(d.area),
        empreendimento:safe(d.empreendimento), message:safe(d.message)
      };
      mount.dataset.smartPlantSelected=smartPlantContext.plantId||smartPlantContext.plantTitle||'true';
      if(selectedPlantLabel){
        selectedPlantLabel.textContent='Planta selecionada: '+(smartPlantContext.plantTitle||'planta')+(smartPlantContext.area?' · '+smartPlantContext.area:'');
        selectedPlantLabel.hidden=false;
      }
    });
    var firstAvailable=dates.findIndex(function(d){return d.available;});
    var selected=firstAvailable>=0?iso(dates[firstAvailable].date):'',page=0,busy=false;
    // Start with the first actual available day instead of a page containing only disabled dates.
    if(firstAvailable>=0)page=Math.floor(firstAvailable/config.visibleDays)*config.visibleDays;
    var section=mount.closest('.ags-section');
    if(section){
      var preset=safe(section.dataset.agsPreset)||'auto',profile=safe(section.dataset.agsProjectProfile).toLowerCase();
      if(preset==='auto')preset=/popular|firsthome|patio|urgency|mcmv|familia/.test(profile)?'popular':/luxury|exclusive|premium|sophisticat|alto-padrao/.test(profile)?'editorial':/invest|nautic|resort/.test(profile)?'immersive':'contemporary';
      if(!/^(popular|contemporary|sophisticated|minimal|spotlight|immersive|editorial)$/.test(preset))preset='contemporary';
      section.dataset.agsEffectivePreset=preset;
    }
    var shifts=function(){return window.matchMedia&&window.matchMedia('(max-width: 570px)').matches?3:config.visibleDays;};
    function statusShow(text,kind){status.textContent=text;status.className='ags-status'+(kind?' is-'+kind:'');}
    function feedback(text,kind,title){statusShow(text,kind);notify(mount,kind==='error'?'error':kind==='success'?'success':kind==='warning'?'warning':'info',text,title);}
    function dateTurns(){var item=dates.find(function(item){return item.available&&iso(item.date)===selected;});return item?config.turnsByDay[item.date.getUTCDay()]:[];}
    function syncTurns(){
      var options=dateTurns(),prior=turn.value||safe(settings.defaultTurn);
      turn.innerHTML='';options.forEach(function(value){var opt=document.createElement('option');opt.value=value;opt.textContent=value;turn.appendChild(opt);});
      if(options.includes(prior))turn.value=prior;else if(options.includes(settings.defaultTurn))turn.value=settings.defaultTurn;
      turn.disabled=!options.length;
    }
    var zoneLabel=mount.querySelector('.ags-time-zone-label');if(zoneLabel)zoneLabel.textContent='Datas e turnos no fuso: '+timeZone.replace(/_/g,' ');
    var conversion=mount.querySelector('[data-ags-conversion]');
    var showPanel=bool(settings.showConversionPanel)&&section&&section.dataset.agsConversionLayout!=='compact';
    if(section){section.classList.toggle('ags-has-conversion',!!showPanel);section.classList.toggle('ags-no-conversion',!showPanel);}
    // Um unico CTA visivel: painel ativo envia o formulario; caso contrario, apenas aviaozinho.
    var panelSubmit=conversion?conversion.querySelector('[data-ags-send]'):null;
    submit.hidden=!!showPanel;
    submit.setAttribute('aria-hidden',showPanel?'true':'false');
    if(conversion){
      conversion.hidden=!showPanel;
      if(panelSubmit){
        panelSubmit.hidden=!showPanel;
        panelSubmit.addEventListener('click',function(){
          if(busy||panelSubmit.disabled)return;
          // Delegar ao mesmo evento submit preserva toda a validacao e contrato FormSender.
          if(typeof form.requestSubmit==='function')form.requestSubmit(submit);
          else submit.click();
        });
      }
    }
    syncTurns();
    var showEmail=bool(settings.showEmail), requireEmail=bool(settings.requireEmail);
    email.hidden=!showEmail;email.required=showEmail&&requireEmail;
    if(!showEmail){email.disabled=true;form.classList.add('ags-no-email');}
    function draw(){
      var visible=shifts(),slice=dates.slice(page,page+visible);
      dayWrap.style.setProperty('--ags-visible',String(visible));
      dayWrap.innerHTML=slice.map(function(item){
        var d=item.date,value=iso(d),active=item.available&&value===selected;
        var unavailable=!item.available,reason=unavailable?' — Indisponível: '+item.reason:'';
        return '<button type="button" class="ags-day'+(active?' is-active':'')+(unavailable?' is-disabled':'')+'" aria-label="'+escapeHtml(label(d)+reason)+'" aria-pressed="'+active+'"'+(unavailable?' disabled aria-disabled="true" title="'+escapeHtml(item.reason)+'"':'')+' data-ags-date="'+value+'"><span class="ags-day-week">'+WEEK[d.getUTCDay()]+'</span><span class="ags-day-num">'+String(d.getUTCDate()).padStart(2,'0')+'</span><span class="ags-day-month">'+MONTH[d.getUTCMonth()]+'</span></button>';
      }).join('');
      prev.disabled=page===0;next.disabled=page+visible>=dates.length;syncTurns();
    }
    if(firstAvailable<0){feedback('Nenhuma data disponível neste período. Solicite à equipe uma nova janela de atendimento.','warning','Sem datas disponíveis');submit.disabled=true;if(panelSubmit)panelSubmit.disabled=true;prev.disabled=true;next.disabled=true;}
    prev.addEventListener('click',function(){page=Math.max(0,page-shifts());draw();});
    next.addEventListener('click',function(){page=Math.min(Math.max(0,dates.length-shifts()),page+shifts());draw();});
    dayWrap.addEventListener('click',function(e){var node=e.target.closest('[data-ags-date]');if(!node||!dayWrap.contains(node)||node.disabled||!dates.some(function(item){return item.available&&iso(item.date)===node.dataset.agsDate;}))return;selected=node.dataset.agsDate;draw();statusShow('','');});
    window.addEventListener('resize',function(){if(!mount.isConnected)return;var total=shifts();if(page+total>dates.length)page=Math.max(0,dates.length-total);draw();},{passive:true});
    form.addEventListener('submit',function(e){
      e.preventDefault();if(busy)return;
      if(!selected){feedback('Selecione uma data para a visita.','error','Selecione uma data');return;}
      // Verifique novamente a data no momento do envio (a página pode estar aberta há dias).
      var eligible=makeDates(config).some(function(item){return item.available&&iso(item.date)===selected;});
      if(!dateTurns().includes(turn.value)){feedback('O turno escolhido não está disponível nesse dia.','error','Turno indisponível');return;}
      if(!eligible){feedback('Esta data não está mais disponível. Atualize a página e selecione outra.','error','Data indisponível');return;}
      var phoneDigits=safe(phone.value).replace(/\D/g,'');
      if(!form.checkValidity()||phoneDigits.length<10||phoneDigits.length>13){
        feedback('Informe nome, telefone válido'+(email.required?' e e-mail válido':'')+'.','error','Confira seus dados');
        if(!form.checkValidity())form.reportValidity();else phone.focus();
        return;
      }
      var endpoint='https://script.google.com/macros/s/AKfycbxxA_8OOrK8oSJk6dFSC4bSvIHxICKLYG6ZpalORyFnM5fe-I4eLil-KGsKyoD31NMWlg/exec';
      if(!/^https:\/\//i.test(endpoint)){feedback('Configure um endpoint HTTPS do FormSender antes de enviar.','error','Configuração necessária');return;}
      if(window.__IMOBIFY_EDITOR__){feedback('Prévia do editor: envio de agendamento desativado.','info','Modo de edição');return;}
      if(!form.dataset.financialReady && window.ImobifyFinancialFlow && window.ImobifyFinancialFlow.isEnabled(mount.closest('.ags-section').dataset)){
        busy=true;
        window.ImobifyFinancialFlow.launch(mount.closest('.ags-section').dataset).then(function(results){
          window.ImobifyFinancialFlow.addToForm(form,results);form.dataset.financialReady='1';busy=false;
          if(typeof form.requestSubmit==='function')form.requestSubmit(submit);else submit.click();
        }).catch(function(err){busy=false;console.warn('[Agendamento financeiro]',err)});
        return;
      }
      busy=true;submit.disabled=true;submit.classList.add('is-sending');submit.setAttribute('aria-busy','true');if(panelSubmit){panelSubmit.disabled=true;panelSubmit.classList.add('is-sending');panelSubmit.setAttribute('aria-busy','true');}statusShow('Enviando solicitação...','');
      var bookingItem=dates.find(function(item){return item.available&&iso(item.date)===selected;});
      if(!bookingItem){feedback('A data selecionada não está mais disponível.','error','Data indisponível');busy=false;submit.disabled=false;submit.classList.remove('is-sending');if(panelSubmit){panelSubmit.disabled=false;panelSubmit.classList.remove('is-sending');panelSubmit.removeAttribute('aria-busy');}return;}
      var bookingDate=bookingItem.date;
      var chosenTurn=turn.value;
      var product=safe(settings.product),summary=['Solicitação de agendamento de visita','Empreendimento: '+product,'Data solicitada: '+format(bookingDate),'Turno preferido: '+turn.value,'Fuso horário do empreendimento: '+timeZone,'Status: aguardando confirmação da equipe'].join('\n');
      if(smartPlantContext){
        var plantLines=['Planta selecionada:',
          smartPlantContext.plantTitle?'Planta: '+smartPlantContext.plantTitle:'',
          smartPlantContext.area?'Metragem: '+smartPlantContext.area:'',
          smartPlantContext.plantCode?'Identificador: '+smartPlantContext.plantCode:'',
          smartPlantContext.message?'Mensagem: '+smartPlantContext.message:''].filter(Boolean);
        summary+='\n\n'+plantLines.join('\n');
      }
      var payload=new FormData();
      payload.append('produto',product);payload.append('nome',safe(form.elements.nome.value));
      payload.append('email',showEmail?safe(email.value):'');payload.append('telefone',safe(phone.value));
      payload.append('dataHora',stampAtTimeZone(timeZone));
      payload.append('msg',summary);payload.append('origem','Agendamento Sender');payload.append('assunto','Solicitação de agendamento');
      if(form.elements.condicoesFinanceiras){payload.append('condicoesFinanceiras',form.elements.condicoesFinanceiras.value);payload.set('msg',summary+'\n\nCondições financeiras:\n'+form.elements.condicoesFinanceiras.value)}
      if(smartPlantContext){
        payload.append('smartPlantId',smartPlantContext.plantId);
        payload.append('smartPlantCode',smartPlantContext.plantCode);
        payload.append('smartPlant',smartPlantContext.plantTitle);
        payload.append('smartPlantArea',smartPlantContext.area);
        payload.append('origemSelecao','Smart Plant');
      }
      payload.append('agendamento',format(bookingDate)+' — '+turn.value);
      payload.append('agendamentoData',format(bookingDate));payload.append('agendamentoDataISO',selected);
      payload.append('agendamentoTurno',turn.value);payload.append('agendamentoFuso',timeZone);payload.append('agendamentoStatus','Pendente de confirmação');
      fetch(endpoint,{method:'POST',body:payload}).then(function(response){
        if(!response.ok)throw new Error('Servidor respondeu '+response.status);
        return response.text();
      }).then(function(body){
        var data;try{data=JSON.parse(body);}catch(_){data=null;}
        if(data&&(data.success===false||data.ok===false||data.status==='error'))throw new Error(data.message||'O servidor rejeitou a solicitação.');
        if(/^\s*(erro|error|falha)\b/i.test(body))throw new Error('O servidor retornou erro.');
        form.reset();delete form.dataset.financialReady;var fin=form.querySelector('[name=condicoesFinanceiras]');if(fin)fin.remove();syncTurns();
        smartPlantContext=null;delete mount.dataset.smartPlantSelected;
        if(selectedPlantLabel){selectedPlantLabel.textContent='';selectedPlantLabel.hidden=true;}
        feedback(safe(settings.successMessage)||'Solicitação recebida. Aguarde nossa confirmação.','success','Solicitação enviada!');
        mount.dispatchEvent(new CustomEvent('agendamento-sender:success',{bubbles:true,detail:{data:selected,turno:chosenTurn,produto:product,timeZone:timeZone}}));
      }).catch(function(error){console.warn('[Agendamento Sender]',error);feedback('Não foi possível enviar sua solicitação. Verifique a conexão e tente novamente.','error','Falha no envio');})
      .finally(function(){busy=false;submit.disabled=false;submit.classList.remove('is-sending');submit.removeAttribute('aria-busy');if(panelSubmit){panelSubmit.disabled=false;panelSubmit.classList.remove('is-sending');panelSubmit.removeAttribute('aria-busy');}});
    });
    draw();
  }
  function boot(){document.querySelectorAll(ROOT).forEach(init);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
