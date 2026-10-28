// EZ TMS demo kit: the scripted cursor, typing, pop-ups, camera cues and player messaging
// shared by every demo page. A page calls EZDemo.start({ reset, run }) with its own steps.
//
// URL options: autoplay=0 (wait for the player), loop=0, speed=<n>, clicks=0 (no click rings),
//              platform=mac|win (pop-up style), render=1 (driven by tools/render).
(() => {
  const params = new URLSearchParams(location.search);
  const LOOP = params.get('loop') !== '0';
  const SHOW_CLICKS = params.get('clicks') !== '0';
  const SPEED = parseFloat(params.get('speed') || '1');
  const RENDER = params.get('render') === '1';
  // Browsers draw <select> and date pop-ups natively, so the kit draws lookalikes:
  // macOS menus for Mac viewers, Chrome's own list elsewhere, and Chrome's calendar on both.
  const PLATFORM = params.get('platform') || (/Mac/.test(navigator.platform || navigator.userAgent) ? 'mac' : 'win');
  if (RENDER) document.documentElement.classList.add('ezdemo-render');

  const $ = id => document.getElementById(id);
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  class Cancelled extends Error {}

  const cursor = document.createElement('div');
  cursor.id = 'ezdemoCursor';
  cursor.dataset.mode = 'arrow';
  cursor.innerHTML = `
    <svg class="c-arrow" width="24" height="26" viewBox="0 0 24 26"><path d="M5 3v16.2l4-3.8 2.6 6.1 2.9-1.2-2.6-6h5.6z" fill="#000" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>
    <svg class="c-text" width="24" height="24" viewBox="0 0 24 24"><path d="M8.5 4.5h2c.8 0 1.5.5 1.5.5s.7-.5 1.5-.5h2M8.5 19.5h2c.8 0 1.5-.5 1.5-.5s.7.5 1.5.5h2M12 5v14" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M8.5 4.5h2c.8 0 1.5.5 1.5.5s.7-.5 1.5-.5h2M8.5 19.5h2c.8 0 1.5-.5 1.5-.5s.7.5 1.5.5h2M12 5v14" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round"/></svg>
    <span class="c-pointer"><i class="fas fa-hand-pointer" style="color:#fff"></i><i class="far fa-hand-pointer" style="color:#000"></i></span>`;
  document.body.appendChild(cursor);

  const restPos = () => ({ x: innerWidth * 0.62, y: innerHeight * 0.72 });
  let pos = restPos();
  let runId = 0;
  const placeCursor = () => { cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`; window.__ezpos = pos; };
  placeCursor();

  function centerOf(el, dx = 0, dy = 0) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 + dx, y: r.top + r.height / 2 + dy };
  }

  // Camera cue for the video renderer: glide to a fixed framing (zoom + center) over `dur` ms
  let camSeq = 0;
  function cam(zoom, at = { x: innerWidth / 2, y: innerHeight / 2 }, dur = 1600) {
    window.__ezcam = { zoom, x: at.x, y: at.y, dur, id: ++camSeq };
  }

  // Native carets blink on the real clock; in render mode draw one that follows the virtual clock
  let lastKey = -1e9;
  const caret = document.createElement('div');
  caret.id = 'ezdemoCaret';
  document.body.appendChild(caret);
  const measure = document.createElement('canvas').getContext('2d');
  function drawCaret(now) {
    const el = document.activeElement;
    const ok = RENDER && el && el.tagName === 'INPUT' && el.type === 'text' && !el.classList.contains('ezdemo-date');
    if (!ok) { caret.style.display = 'none'; return; }
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    measure.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const text = cs.textTransform === 'uppercase' ? el.value.toUpperCase() : el.value;
    const fs = parseFloat(cs.fontSize);
    const x = r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft) + measure.measureText(text).width;
    const on = now - lastKey < 500 || Math.floor((now - lastKey - 500) / 530) % 2 === 1;
    caret.style.cssText = `display:${on ? 'block' : 'none'}; left:${Math.round(x)}px; top:${r.top + (r.height - fs * 1.2) / 2}px; height:${fs * 1.2}px;`;
  }
  if (RENDER) (function tick(t) { drawCaret(t); requestAnimationFrame(tick); })(0);

  // Highlight whichever pop-up item is under the demo cursor, like a real mouse hover
  function trackHover(container, selector) {
    (function tick() {
      if (!container.isConnected) return;
      const hit = document.elementFromPoint(pos.x, pos.y);
      const item = hit && container.contains(hit) ? hit.closest(selector) : null;
      container.querySelectorAll(`${selector}.is-hover`).forEach(e => e !== item && e.classList.remove('is-hover'));
      if (item) item.classList.add('is-hover');
      requestAnimationFrame(tick);
    })();
  }

  function focusField(el) {
    document.querySelectorAll('.is-focus').forEach(e => e.classList.remove('is-focus'));
    if (!el) { document.activeElement?.blur(); return; }
    if (el.classList.contains('form-control')) el.classList.add('is-focus');
    el.focus({ preventScroll: true });
  }

  function showModal(modal) {
    document.body.classList.add('modal-open');
    let bd = document.getElementById('ezdemoBackdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.className = 'modal-backdrop fade';
      bd.id = 'ezdemoBackdrop';
      document.body.appendChild(bd);
    }
    modal.style.display = 'block';
    modal.scrollTop = 0;
    void modal.offsetWidth;
    bd.classList.add('show');
    modal.classList.add('show');
  }

  function hideModal(modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    if (!document.querySelector('.modal.show')) {
      document.body.classList.remove('modal-open');
      document.getElementById('ezdemoBackdrop')?.remove();
    }
  }

  function pleaseWait(on) {
    if ($('PleaseWait')) $('PleaseWait').className = on ? 'PleaseWaitOn' : 'PleaseWaitOff';
    if ($('PleaseWaitMsg')) $('PleaseWaitMsg').className = on ? 'PleaseWaitMsgOn' : 'PleaseWaitMsgOff';
  }

  // Clear everything the kit may have left on screen; pages add their own resets on top
  function resetCommon() {
    document.querySelectorAll('.modal.show').forEach(hideModal);
    document.querySelectorAll('.ui-autocomplete, .ui-timepicker-wrapper, .tooltip, .ezdemo-ring, .ezsel, .ezcal').forEach(e => e.remove());
    document.querySelectorAll('.is-hover, .is-focus').forEach(e => e.classList.remove('is-hover', 'is-focus'));
    document.querySelectorAll('.dropdown-menu.show').forEach(e => e.classList.remove('show'));
    const screens = document.querySelectorAll('.ezscreen');
    screens.forEach((el, i) => { el.hidden = i !== 0; });
    pleaseWait(false);
    document.activeElement?.blur();
    pos = restPos();
    cursor.dataset.mode = 'arrow';
    placeCursor();
  }

  // Everything a demo script uses, bound to one run so a restarted demo stops the old one cleanly
  function context(id) {
    const alive = () => { if (id !== runId) throw new Cancelled(); };
    const sleep = ms => new Promise((res, rej) => setTimeout(() => (id !== runId ? rej(new Cancelled()) : res()), ms / SPEED));
    const frame = step => new Promise((res, rej) => {
      const tick = now => { if (id !== runId) return rej(new Cancelled()); step(now) ? res() : requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });

    function moveTo(target, { mode = 'arrow', dur } = {}) {
      const to = target instanceof Element ? centerOf(target) : target;
      const from = { ...pos };
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const ms = (dur ?? Math.min(1050, Math.max(380, 260 + dist * 0.75))) / SPEED;
      const bend = (Math.random() - .5) * Math.min(80, dist * .18);
      const start = performance.now();
      return frame(now => {
        const t = Math.min(1, (now - start) / ms), k = ease(t);
        const arc = Math.sin(Math.PI * k) * bend;
        pos = { x: from.x + (to.x - from.x) * k - arc * (to.y - from.y) / (dist || 1), y: from.y + (to.y - from.y) * k + arc * (to.x - from.x) / (dist || 1) };
        if (t > .55) cursor.dataset.mode = mode;
        placeCursor();
        return t >= 1;
      });
    }

    async function click() {
      alive();
      cursor.classList.add('press');
      if (SHOW_CLICKS) {
        const ring = document.createElement('div');
        ring.className = 'ezdemo-ring';
        ring.style.left = pos.x + 'px'; ring.style.top = pos.y + 'px';
        document.body.appendChild(ring);
        setTimeout(() => ring.remove(), 600);
      }
      await sleep(110);
      cursor.classList.remove('press');
      await sleep(90);
    }

    // Move to a button or link, show its hover state, and click it
    async function press(el, { mode = 'pointer', hold = 250 } = {}) {
      await moveTo(el, { mode });
      el.classList.add('is-hover');
      await sleep(hold);
      await click();
      el.classList.remove('is-hover');
    }

    async function type(el, text, cps = 15) {
      for (const ch of text) {
        alive();
        el.value += ch;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        lastKey = performance.now();
        await sleep(1000 / cps * (0.6 + Math.random() * 0.8));
      }
    }

    async function fillText(el, text, cps) {
      await moveTo(el, { mode: 'text' });
      await click();
      focusField(el);
      await sleep(180);
      await type(el, text, cps);
      await sleep(220);
    }

    function scrollElement(el, to, ms) {
      const from = el.scrollTop, start = performance.now();
      return frame(now => {
        const t = Math.min(1, (now - start) / (ms / SPEED));
        el.scrollTop = from + (to - from) * ease(t);
        return t >= 1;
      });
    }

    function openSelectPopup(sel) {
      const r = sel.getBoundingClientRect();
      const cur = sel.selectedIndex;
      const pop = document.createElement('div');
      pop.className = `ezsel ezsel-${PLATFORM}`;
      pop.innerHTML = [...sel.options].map((o, i) =>
        `<div class="ezsel-item${i === cur ? ' is-checked' : ''}" data-i="${i}">${o.text}</div>`).join('');
      document.body.appendChild(pop);
      const itemH = pop.querySelector('.ezsel-item').offsetHeight;
      if (PLATFORM === 'mac') {
        // macOS opens the menu so the current choice sits right over the control
        pop.style.minWidth = `${r.width + 10}px`;
        pop.style.left = `${r.left - 5}px`;
        const pad = 5, height = Math.min(pop.scrollHeight, innerHeight - 16);
        let top = r.top + (r.height - itemH) / 2 - pad - cur * itemH;
        top = Math.min(Math.max(top, 8), innerHeight - 8 - height);
        pop.style.top = `${top}px`;
        pop.style.height = `${height}px`;
      } else {
        // Chrome on Windows drops a list the width of the control, up to 20 rows, flipping up if needed
        pop.style.left = `${r.left}px`;
        pop.style.width = `${r.width}px`;
        pop.style.font = getComputedStyle(sel).font;
        const height = Math.min(pop.scrollHeight, itemH * 20 + 2);
        pop.style.height = `${height}px`;
        pop.style.top = `${height <= innerHeight - r.bottom - 8 ? r.bottom : Math.max(8, r.top - height)}px`;
        pop.querySelector(`[data-i="${cur}"]`).classList.add('is-hover');
      }
      trackHover(pop, '.ezsel-item');
      return pop;
    }

    async function chooseSelect(sel, value) {
      await moveTo(sel, { mode: 'arrow' });
      await click();
      focusField(sel);
      const pop = openSelectPopup(sel);
      await sleep(420);
      const idx = [...sel.options].findIndex(o => o.value === value);
      const target = pop.querySelector(`[data-i="${idx}"]`);
      const t = target.offsetTop, h = target.offsetHeight;
      if (t + h > pop.scrollTop + pop.clientHeight - 8) {
        await scrollElement(pop, Math.min(t - pop.clientHeight / 2, pop.scrollHeight - pop.clientHeight), 650);
        await sleep(150);
      }
      await moveTo(centerOf(target, -target.offsetWidth / 2 + 70), { mode: 'arrow', dur: 520 });
      await sleep(280);
      await click();
      pop.remove();
      sel.value = value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(300);
    }

    // Chrome's calendar pop-up for <input type="date"> (faked as text so it always shows US dates)
    function openDatePicker(input, month) {
      const r = input.getBoundingClientRect();
      const first = new Date(month.getFullYear(), month.getMonth(), 1);
      const start = new Date(first); start.setDate(1 - first.getDay());
      const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const cells = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const cls = ['ezcal-day'];
        if (d.getMonth() !== first.getMonth()) cls.push('is-other');
        if (d.toDateString() === EZDemo.TODAY.toDateString()) cls.push('is-today');
        return `<div class="${cls.join(' ')}" data-date="${d.getMonth() + 1}/${d.getDate()}">${d.getDate()}</div>`;
      }).join('');
      const pop = document.createElement('div');
      pop.className = 'ezcal';
      pop.innerHTML = `
        <div class="ezcal-head">
          <div class="ezcal-month">${label}<svg viewBox="0 0 10 6"><path d="M0 0h10L5 6z" fill="currentColor"/></svg></div>
          <div class="ezcal-nav">
            <svg viewBox="0 0 12 12"><path d="M2.5 8 6 4.5 9.5 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
            <svg viewBox="0 0 12 12"><path d="M2.5 4 6 7.5 9.5 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
          </div>
        </div>
        <div class="ezcal-week">${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<div>${d}</div>`).join('')}</div>
        <div class="ezcal-grid">${cells}</div>
        <div class="ezcal-foot"><span>Clear</span><span>Today</span></div>`;
      document.body.appendChild(pop);
      const below = innerHeight - r.bottom - 8;
      pop.style.left = `${r.left}px`;
      pop.style.top = `${pop.offsetHeight <= below ? r.bottom + 1 : r.top - pop.offsetHeight - 1}px`;
      trackHover(pop, '.ezcal-day');
      return pop;
    }

    async function pickDate(input, month, day) {
      const icon = input.parentElement.querySelector('.ezdemo-cal') || input;
      await moveTo(icon, { mode: 'arrow' });
      await click();
      focusField(input);
      const pop = openDatePicker(input, month);
      await sleep(500);
      const cell = pop.querySelector(`.ezcal-day:not(.is-other)[data-date="${month.getMonth() + 1}/${day}"]`);
      await moveTo(cell, { mode: 'arrow', dur: 600 });
      await sleep(300);
      await click();
      cell.classList.add('is-selected');
      await sleep(120);
      pop.remove();
      input.value = `${String(month.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${month.getFullYear()}`;
      await sleep(300);
    }

    // jQuery UI autocomplete, markup identical to the app's: type, wait for the list, pick an item
    async function autocomplete(input, typed, items, pickIndex, { cps = 11 } = {}) {
      await moveTo(input, { mode: 'text' });
      await click();
      focusField(input);
      await sleep(250);
      await type(input, typed, cps);
      await sleep(420);
      const r = input.getBoundingClientRect();
      const ul = document.createElement('ul');
      ul.className = 'ui-menu ui-widget ui-widget-content ui-autocomplete ui-front';
      ul.style.cssText = `top:${r.bottom}px; left:${r.left}px; position:fixed;`;
      // items are strings, or { text, cls } for entries the app colours (e.g. carriers: text-success / text-danger)
      ul.innerHTML = items.map(t => (typeof t === 'string' ? { text: t, cls: '' } : t))
        .map(t => `<li class="${t.cls ? t.cls + ' ' : ''}ui-menu-item"><div class="ui-menu-item-wrapper">${t.text}</div></li>`).join('');
      document.body.appendChild(ul);
      ul.style.width = Math.max(ul.offsetWidth + 1, r.width) + 'px';
      // like jQuery UI's collision handling, keep the list inside the window
      ul.style.left = Math.max(2, Math.min(r.left, innerWidth - ul.offsetWidth - 2)) + 'px';
      await sleep(650);
      const option = ul.querySelectorAll('.ui-menu-item-wrapper')[pickIndex];
      await moveTo(option, { mode: 'arrow', dur: 520 });
      option.classList.add('ui-state-active');
      await sleep(320);
      await click();
      ul.remove();
      const picked = items[pickIndex];
      return typeof picked === 'string' ? picked : picked.text;
    }

    // jquery-timepicker list (H:i, hourly) plus the Bootstrap "Early Time"/"Late Time" tooltip
    async function pickTime(input, label, hour, scrollToHour = 7) {
      await moveTo(input, { mode: 'text' });
      await click();
      focusField(input);
      const r = input.getBoundingClientRect();
      const wrap = document.createElement('div');
      wrap.className = 'ui-timepicker-wrapper';
      wrap.style.cssText = `position:fixed; top:${r.bottom}px; left:${r.left}px;`;
      wrap.innerHTML = '<ul class="ui-timepicker-list">' +
        Array.from({ length: 24 }, (_, h) => `<li class="${h < 12 ? 'ui-timepicker-am' : 'ui-timepicker-pm'}" data-h="${h}">${String(h).padStart(2, '0')}:00</li>`).join('') + '</ul>';
      document.body.appendChild(wrap);
      wrap.scrollTop = wrap.querySelector('li').offsetHeight * scrollToHour;
      // Only some fields carry a Bootstrap tooltip ("Early Time" / "Late Time"); pass label = null for none
      const tip = document.createElement('div');
      if (label) {
        tip.className = 'tooltip fade bs-tooltip-top show';
        tip.setAttribute('role', 'tooltip');
        tip.innerHTML = `<div class="arrow"></div><div class="tooltip-inner">${label}</div>`;
        document.body.appendChild(tip);
        tip.style.cssText = `position:fixed; top:${r.top - tip.offsetHeight}px; left:${r.left + r.width / 2 - tip.offsetWidth / 2}px;`;
        tip.querySelector('.arrow').style.left = (tip.offsetWidth / 2 - 6) + 'px';
      }
      await sleep(600);
      const li = wrap.querySelector(`li[data-h="${hour}"]`);
      await moveTo(li, { mode: 'arrow', dur: 480 });
      li.classList.add('ui-timepicker-selected');
      await sleep(300);
      await click();
      wrap.remove(); tip.remove();
      input.value = li.textContent;
      await sleep(300);
    }

    async function tick(checkbox) {
      await moveTo(checkbox, { mode: 'arrow' });
      await click();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(250);
    }

    // Swap which page of the app is on screen (each page is a .ezscreen block)
    function screen(name) {
      document.querySelectorAll('.ezscreen').forEach(el => { el.hidden = el.dataset.screen !== name; });
    }

    return {
      screen, sleep, moveTo, click, press, type, fillText, scrollElement, chooseSelect, pickDate, autocomplete, pickTime, tick,
      focusField, cam, centerOf, showModal, hideModal, pleaseWait, $,
      full: () => ({ x: innerWidth / 2, y: innerHeight / 2 }),
      setCursor: mode => { cursor.dataset.mode = mode; },
    };
  }

  // Tell an embedding player page what the demo is doing (ready / playing / ended)
  function emit(state) {
    if (window.parent !== window) window.parent.postMessage({ source: 'ezdemo', state }, '*');
  }

  const EZDemo = {
    TODAY: new Date(2026, 9, 28),
    PLATFORM,
    start({ reset, run }) {
      const doReset = () => { resetCommon(); reset?.(); };
      async function loop() {
        const id = ++runId;
        const k = context(id);
        try {
          emit('playing');
          do {
            doReset();
            window.__ezdone = false;
            k.cam(1, k.full(), 0);
            await run(k);
            window.__ezdone = true;
            if (LOOP) await k.sleep(800);
          } while (LOOP);
          emit('ended');
        } catch (e) { if (!(e instanceof Cancelled)) throw e; }
      }
      function stop() { runId++; doReset(); emit('ready'); }

      document.addEventListener('keydown', e => {
        if (e.key === 'r' || e.key === 'R') loop();
        if (e.key === 's' || e.key === 'S') stop();
      });
      window.ezdemo = { restart: loop, stop };
      doReset();
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      if (params.get('autoplay') !== '0') fontsReady.then(loop);
      else fontsReady.then(() => emit('ready'));
    },
  };
  window.EZDemo = EZDemo;
})();
