/**
 * DialKit — Live timing control panel
 * Press Ctrl+Shift+D to toggle open/close.
 */

function initDialKit(TIMING, TIMER_BLOCK, BUTTONS) {
  const DIALS = [
    // ── Start ──────────────────────────────────────────────
    { group: 'Start',  obj: TIMING,      key: 'timerBlockIn',  label: 'Timer block in',  min: 0,   max: 600, step: 10 },
    { group: 'Start',  obj: TIMING,      key: 'firstBtnIn',    label: 'First button in', min: 0,   max: 600, step: 10 },
    { group: 'Start',  obj: TIMING,      key: 'btnStagger',    label: 'Button stagger',  min: 0,   max: 300, step: 10 },
    // ── Stop ───────────────────────────────────────────────
    { group: 'Stop',   obj: TIMING,      key: 'activeBtnsOut', label: 'Buttons exit at', min: 0,   max: 600, step: 10 },
    { group: 'Stop',   obj: TIMING,      key: 'idleBtnIn',     label: 'Start btn in',    min: 0,   max: 800, step: 10 },
    // ── Config ─────────────────────────────────────────────
    { group: 'Config', obj: TIMER_BLOCK, key: 'offsetY',       label: 'Timer offsetY',   min: 0,   max: 40,  step: 1  },
    { group: 'Config', obj: TIMER_BLOCK, key: 'duration',      label: 'Timer duration',  min: 100, max: 800, step: 10 },
    { group: 'Config', obj: BUTTONS,     key: 'offsetY',       label: 'Button offsetY',  min: 0,   max: 40,  step: 1  },
    { group: 'Config', obj: BUTTONS,     key: 'duration',      label: 'Button duration', min: 100, max: 800, step: 10 },
  ];

  // ── Build panel ────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'dialkit-panel';
  Object.assign(panel.style, {
    position: 'fixed', top: '16px', right: '16px', zIndex: '99999',
    background: 'rgba(10,10,10,0.92)',
    border: '1px solid rgba(0,129,241,0.3)',
    backdropFilter: 'blur(12px)',
    padding: '14px 16px', width: '220px',
    fontFamily: '-apple-system, BlinkMacSystemFont, monospace',
    fontSize: '11px', color: 'rgba(255,255,255,0.8)',
    display: 'none', flexDirection: 'column', gap: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  });

  // Title
  const title = document.createElement('div');
  title.textContent = '⚙ DialKit';
  Object.assign(title.style, { color: '#0081f1', fontSize: '12px', fontWeight: '600', marginBottom: '2px' });
  panel.appendChild(title);

  const hint = document.createElement('div');
  hint.textContent = 'Ctrl+Shift+D to close';
  Object.assign(hint.style, { color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginBottom: '4px' });
  panel.appendChild(hint);

  // Dials
  let currentGroup = null;
  DIALS.forEach(({ group, obj, key, label, min, max, step }) => {
    if (group !== currentGroup) {
      currentGroup = group;
      const g = document.createElement('div');
      g.textContent = group;
      Object.assign(g.style, {
        color: '#0081f1', fontSize: '10px', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginTop: '4px', paddingTop: '8px',
        borderTop: '1px solid rgba(0,129,241,0.15)',
      });
      panel.appendChild(g);
    }

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', flexDirection: 'column', gap: '3px' });

    const labelRow = document.createElement('div');
    Object.assign(labelRow.style, { display: 'flex', justifyContent: 'space-between' });

    const labelEl = document.createElement('span');
    labelEl.textContent = label;

    const valEl = document.createElement('span');
    Object.assign(valEl.style, { color: '#0081f1', fontVariantNumeric: 'tabular-nums' });
    valEl.textContent = obj[key];

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min; slider.max = max; slider.step = step;
    slider.value = obj[key];
    Object.assign(slider.style, { width: '100%', accentColor: '#0081f1', cursor: 'pointer' });

    slider.addEventListener('input', () => {
      obj[key] = Number(slider.value);
      valEl.textContent = slider.value;
    });

    row.appendChild(labelRow);
    row.appendChild(slider);
    panel.appendChild(row);
  });

  document.body.appendChild(panel);

  // ── Toggle shortcut ────────────────────────────────────────────────────────
  let visible = false;
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      visible = !visible;
      panel.style.display = visible ? 'flex' : 'none';
    }
  });
}

module.exports = { initDialKit };
