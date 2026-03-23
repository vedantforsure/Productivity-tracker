/* ═══════════════════════════════════════════════════════════
 * ANIMATION STORYBOARD — Productivity Tracker
 *
 * Read top-to-bottom. Each value is ms after the trigger.
 *
 *  ── START (Idle → Active) ───────────────────────────────
 *    0ms   Start button springs out  (scale 1→0.94, fade)
 *   90ms   Timer block springs in   (scale 0.94→1, slide 8px)
 *  150ms   Stop button springs up   (scale 0.94→1, +50ms)
 *  200ms   Break button springs up  (staggered 50ms)
 *
 *  ── STOP (Active → Idle) ────────────────────────────────
 *    0ms   Timer block springs out  (scale 1→0.96, fade 200ms)
 *  200ms   Stop/Break spring out, height collapses
 *  260ms   Start button springs up
 * ═══════════════════════════════════════════════════════════ */

const TIMING = {
  // ── Start ────────────────────────────────────────────────
  startBtnOut:    0,   // Start exits immediately
  timerBlockIn:  90,   // timer block follows quickly
  firstBtnIn:   150,   // Stop appears
  btnStagger:    50,   // tight Apple-like stagger

  // ── Stop ─────────────────────────────────────────────────
  timerBlockOut:   0,  // timer fades out immediately
  activeBtnsOut: 200,  // Stop/Break exit + collapse
  idleBtnIn:     260,  // Start reappears
};

/* Timer block */
const TIMER_BLOCK = {
  offsetY:       8,                                    // subtle slide distance
  scale:      0.94,                                    // starting scale
  enterDur:    320,                                    // ms — enters slower (spring)
  exitDur:     180,                                    // ms — exits faster (snappy)
  enterEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // spring overshoot
  exitEasing:  'cubic-bezier(0.4, 0.0, 1, 1)',        // ease-in, fast out
};

/* Buttons */
const BUTTONS = {
  offsetY:       6,                                    // subtle slide
  scale:      0.95,                                    // starting scale
  enterDur:    280,                                    // ms
  exitDur:     160,                                    // ms
  enterEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // spring
  exitEasing:  'cubic-bezier(0.4, 0.0, 1, 1)',        // ease-in
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function springIn(el, { offsetY, scale, enterDur, enterEasing }, delay = 0) {
  el.style.transition = 'none';
  el.style.opacity    = '0';
  el.style.transform  = `translateY(${offsetY}px) scale(${scale})`;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transition = [
      `opacity   ${Math.round(enterDur * 0.75)}ms ${enterEasing} ${delay}ms`,
      `transform ${enterDur}ms ${enterEasing} ${delay}ms`,
    ].join(', ');
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0) scale(1)';
  }));
}

function springOut(el, { offsetY, scale, exitDur, exitEasing }, delay = 0) {
  el.style.transition = [
    `opacity   ${Math.round(exitDur * 0.8)}ms ${exitEasing} ${delay}ms`,
    `transform ${exitDur}ms ${exitEasing} ${delay}ms`,
  ].join(', ');
  el.style.opacity   = '0';
  el.style.transform = `translateY(${offsetY}px) scale(${scale})`;
}

function collapseBtn(el, { exitDur, exitEasing }, delay = 0) {
  el.style.transition = [
    `opacity        ${Math.round(exitDur * 0.8)}ms ${exitEasing} ${delay}ms`,
    `transform      ${exitDur}ms ${exitEasing} ${delay}ms`,
    `max-height     ${exitDur}ms ${exitEasing} ${delay}ms`,
    `margin-bottom  ${exitDur}ms ${exitEasing} ${delay}ms`,
    `padding-top    ${exitDur}ms ${exitEasing} ${delay}ms`,
    `padding-bottom ${exitDur}ms ${exitEasing} ${delay}ms`,
  ].join(', ');
  el.style.opacity       = '0';
  el.style.transform     = `translateY(${BUTTONS.offsetY}px) scale(${BUTTONS.scale})`;
  el.style.maxHeight     = '0';
  el.style.marginBottom  = '0';
  el.style.paddingTop    = '0';
  el.style.paddingBottom = '0';
  el.style.pointerEvents = 'none';
}

function expandBtn(el, delay = 0) {
  // Restore size instantly (still invisible), then spring in
  el.style.transition    = 'none';
  el.style.maxHeight     = '50px';
  el.style.marginBottom  = '12px';
  el.style.paddingTop    = '10px';
  el.style.paddingBottom = '10px';
  el.style.pointerEvents = 'auto';

  springIn(el, BUTTONS, delay);
}

// ─── Transition: Idle → Active (Start) ───────────────────────────────────────

function transitionToActive({ timerBlock, startBtn, stopBtn, breakBtn }) {
  const timers = [];

  // Stage 1 — Start springs out
  collapseBtn(startBtn, BUTTONS);

  // Stage 2 — Timer block springs in
  timers.push(setTimeout(() => {
    timerBlock.style.display   = 'block';
    timerBlock.style.maxHeight = '150px';
    timerBlock.style.opacity   = '0';
    timerBlock.style.transform = `translateY(${TIMER_BLOCK.offsetY}px) scale(${TIMER_BLOCK.scale})`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      timerBlock.style.transition = [
        `opacity   ${Math.round(TIMER_BLOCK.enterDur * 0.75)}ms ${TIMER_BLOCK.enterEasing}`,
        `transform ${TIMER_BLOCK.enterDur}ms ${TIMER_BLOCK.enterEasing}`,
      ].join(', ');
      timerBlock.style.opacity   = '1';
      timerBlock.style.transform = 'translateY(0) scale(1)';
    }));
  }, TIMING.timerBlockIn));

  // Stage 3 — Stop + Break spring up (staggered)
  [stopBtn, breakBtn].forEach((btn, i) => {
    timers.push(setTimeout(() => expandBtn(btn), TIMING.firstBtnIn + i * TIMING.btnStagger));
  });

  return timers;
}

// ─── Transition: Active → Idle (Stop) ────────────────────────────────────────

function transitionToIdle({ timerBlock, startBtn, stopBtn, breakBtn }) {
  const timers = [];

  // Stage 1 — Timer block springs out (GPU only, no layout change)
  timerBlock.style.transition = [
    `opacity   ${Math.round(TIMER_BLOCK.exitDur * 0.8)}ms ${TIMER_BLOCK.exitEasing}`,
    `transform ${TIMER_BLOCK.exitDur}ms ${TIMER_BLOCK.exitEasing}`,
  ].join(', ');
  timerBlock.style.opacity   = '0';
  timerBlock.style.transform = `translateY(${TIMER_BLOCK.offsetY}px) scale(${TIMER_BLOCK.scale})`;

  // Stage 2 — Stop/Break collapse (content already invisible)
  timers.push(setTimeout(() => {
    [stopBtn, breakBtn].forEach((btn, i) => collapseBtn(btn, BUTTONS, i * 30));

    // Collapse timer block height after it's invisible
    timerBlock.style.transition = `max-height ${TIMER_BLOCK.exitDur}ms ${TIMER_BLOCK.exitEasing}`;
    timerBlock.style.maxHeight  = '0';
  }, TIMING.activeBtnsOut));

  // Stage 3 — Start springs up
  timers.push(setTimeout(() => expandBtn(startBtn), TIMING.idleBtnIn));

  // Clean up
  timers.push(setTimeout(() => {
    timerBlock.style.display = 'none';
  }, TIMING.idleBtnIn + BUTTONS.enterDur + 60));

  return timers;
}

module.exports = { TIMING, TIMER_BLOCK, BUTTONS, transitionToActive, transitionToIdle };
