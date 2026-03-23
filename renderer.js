const { ipcRenderer } = require('electron');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const { TIMING, TIMER_BLOCK, BUTTONS, transitionToActive, transitionToIdle } = require('./transitions');
const { initDialKit } = require('./dialkit');

// ─── Persistence ──────────────────────────────────────────────────────────────
const DATA_FILE = path.join(os.homedir(), '.productivity-tracker.json');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadTodaySeconds() {
  try {
    const raw  = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data.date === todayKey()) return data.seconds || 0;
  } catch (_) {}
  return 0;
}

function saveTodaySeconds(seconds) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ date: todayKey(), seconds }), 'utf8');
  } catch (_) {}
}

// ─── State ────────────────────────────────────────────────────────────────────
let state           = 'idle'; // idle | running | onBreak
let workSeconds     = loadTodaySeconds();
let sessionSeconds  = 0;
let breakSeconds    = 0;
let workInterval    = null;
let sessionInterval = null;
let breakInterval   = null;
let activeTimers    = [];

// ─── DOM ──────────────────────────────────────────────────────────────────────
const timerBlock    = document.getElementById('timer-block');
const workTimeEl    = document.getElementById('work-time');
const sessionTimeEl = document.getElementById('session-time');
const breakRow      = document.getElementById('break-row-outer');
const breakTimeEl   = document.getElementById('break-time');
const startBtn      = document.getElementById('start-btn');
const stopBtn       = document.getElementById('stop-btn');
const breakBtn      = document.getElementById('break-btn');
const quitBtn       = document.getElementById('quit-btn');
const breakLabel    = breakBtn.querySelector('.btn-label');
const idleTotalEl   = document.getElementById('idle-total');
const idleWorkTimeEl = document.getElementById('idle-work-time');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function updateDisplay() {
  workTimeEl.textContent     = formatTime(workSeconds);
  sessionTimeEl.textContent  = formatTime(sessionSeconds);
  idleWorkTimeEl.textContent = formatTime(workSeconds);
}

function showIdleTotal() {
  idleTotalEl.style.display   = 'block';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    idleTotalEl.style.opacity   = '1';
    idleTotalEl.style.transform = 'translateY(0)';
  }));
}

function hideIdleTotal() {
  idleTotalEl.style.opacity   = '0';
  idleTotalEl.style.transform = 'translateY(6px)';
  setTimeout(() => { idleTotalEl.style.display = 'none'; }, 280);
}

function clearActiveTimers() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
}

// ─── State transitions ────────────────────────────────────────────────────────
function goRunning() {
  state = 'running';
  clearActiveTimers();
  hideIdleTotal();

  // Reset session timer for new session
  sessionSeconds  = 0;
  clearInterval(sessionInterval);
  sessionInterval = setInterval(() => { sessionSeconds++; updateDisplay(); }, 1000);

  timerBlock.classList.add('running');

  activeTimers = transitionToActive({ timerBlock, startBtn, stopBtn, breakBtn });
  setTimeout(() => ipcRenderer.send('resize-window', 800), 50);

  if (!workInterval) {
    workInterval = setInterval(() => { workSeconds++; updateDisplay(); }, 1000);
  }

  updateDisplay();
}

function goIdle() {
  state = 'idle';
  clearActiveTimers();

  clearInterval(workInterval);
  clearInterval(sessionInterval);
  clearInterval(breakInterval);
  workInterval    = null;
  sessionInterval = null;
  breakInterval   = null;
  breakSeconds    = 0;
  sessionSeconds  = 0;

  saveTodaySeconds(workSeconds);

  breakRow.classList.remove('visible');
  timerBlock.classList.remove('running', 'on-break');
  breakLabel.textContent = 'Break';

  activeTimers = transitionToIdle({ timerBlock, startBtn, stopBtn, breakBtn });

  activeTimers.push(setTimeout(showIdleTotal, TIMING.idleBtnIn + 50));

  const endAt = TIMING.idleBtnIn + BUTTONS.duration + 80;
  activeTimers.push(setTimeout(() => ipcRenderer.send('resize-window', 800), endAt));
}

function goBreak() {
  state = 'onBreak';

  clearInterval(workInterval);
  clearInterval(sessionInterval);
  workInterval    = null;
  sessionInterval = null;

  breakSeconds = 0;
  breakTimeEl.textContent = formatTime(0);
  breakRow.classList.add('visible');

  breakInterval = setInterval(() => {
    breakSeconds++;
    breakTimeEl.textContent = formatTime(breakSeconds);
  }, 1000);

  timerBlock.classList.remove('running');
  timerBlock.classList.add('on-break');
  breakLabel.textContent = 'Resume';
}

function resumeFromBreak() {
  state = 'running';

  clearInterval(breakInterval);
  breakInterval = null;
  breakSeconds  = 0;
  breakRow.classList.remove('visible');

  workInterval    = setInterval(() => { workSeconds++;    updateDisplay(); }, 1000);
  sessionInterval = setInterval(() => { sessionSeconds++; updateDisplay(); }, 1000);

  timerBlock.classList.remove('on-break');
  timerBlock.classList.add('running');
  breakLabel.textContent = 'Break';
}

// ─── Event listeners ──────────────────────────────────────────────────────────
startBtn.addEventListener('click', goRunning);
stopBtn.addEventListener('click', goIdle);
breakBtn.addEventListener('click', () => {
  if (state === 'running')    goBreak();
  else if (state === 'onBreak') resumeFromBreak();
});
function doQuit() {
  clearInterval(workInterval);
  clearInterval(sessionInterval);
  clearInterval(breakInterval);
  saveTodaySeconds(workSeconds);
  ipcRenderer.send('quit-app');
}

quitBtn.addEventListener('click', doQuit);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') doQuit(); });

// ─── Initial display ──────────────────────────────────────────────────────────
updateDisplay();
showIdleTotal();

// ─── DialKit ──────────────────────────────────────────────────────────────────
initDialKit(TIMING, TIMER_BLOCK, BUTTONS);

// ─── Midnight reset ───────────────────────────────────────────────────────────
function scheduleNextMidnightReset() {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  setTimeout(() => {
    if (state === 'idle') { workSeconds = 0; updateDisplay(); }
    scheduleNextMidnightReset();
  }, midnight - now);
}
scheduleNextMidnightReset();
