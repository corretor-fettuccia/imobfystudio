(function () {
  'use strict';
function configureFixedBackgrounds(){document.querySelectorAll('.formsenderV4_section[data-fixed-background="true"]').forEach(function(el){var url=el.dataset.backgroundImage||'';if(/^https:\/\//i.test(url)){el.style.setProperty('--sender-fixed-image','url('+JSON.stringify(url)+')')}else{el.style.removeProperty('--sender-fixed-image')}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',configureFixedBackgrounds);else configureFixedBackgrounds();


  function enabled(value) {
    return value === 'true' || value === '1' || value === 'on';
  }



  function quickQuestion(mount, index) {
    var prefix = 'quickQ' + index;
    var key = prefix.charAt(0).toLowerCase() + prefix.slice(1);
    function ds(suffix) { return mount.dataset[key + suffix] || ''; }
    var type = ds('Type') || 'single';
    var options = ds('Options').split('|').map(function (item) { return item.trim(); }).filter(Boolean);
    if (type === 'yesno') options = ['Sim', 'Não'];
    if (type === 'truefalse') options = ['Verdadeiro', 'Falso'];
    return {
      enabled: enabled(ds('Enabled')),
      label: ds('Label') || ('Pergunta ' + index),
      type: type,
      options: options,
      required: true
    };
  }

  function applyPossibilitySummary(mount, explicitSummary) {
    var summary = String(explicitSummary || '');
    if (!summary) { try { summary = sessionStorage.getItem('imobify:possibility-path-summary') || ''; } catch (_) {} }
    if (!summary) return;
    var form = mount && mount.querySelector('form');
    if (!form) return;
    var msg = form.querySelector('textarea[name="msg"]');
    if (msg && !msg.value.trim()) msg.value = summary;
    var hidden = form.querySelector('input[name="diagnosticoPossibilidade"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'diagnosticoPossibilidade'; form.appendChild(hidden); }
    hidden.value = summary;
  }


  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function openQuickComplement(instance, config) {
    return new Promise(function (resolve) {
      var questions = (config.questions || []).filter(function (q) { return q && q.enabled !== false && q.label; });
      if (!questions.length) { resolve([]); return; }
      var old = document.getElementById('quick_' + instance.uid); if (old) old.remove();
      function choices(q) {
        if (q.type === 'yesno') return ['Sim','Não'];
        if (q.type === 'truefalse') return ['Verdadeiro','Falso'];
        return Array.isArray(q.options) ? q.options : [];
      }
      var overlay = document.createElement('div');
      overlay.id = 'quick_' + instance.uid;
      overlay.className = 'formsenderCSS_quick-overlay';
      overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
      overlay.innerHTML = '<div class="formsenderCSS_quick-card">' +
        '<div class="formsenderCSS_quick-head"><span class="formsenderCSS_quick-kicker">Só mais um detalhe</span>' +
        '<h3>' + escapeHtml(config.title || 'Antes de finalizar, só me confirma rapidinho…') + '</h3>' +
        (config.copy ? '<p>' + escapeHtml(config.copy) + '</p>' : '') + '</div>' +
        (questions.length > 1 ? '<div class="formsenderCSS_quick-progress" aria-live="polite"><span data-quick-current>1</span> de ' + questions.length + '</div>' : '') +
        '<div class="formsenderCSS_quick-questions">' + questions.map(function (q, i) {
          return '<fieldset class="formsenderCSS_quick-question' + (i === 0 ? ' is-active' : '') + '" data-quick-question="' + i + '">' +
            '<legend>' + escapeHtml(q.label) + ' *</legend>' +
            '<div class="formsenderCSS_quick-options">' + choices(q).map(function (option) {
              return '<button type="button" class="formsenderCSS_quick-option" data-value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</button>';
            }).join('') + '</div><small>Selecione uma opção para continuar.</small></fieldset>';
        }).join('') + '</div>' +
        '<div class="formsenderCSS_quick-actions">' +
        '<button type="button" class="formsenderCSS_quick-confirm">' + escapeHtml(config.confirmText || 'Concluir envio') + '</button></div></div>';
      document.body.appendChild(overlay);
      document.documentElement.classList.add('formsender-quick-open');
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      var selected = new Map();
      var activeIndex = 0;
      var isMobile = false;
      try { isMobile = window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : window.innerWidth <= 640; } catch (_) {}
      var progressCurrent = overlay.querySelector('[data-quick-current]');
      var questionsWrap = overlay.querySelector('.formsenderCSS_quick-questions');
      var confirmButton = overlay.querySelector('.formsenderCSS_quick-confirm');
      var quickCard = overlay.querySelector('.formsenderCSS_quick-card');
      var fitRaf = 0;
      var viewportResizeTarget = window.visualViewport || null;

      function fitMobileCard() {
        if (!isMobile || !quickCard) return;
        if (fitRaf) cancelAnimationFrame(fitRaf);
        fitRaf = requestAnimationFrame(function () {
          fitRaf = 0;
          var vw = viewportResizeTarget ? viewportResizeTarget.width : window.innerWidth;
          var vh = viewportResizeTarget ? viewportResizeTarget.height : window.innerHeight;
          var naturalWidth = Math.max(1, quickCard.offsetWidth);
          var naturalHeight = Math.max(1, quickCard.scrollHeight);
          overlay.style.setProperty('--formsender-vv-width', Math.round(vw) + 'px');
          overlay.style.setProperty('--formsender-vv-height', Math.round(vh) + 'px');
          var availableWidth = Math.max(1, vw - 24);
          var availableHeight = Math.max(1, vh - 24);
          var scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
          if (!isFinite(scale) || scale <= 0) scale = 1;
          quickCard.style.setProperty('--formsender-mobile-scale', String(Math.max(.55, scale)));
        });
      }

      function currentNode(index) { return overlay.querySelector('[data-quick-question="' + index + '"]'); }
      function currentAnswer(index) {
        var raw = selected.get(index);
        return Array.isArray(raw) ? raw.join(', ') : (raw || '');
      }
      function updateMobileHeight() {
        if (!isMobile || !questionsWrap) return;
        /* A pergunta ativa permanece no fluxo normal. Não fixamos a altura do wrapper:
           isso evita que opções maiores que a etapa anterior vazem para fora do card. */
        questionsWrap.style.removeProperty('height');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { fitMobileCard(); });
        });
      }
      function updateActionLabel() {
        if (!confirmButton) return;
        if (!isMobile) {
          confirmButton.hidden = false;
          confirmButton.textContent = config.confirmText || 'Concluir envio';
          overlay.classList.add('has-mobile-action');
          return;
        }
        var q = questions[activeIndex];
        var needsAction = q && (q.type || 'single') === 'multiple';
        confirmButton.hidden = !needsAction;
        overlay.classList.toggle('has-mobile-action', !!needsAction);
        if (needsAction) confirmButton.textContent = activeIndex < questions.length - 1 ? 'Concluir seleção' : (config.confirmText || 'Concluir envio');
      }
      function showStep(nextIndex, immediate) {
        if (!isMobile) return;
        nextIndex = Math.max(0, Math.min(questions.length - 1, nextIndex));
        var oldNode = currentNode(activeIndex);
        var newNode = currentNode(nextIndex);
        if (!newNode || nextIndex === activeIndex) { updateMobileHeight(); updateActionLabel(); return; }
        function activate() {
          if (oldNode) oldNode.classList.remove('is-active','is-leaving');
          activeIndex = nextIndex;
          newNode.classList.add('is-active');
          if (progressCurrent) progressCurrent.textContent = String(activeIndex + 1);
          updateActionLabel();
          updateMobileHeight();
          requestAnimationFrame(function () { newNode.classList.add('is-entered'); });
          setTimeout(function () { newNode.classList.remove('is-entered'); }, 220);
        }
        if (immediate || !oldNode) activate();
        else {
          oldNode.classList.add('is-leaving');
          setTimeout(activate, 140);
        }
      }
      function validateIndex(index) {
        var q = questions[index];
        var answer = currentAnswer(index);
        var node = currentNode(index);
        if (q && !answer) { if (node) node.classList.add('has-error'); return false; }
        if (node) node.classList.remove('has-error');
        return true;
      }
      function collectAnswers() {
        var valid = true;
        var answers = questions.map(function (q, index) {
          var answer = currentAnswer(index);
          if (!answer) { valid = false; var node = currentNode(index); if (node) node.classList.add('has-error'); }
          return { label:q.label, answer:answer };
        });
        return { valid:valid, answers:answers };
      }
      function cleanup() {
        document.documentElement.classList.remove('formsender-quick-open');
        if (fitRaf) cancelAnimationFrame(fitRaf);
        window.removeEventListener('resize', fitMobileCard);
        window.removeEventListener('orientationchange', fitMobileCard);
        if (viewportResizeTarget && viewportResizeTarget.removeEventListener) viewportResizeTarget.removeEventListener('resize', fitMobileCard);
        document.removeEventListener('keydown', blockEscape, true);
        overlay.classList.add('is-closing');
        setTimeout(function () { overlay.remove(); }, 180);
      }
      function finish(answers) {
        cleanup();
        resolve({ cancelled:false, answers:answers || [] });
      }

      overlay.querySelectorAll('.formsenderCSS_quick-option').forEach(function (button) {
        button.addEventListener('click', function () {
          var fieldset = button.closest('[data-quick-question]');
          var index = Number(fieldset.dataset.quickQuestion); var q = questions[index]; var value = button.dataset.value || '';
          if ((q.type || 'single') === 'multiple') {
            var values = selected.get(index) || [];
            var next = values.indexOf(value) >= 0 ? values.filter(function (v) { return v !== value; }) : values.concat([value]);
            selected.set(index, next); button.classList.toggle('is-selected', next.indexOf(value) >= 0);
          } else {
            selected.set(index, value);
            fieldset.querySelectorAll('.formsenderCSS_quick-option').forEach(function (el) { el.classList.toggle('is-selected', el === button); });
          }
          fieldset.classList.remove('has-error');
          if (isMobile && (q.type || 'single') !== 'multiple' && index === activeIndex) {
            if (index < questions.length - 1) {
              setTimeout(function () { showStep(index + 1, false); }, 110);
            } else {
              setTimeout(function () {
                var result = collectAnswers();
                if (result.valid) finish(result.answers);
              }, 110);
            }
          }
        });
      });

      confirmButton.addEventListener('click', function () {
        if (isMobile) {
          var currentQuestion = questions[activeIndex];
          if (!currentQuestion || (currentQuestion.type || 'single') !== 'multiple') return;
          if (!validateIndex(activeIndex)) return;
          if (activeIndex < questions.length - 1) {
            showStep(activeIndex + 1, false);
            return;
          }
        }
        var result = collectAnswers();
        if (result.valid) finish(result.answers);
        else if (isMobile) {
          var firstInvalid = questions.findIndex(function (q, index) { return !currentAnswer(index); });
          if (firstInvalid >= 0) showStep(firstInvalid, true);
        }
      });
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      function blockEscape(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
      document.addEventListener('keydown', blockEscape, true);

      if (isMobile) {
        overlay.classList.add('is-mobile-steps');
        updateActionLabel();
        updateMobileHeight();
        window.addEventListener('resize', fitMobileCard, { passive:true });
        window.addEventListener('orientationchange', fitMobileCard, { passive:true });
        if (viewportResizeTarget && viewportResizeTarget.addEventListener) viewportResizeTarget.addEventListener('resize', fitMobileCard, { passive:true });
        setTimeout(fitMobileCard, 40);
      }
    });
  }

  function appendQuickAnswers(instance, answers) {
    var answered = (answers || []).filter(function (item) { return item && String(item.answer || '').trim(); });
    if (!answered.length) return;
    var block = answered.map(function (item) { return item.label + '\n' + item.answer + ';'; }).join('\n\n');
    var form = instance.form; if (!form) return;
    var msg = form.querySelector('[name="msg"]');
    if (!msg) { msg = document.createElement('input'); msg.type = 'hidden'; msg.name = 'msg'; form.appendChild(msg); }
    var original = String(msg.value || '').trim();
    msg.value = [original, 'Informações complementares:', block].filter(Boolean).join('\n\n');
    var hidden = form.querySelector('[name="complementacaoRapida"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='complementacaoRapida'; form.appendChild(hidden); }
    hidden.value = block;
    answered.forEach(function (item, index) {
      var input = form.querySelector('[name="qualificacao_' + (index+1) + '"]');
      if (!input) { input=document.createElement('input'); input.type='hidden'; input.name='qualificacao_' + (index+1); form.appendChild(input); }
      input.value = item.label + '\n' + item.answer + ';';
    });
  }

  function installQuickComplement(instance, config) {
    if (!instance || !config) return;
    var original = instance.handleSubmit.bind(instance);
    var opening = false;
    instance.handleSubmit = function (event) {
      if (opening) { event && event.preventDefault && event.preventDefault(); return; }
      event && event.preventDefault && event.preventDefault();
      if (!instance.validarCampos()) { instance.mostrarNotificacao('error','Preencha todos os campos obrigatórios.','Atenção!'); return; }
      opening = true;
      window.ImobifyFinancialFlow.launch(config.financial || {}).then(function (financeAnswers) {
        window.ImobifyFinancialFlow.addToForm(instance.form, financeAnswers);
        return (config.enabled && (config.questions || []).length) ? openQuickComplement(instance, config) : [];
      }).then(function (result) {
        if (result && result.cancelled) { opening = false; return; }
        var answers = result && Array.isArray(result.answers) ? result.answers : (Array.isArray(result) ? result : []);
        appendQuickAnswers(instance, answers);
        opening = false;
        original({ preventDefault:function () {} });
      }).catch(function () { opening = false; });
    };
  }

  function configureAutocomplete(instance, shouldEnable) {
    if (!instance || !instance.form) return;
    var fields = [
      { name:'nome', token:'name', extra:{ autocapitalize:'words' } },
      { name:'email', token:'email', extra:{ inputmode:'email', autocapitalize:'none', spellcheck:'false' } },
      { name:'telefone', token:'tel', extra:{ inputmode:'tel' } }
    ];
    fields.forEach(function (item) {
      var input = instance.form.querySelector('[name="' + item.name + '"]');
      if (!input) return;
      input.setAttribute('autocomplete', shouldEnable ? item.token : 'off');
      Object.keys(item.extra || {}).forEach(function (key) { input.setAttribute(key, item.extra[key]); });
    });
    instance.form.setAttribute('autocomplete', shouldEnable ? 'on' : 'off');
  }

  function initialize() {
    document.querySelectorAll('[data-plugin="form-sender-v4"] .formsenderV4_mount:not([data-initialized])').forEach(function (mount, index) {
      mount.dataset.initialized = 'true';
      mount.id = mount.id || 'formsender-v4-' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 7);

      if (!window.formsenderJS || typeof window.formsenderJS.Plugin !== 'function') {
        mount.innerHTML = '<p>Não foi possível inicializar o Form.v4.</p>';
        return;
      }

      var endpoint = 'https://script.google.com/macros/s/AKfycbxxA_8OOrK8oSJk6dFSC4bSvIHxICKLYG6ZpalORyFnM5fe-I4eLil-KGsKyoD31NMWlg/exec';
      if (!endpoint) {
        mount.innerHTML = '<p>Configure o endpoint do Form.v4 no editor.</p>';
        return;
      }

      if (window.__IMOBIFY_EDITOR__) {
        mount.addEventListener('submit', function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);
      }

      try {
        var quickConfig = {
          enabled: enabled(mount.dataset.quickComplement),
          title: mount.dataset.quickTitle || 'Antes de finalizar, só me confirma rapidinho…',
          copy: mount.dataset.quickCopy || '',
          confirmText: mount.dataset.quickConfirmText || 'Concluir envio',
          financial: mount.closest(".formsenderV4_section").dataset,
          questions: [quickQuestion(mount, 1), quickQuestion(mount, 2), quickQuestion(mount, 3), quickQuestion(mount, 4)].filter(function (q) { return q.enabled; })
        };
        var instance = new window.formsenderJS.Plugin('#' + mount.id, {
          produto: mount.dataset.product || 'The Garden - New Edition',
          endpoint: endpoint,
          textoBotao: mount.dataset.buttonText || 'Enviar Mensagem',
          mostrarMensagem: enabled(mount.dataset.showMessage),
          mostrarCheckboxes: enabled(mount.dataset.showCheckboxes),
          mostrarDataNasc: enabled(mount.dataset.showBirthdate),
          notificacao: function (type, message, title) {
            if (type === 'success') return;
            if (typeof window.notify_Send_notification === 'function') {
              window.notify_Send_notification(type, message, title, 'fas fa-exclamation-triangle');
            } else {
              window.alert(title + ': ' + message);
            }
          },
          onSuccess: function () {
            if (typeof window.notify_Send_notification === 'function') {
              window.notify_Send_notification(
                'success',
                mount.dataset.successMessage || 'Nosso consultor entrará em contato!',
                mount.dataset.successTitle || 'Fique atento',
                mount.dataset.successAvatar || ''
              );
            }
          },
          onError: function (error) {
            console.warn('[Form.v4]', error);
          }
        });
        mount.formsenderV4 = instance;
        configureAutocomplete(instance, enabled(mount.dataset.fieldAutocomplete));
        installQuickComplement(instance, quickConfig);
        applyPossibilitySummary(mount);
      } catch (error) {
        console.error('[Form.v4]', error);
        mount.innerHTML = '<p>Erro ao carregar o formulário: ' + String(error.message || error) + '</p>';
      }
    });
  }

  window.addEventListener('imobify:possibility-path-complete', function (event) { document.querySelectorAll('[data-plugin="form-sender-v4"] .formsenderV4_mount').forEach(function (mount) { applyPossibilitySummary(mount, event.detail && event.detail.summary); }); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
