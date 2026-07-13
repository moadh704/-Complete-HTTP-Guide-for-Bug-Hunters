(function(){
"use strict";

/* ---------- Status bar date (real HTTP-date format) ---------- */
function httpDate(d){
  var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function pad(n){return String(n).padStart(2,'0');}
  return days[d.getUTCDay()]+', '+pad(d.getUTCDate())+' '+months[d.getUTCMonth()]+' '+d.getUTCFullYear()+' '+
         pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())+':'+pad(d.getUTCSeconds())+' GMT';
}
var sbDate=document.getElementById('sbDate');
if(sbDate){ sbDate.textContent='Date: '+httpDate(new Date()); }

/* ---------- Reduced motion: pause SMIL wire animation ---------- */
var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(prefersReduced){
  var wireSvg = document.querySelector('.wire-svg');
  if(wireSvg && typeof wireSvg.pauseAnimations === 'function'){ wireSvg.pauseAnimations(); }
}

/* ---------- Theme toggle (session only — no storage APIs in artifacts) ---------- */
var body = document.body;
var themeToggle = document.getElementById('themeToggle');
var themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
function applyTheme(theme){
  body.setAttribute('data-theme', theme);
  if(themeIcon){ themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'; }
}
var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
applyTheme(prefersLight ? 'light' : 'dark');
if(themeToggle){
  themeToggle.addEventListener('click', function(){
    var next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

/* ---------- Section nav active-state highlighting ---------- */
var navItems = document.querySelectorAll('.section-nav-item');
var sections = document.querySelectorAll('main section[id]');
if('IntersectionObserver' in window && sections.length){
  var navObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var id = entry.target.getAttribute('id');
        navItems.forEach(function(item){
          var link = item.querySelector('a');
          item.classList.toggle('active', link && link.getAttribute('href') === '#'+id);
        });
      }
    });
  }, { root:null, rootMargin:'-20% 0px -70% 0px', threshold:0 });
  sections.forEach(function(s){ navObserver.observe(s); });
}
document.querySelectorAll('.section-nav-list a').forEach(function(link){
  link.addEventListener('click', function(e){
    e.preventDefault();
    var target = document.querySelector(link.getAttribute('href'));
    if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

/* ---------- Tabs (scoped per data-tabgroup, click + arrow keys) ---------- */
document.querySelectorAll('[data-tabgroup]').forEach(function(group){
  var tabs = Array.prototype.slice.call(group.querySelectorAll('.tab'));
  function activate(tab){
    tabs.forEach(function(t){ t.setAttribute('aria-selected','false'); });
    group.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
    tab.setAttribute('aria-selected','true');
    var panel = document.getElementById(tab.getAttribute('aria-controls'));
    if(panel){ panel.classList.add('active'); }
    tab.focus();
  }
  tabs.forEach(function(tab, i){
    tab.addEventListener('click', function(){ activate(tab); });
    tab.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight'){ e.preventDefault(); activate(tabs[(i+1)%tabs.length]); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); activate(tabs[(i-1+tabs.length)%tabs.length]); }
    });
  });
});

/* ---------- Collapsibles ---------- */
document.querySelectorAll('.collapsible').forEach(function(btn){
  btn.addEventListener('click', function(){
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if(!panel) return;
    panel.style.maxHeight = expanded ? null : (panel.scrollHeight + 'px');
  });
});

/* ---------- Copy buttons ---------- */
document.querySelectorAll('.copy-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var targetId = btn.getAttribute('data-copy-target');
    var el = targetId ? document.getElementById(targetId) : null;
    var text = el ? el.textContent : '';
    var restore = function(label){ setTimeout(function(){ btn.textContent = 'Copy'; }, 1400); btn.textContent = label; };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ restore('Copied!'); }).catch(function(){ restore('Error'); });
    } else {
      restore('Error');
    }
  });
});

/* ---------- Stats (computed from the actual DOM, not hardcoded) ---------- */
function setStat(id, selector){
  var el = document.getElementById(id);
  if(el){ el.textContent = document.querySelectorAll(selector).length; }
}
setStat('statVulns', '.vuln-card');
setStat('statStatus', '.status-row');
setStat('statTools', '.tool-card');

/* ---------- Checklist progress ---------- */
var checklistBoxes = Array.prototype.slice.call(document.querySelectorAll('#checklist input[type="checkbox"]'));
var checklistFill = document.getElementById('checklistProgress');
var checklistLabel = document.getElementById('checklistLabel');
function updateChecklist(){
  var checked = checklistBoxes.filter(function(b){ return b.checked; }).length;
  var pct = checklistBoxes.length ? (checked / checklistBoxes.length * 100) : 0;
  if(checklistFill){ checklistFill.style.width = pct + '%'; }
  if(checklistLabel){ checklistLabel.textContent = checked + ' / ' + checklistBoxes.length + ' checked'; }
}
checklistBoxes.forEach(function(b){ b.addEventListener('change', updateChecklist); });
updateChecklist();

/* ---------- Vulnerability search + filter ---------- */
var vulnSearch = document.getElementById('vulnSearch');
var vulnFilters = document.getElementById('vulnFilters');
var vulnCards = Array.prototype.slice.call(document.querySelectorAll('.vuln-card'));
var vulnEmpty = document.getElementById('vulnEmpty');
var activeFilter = 'all';
function applyVulnFilters(){
  var q = (vulnSearch && vulnSearch.value || '').trim().toLowerCase();
  var visibleCount = 0;
  vulnCards.forEach(function(card){
    var tagMatch = activeFilter === 'all' || card.getAttribute('data-tags') === activeFilter;
    var haystack = (card.getAttribute('data-search') || '') + ' ' + card.textContent.toLowerCase();
    var textMatch = !q || haystack.toLowerCase().indexOf(q) !== -1;
    var show = tagMatch && textMatch;
    card.style.display = show ? '' : 'none';
    if(show){ visibleCount++; }
  });
  if(vulnEmpty){ vulnEmpty.style.display = visibleCount ? 'none' : 'block'; }
}
if(vulnSearch){ vulnSearch.addEventListener('input', applyVulnFilters); }
if(vulnFilters){
  vulnFilters.querySelectorAll('.filter-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      vulnFilters.querySelectorAll('.filter-chip').forEach(function(c){ c.setAttribute('aria-pressed','false'); });
      chip.setAttribute('aria-pressed','true');
      activeFilter = chip.getAttribute('data-filter');
      applyVulnFilters();
    });
  });
}

/* ---------- Live request console ---------- */
(function(){
  var methodSel = document.getElementById('httpMethod');
  var urlInput = document.getElementById('requestUrl');
  var headersInput = document.getElementById('requestHeaders');
  var bodyInput = document.getElementById('requestBody');
  var bodyField = document.getElementById('requestBodyField');
  var sendBtn = document.getElementById('sendRequest');
  var resetBtn = document.getElementById('resetConsole');
  var progress = document.getElementById('consoleProgress');
  var requestView = document.getElementById('requestView');
  var responseView = document.getElementById('responseView');
  var statusChip = document.getElementById('responseStatusChip');
  var timingEl = document.getElementById('responseTiming');
  var historyRow = document.getElementById('historyRow');
  var statReqs = document.getElementById('statReqs');
  if(!sendBtn) return;

  var BODY_METHODS = ['POST','PUT','PATCH'];
  var requestCount = 0;
  var history = [];

  function toggleBodyField(){
    var show = BODY_METHODS.indexOf(methodSel.value) !== -1;
    bodyField.style.display = show ? 'block' : 'none';
  }
  methodSel.addEventListener('change', toggleBodyField);
  toggleBodyField();

  document.querySelectorAll('.preset-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      methodSel.value = chip.getAttribute('data-preset-method') || 'GET';
      urlInput.value = chip.getAttribute('data-preset-url') || '';
      bodyInput.value = chip.getAttribute('data-preset-body') || '';
      headersInput.value = '';
      toggleBodyField();
    });
  });

  function statusClass(code){
    if(code >= 200 && code < 300) return 'c2';
    if(code >= 300 && code < 400) return 'c3';
    if(code >= 400 && code < 500) return 'c4';
    return 'c5';
  }

  function renderHistory(){
    historyRow.textContent = '';
    history.slice(0,6).forEach(function(entry){
      var chip = document.createElement('span');
      chip.className = 'history-chip';
      chip.textContent = entry.method + ' ' + entry.short;
      chip.addEventListener('click', function(){
        methodSel.value = entry.method;
        urlInput.value = entry.url;
        toggleBodyField();
      });
      historyRow.appendChild(chip);
    });
  }

  sendBtn.addEventListener('click', function(){
    var method = methodSel.value;
    var url = urlInput.value.trim();
    if(!url){ urlInput.focus(); return; }

    var headers = {};
    var headersText = headersInput.value.trim();
    if(headersText){
      try{ headers = JSON.parse(headersText); }
      catch(e){
        responseView.textContent = 'Could not parse headers as JSON: ' + e.message;
        statusChip.textContent = 'ERR'; statusChip.className = 'status-chip c4'; timingEl.textContent = '';
        return;
      }
    }

    var bodyText = bodyInput.value;
    var hasBody = BODY_METHODS.indexOf(method) !== -1 && bodyText;

    var reqLines = [];
    try{
      var u = new URL(url);
      reqLines.push(method + ' ' + u.pathname + u.search + ' HTTP/1.1');
      reqLines.push('Host: ' + u.host);
    }catch(e){
      reqLines.push(method + ' ' + url + ' HTTP/1.1');
    }
    Object.keys(headers).forEach(function(k){ reqLines.push(k + ': ' + headers[k]); });
    if(hasBody){
      reqLines.push('Content-Length: ' + new TextEncoder().encode(bodyText).length);
      reqLines.push('');
      reqLines.push(bodyText);
    }
    requestView.textContent = reqLines.join('\n');

    statusChip.textContent = '···'; statusChip.className = 'status-chip pending';
    timingEl.textContent = '';
    responseView.textContent = '';
    progress.style.width = '25%';
    sendBtn.disabled = true;

    var opts = { method: method, headers: headers };
    if(hasBody){ opts.body = bodyText; }

    var start = performance.now();
    fetch(url, opts).then(function(res){
      progress.style.width = '70%';
      return res.text().then(function(text){ return { res: res, text: text }; });
    }).then(function(result){
      var res = result.res, text = result.text;
      var elapsed = Math.round(performance.now() - start);
      var bytes = new TextEncoder().encode(text).length;
      var display = text;
      try{ display = JSON.stringify(JSON.parse(text), null, 2); }catch(e){ /* not JSON, show raw */ }

      var headerLines = [];
      res.headers.forEach(function(v,k){ headerLines.push(k + ': ' + v); });
      var statusLine = 'HTTP/1.1 ' + res.status + ' ' + (res.statusText || '');
      responseView.textContent = statusLine + '\n' + headerLines.join('\n') + '\n\n' + display;

      statusChip.textContent = res.status + (res.statusText ? (' ' + res.statusText) : '');
      statusChip.className = 'status-chip ' + statusClass(res.status);
      timingEl.textContent = elapsed + 'ms · ' + bytes + ' bytes';

      requestCount++;
      if(statReqs){ statReqs.textContent = requestCount; }
      var shortPath = url; try{ shortPath = new URL(url).pathname; }catch(e){}
      history.unshift({ method: method, url: url, short: shortPath });
      renderHistory();

      progress.style.width = '100%';
      setTimeout(function(){ progress.style.width = '0%'; }, 700);
      sendBtn.disabled = false;
    }).catch(function(err){
      responseView.textContent = 'Request failed: ' + err.message +
        '\n\nMost often this is CORS — the target has to explicitly allow cross-origin requests before a browser lets a page read the response. Try one of the presets above, or test this request with curl or a proxy tool instead.';
      statusChip.textContent = 'ERR'; statusChip.className = 'status-chip c4';
      timingEl.textContent = '';
      progress.style.width = '0%';
      sendBtn.disabled = false;
    });
  });

  resetBtn.addEventListener('click', function(){
    methodSel.value = 'GET';
    urlInput.value = 'https://jsonplaceholder.typicode.com/posts/1';
    headersInput.value = '';
    bodyInput.value = '';
    requestView.textContent = '';
    responseView.textContent = '';
    statusChip.textContent = '—'; statusChip.className = 'status-chip pending';
    timingEl.textContent = '';
    progress.style.width = '0%';
    toggleBodyField();
  });
})();

/* ---------- Quiz ---------- */
(function(){
  var checkBtn = document.getElementById('checkQuiz');
  var resetBtn = document.getElementById('resetQuiz');
  var summary = document.getElementById('quizSummary');
  var scoreEl = document.getElementById('quizScore');
  var scoreLabel = document.getElementById('quizScoreLabel');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.quiz-card'));
  if(!checkBtn) return;

  checkBtn.addEventListener('click', function(){
    var score = 0;
    cards.forEach(function(card){
      var correctIdx = card.getAttribute('data-correct');
      var options = Array.prototype.slice.call(card.querySelectorAll('.quiz-option'));
      var radios = card.querySelectorAll('input[type="radio"]');
      var selected = null;
      radios.forEach(function(r){ if(r.checked) selected = r; });
      options.forEach(function(o){ o.classList.remove('correct','incorrect'); });
      var explain = card.querySelector('.quiz-explain');
      if(explain){ explain.classList.add('show'); }
      var correctOption = options[Number(correctIdx)];
      if(selected){
        var selectedOption = selected.closest('.quiz-option');
        if(selected.value === correctIdx){
          selectedOption.classList.add('correct');
          score++;
        } else {
          selectedOption.classList.add('incorrect');
          if(correctOption){ correctOption.classList.add('correct'); }
        }
      } else if(correctOption){
        correctOption.classList.add('correct');
      }
    });
    var total = cards.length;
    scoreEl.textContent = score + ' / ' + total;
    scoreLabel.textContent = score === total
      ? 'Clean sweep.'
      : (score / total >= 0.7 ? 'Solid — check the explanations on the ones you missed.' : 'Worth another pass through the sections above.');
    summary.classList.add('show');
    summary.scrollIntoView({ behavior:'smooth', block:'nearest' });
  });

  resetBtn.addEventListener('click', function(){
    cards.forEach(function(card){
      card.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
      card.querySelectorAll('.quiz-option').forEach(function(o){ o.classList.remove('correct','incorrect'); });
      var explain = card.querySelector('.quiz-explain');
      if(explain){ explain.classList.remove('show'); }
    });
    summary.classList.remove('show');
  });
})();

})();
