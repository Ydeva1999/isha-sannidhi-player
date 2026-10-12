// Isha Sannidhi Player — iOS Simulator & WebKit Engine

const CONFIG = {
  PREFS_KEY_DELAY: 'isha_sannidhi_delay_enabled',
  PREFS_KEY_HINDI_POS: 'isha_sannidhi_pos_hindi',
  PREFS_KEY_ENG_POS: 'isha_sannidhi_pos_english',
  PREFS_KEY_AUTO_ENABLED: 'isha_sannidhi_auto_enabled',
  PREFS_KEY_AUTO_SLOT: 'isha_sannidhi_auto_slot',
  PREFS_KEY_AUTO_TRACK: 'isha_sannidhi_auto_track',
  PREFS_KEY_AUTO_BELL: 'isha_sannidhi_auto_bell',
  PREFS_KEY_HIDE_NOTIFS: 'isha_sannidhi_hide_notifs',
  PREFS_KEY_SCREEN_TIMEOUT: 'isha_sannidhi_screen_timeout',
  DELAY_SECONDS: 300, // 5 minutes buffer (300 seconds)
  SCREEN_TIMEOUT_MS: 60 * 60 * 1000, // 1-hour screen timeout (3600 seconds)
  SAFE_VOLUME: 0.85
};

const TRACKS = {
  hindi: {
    key: CONFIG.PREFS_KEY_HINDI_POS,
    title: 'हिन्दी सानिध्य पूजा',
    subtitle: 'Hindi Sannidhi Pooja (~40 min)',
    src: './audio/hindi_sannidhi_pooja.mp3',
    approxDuration: 2304 // ~38:24
  },
  english: {
    key: CONFIG.PREFS_KEY_ENG_POS,
    title: 'English Sannidhi Pooja',
    subtitle: 'English Sannidhi Pooja (~40 min)',
    src: './audio/english_sannidhi_pooja.mp3',
    approxDuration: 2304 // ~38:24
  }
};

// State
let currentTrackKey = null;
let isPlaying = false;
let isPreparingDelay = false;
let delayTimer = null;
let delaySecondsRemaining = CONFIG.DELAY_SECONDS;
let screenTimeoutTimer = null;
let wakeLockSentinel = null;
let isDelayEnabled = localStorage.getItem(CONFIG.PREFS_KEY_DELAY) !== 'false'; // default true
let isHideNotifPopups = localStorage.getItem(CONFIG.PREFS_KEY_HIDE_NOTIFS) !== 'false'; // default true
let isScreenTimeoutEnabled = localStorage.getItem(CONFIG.PREFS_KEY_SCREEN_TIMEOUT) !== 'false'; // default true
let isAutoPlayEnabled = localStorage.getItem(CONFIG.PREFS_KEY_AUTO_ENABLED) === 'true'; // default false
let isAutoBellEnabled = localStorage.getItem(CONFIG.PREFS_KEY_AUTO_BELL) !== 'false'; // default true
let autoPlaySlot = parseInt(localStorage.getItem(CONFIG.PREFS_KEY_AUTO_SLOT) || '2', 10); // 0=morning, 1=evening, 2=both
let autoPlayTrack = localStorage.getItem(CONFIG.PREFS_KEY_AUTO_TRACK) || 'hindi';
let lastAutoTriggerMinuteKey = '';
let audioCtx = null;

// DOM Elements
const audioElement = document.getElementById('audioElement');
const screenHome = document.getElementById('screenHome');
const screenPlayer = document.getElementById('screenPlayer');

// Cockpit Controls
const btnModeSim = document.getElementById('btnModeSim');
const btnModeFull = document.getElementById('btnModeFull');
const btnQuickBell = document.getElementById('btnQuickBell');

// Home Elements
const toggleDelay = document.getElementById('toggleDelay');
const delayBadge = document.getElementById('delayBadge');
const cardDelayToggle = document.getElementById('cardDelayToggle');

const cardAutoSchedule = document.getElementById('cardAutoSchedule');
const rowAutoHeader = document.getElementById('rowAutoHeader');
const toggleAutoSchedule = document.getElementById('toggleAutoSchedule');
const autoBadge = document.getElementById('autoBadge');
const autoNextDesc = document.getElementById('autoNextDesc');
const autoControlsDrawer = document.getElementById('autoControlsDrawer');
const btnSlotMorning = document.getElementById('btnSlotMorning');
const btnSlotEvening = document.getElementById('btnSlotEvening');
const btnSlotBoth = document.getElementById('btnSlotBoth');
const btnTrackHindi = document.getElementById('btnTrackHindi');
const btnTrackEnglish = document.getElementById('btnTrackEnglish');
const rowAutoBell = document.getElementById('rowAutoBell');
const toggleAutoBell = document.getElementById('toggleAutoBell');
const bellBadge = document.getElementById('bellBadge');

const cardHindi = document.getElementById('cardHindi');
const cardEnglish = document.getElementById('cardEnglish');
const statusHindi = document.getElementById('statusHindi');
const statusEnglish = document.getElementById('statusEnglish');
const btnDndShield = document.getElementById('btnDndShield');
const btnSoundTest = document.getElementById('btnSoundTest');
const btnAirPlay = document.getElementById('btnAirPlay');

// Status Bar & Dynamic Island
const statusClock = document.getElementById('statusClock');
const dynamicIsland = document.getElementById('dynamicIsland');
const islandText = document.getElementById('islandText');
const homeBatteryText = document.getElementById('homeBatteryText');
const batteryLevelBar = document.getElementById('batteryLevelBar');

// Player Elements
const btnBack = document.getElementById('btnBack');
const playerStatusBadge = document.getElementById('playerStatusBadge');
const playerTitle = document.getElementById('playerTitle');
const countdownDisplay = document.getElementById('countdownDisplay');
const countdownLabel = document.getElementById('countdownLabel');
const scrubberTrack = document.getElementById('scrubberTrack');
const scrubberFill = document.getElementById('scrubberFill');
const scrubberThumb = document.getElementById('scrubberThumb');
const timeElapsed = document.getElementById('timeElapsed');
const timeMetaNotice = document.getElementById('timeMetaNotice');
const timeTotal = document.getElementById('timeTotal');
const btnRestart = document.getElementById('btnRestart');
const btnPlayPause = document.getElementById('btnPlayPause');
const portraitHalo = document.getElementById('portraitHalo');

// Modals & Toast
const modalOverlay = document.getElementById('modalOverlay');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertBtnCancel = document.getElementById('alertBtnCancel');
const alertBtnConfirm = document.getElementById('alertBtnConfirm');
const toastMessage = document.getElementById('toastMessage');

// Settings Elements
const btnSettings = document.getElementById('btnSettings');
const settingsModalOverlay = document.getElementById('settingsModalOverlay');
const btnSettingsCloseX = document.getElementById('btnSettingsCloseX');
const btnSettingsSave = document.getElementById('btnSettingsSave');
const rowSettingHideNotifs = document.getElementById('rowSettingHideNotifs');
const toggleHideNotifPopups = document.getElementById('toggleHideNotifPopups');
const rowSettingPrepDelay = document.getElementById('rowSettingPrepDelay');
const toggleSettingPrepDelay = document.getElementById('toggleSettingPrepDelay');
const rowSettingScreenTimeout = document.getElementById('rowSettingScreenTimeout');
const toggleSettingScreenTimeout = document.getElementById('toggleSettingScreenTimeout');
const btnSettingsTestBell = document.getElementById('btnSettingsTestBell');
const btnSettingsDndGuide = document.getElementById('btnSettingsDndGuide');

// ==========================================================================
// INITIALIZATION
// ==========================================================================
function init() {
  initClock();
  initBattery();
  initDelayToggleUI();
  initAutoPlayUI();
  updateHomeCardBadges();
  setupEventListeners();
  audioElement.volume = CONFIG.SAFE_VOLUME;

  // Service Worker for offline PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// Live Status Bar Clock & Auto-Play Scheduler
function initClock() {
  const update = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    statusClock.textContent = `${hours}:${minutes}`;
    checkAutoPlaySchedule();
  };
  update();
  setInterval(update, 1000);
}

// Auto-Play Schedule UI & Logic
function initAutoPlayUI() {
  toggleAutoSchedule.checked = isAutoPlayEnabled;
  if (toggleAutoBell) toggleAutoBell.checked = isAutoBellEnabled;
  updateAutoBadge();
  updateAutoBellUI();
  updateAutoControlsVisibility();
  updateSlotButtonsUI();
  updateTrackButtonsUI();
  checkAutoPlaySchedule();
}

function updateAutoBadge() {
  if (isAutoPlayEnabled) {
    autoBadge.textContent = '⏰ 6:15 ON';
    autoBadge.classList.remove('off');
  } else {
    autoBadge.textContent = '⏰ 6:15 OFF';
    autoBadge.classList.add('off');
  }
}

function updateAutoBellUI() {
  if (!bellBadge) return;
  if (isAutoBellEnabled) {
    bellBadge.textContent = '🔔 ON';
    bellBadge.classList.remove('off');
  } else {
    bellBadge.textContent = '🔕 OFF';
    bellBadge.classList.add('off');
  }
}

function playGentleWakeupChime() {
  try {
    const gentleBell = new Audio('./audio/sannidhi_bell.mp3');
    gentleBell.volume = 0.60;
    const p = gentleBell.play();
    if (p !== undefined) {
      p.catch(e => console.warn('Gentle bell play prevented:', e));
    }
  } catch (e) {
    console.warn('Gentle chime error:', e);
  }
}

function updateAutoControlsVisibility() {
  if (isAutoPlayEnabled) {
    autoControlsDrawer.classList.remove('hidden');
  } else {
    autoControlsDrawer.classList.add('hidden');
  }
}

function updateSlotButtonsUI() {
  [btnSlotMorning, btnSlotEvening, btnSlotBoth].forEach(btn => {
    if (!btn) return;
    const slot = parseInt(btn.dataset.slot, 10);
    if (slot === autoPlaySlot) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateTrackButtonsUI() {
  [btnTrackHindi, btnTrackEnglish].forEach(btn => {
    if (!btn) return;
    if (btn.dataset.track === autoPlayTrack) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function getTargetDate(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function getNextAutoPlayDate() {
  const morningDate = getTargetDate(6, 15);
  const eveningDate = getTargetDate(18, 15);

  if (autoPlaySlot === 0) return morningDate; // 6:15 AM
  if (autoPlaySlot === 1) return eveningDate; // 6:15 PM
  return (morningDate.getTime() < eveningDate.getTime()) ? morningDate : eveningDate; // Both
}

function checkAutoPlaySchedule() {
  if (!isAutoPlayEnabled) {
    if (autoNextDesc) autoNextDesc.textContent = 'Auto-play disabled (Manual play only)';
    return;
  }

  const nextDate = getNextAutoPlayDate();
  const diffMs = nextDate.getTime() - Date.now();

  if (diffMs > 0 && autoNextDesc) {
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const slotLabel = nextDate.getHours() < 12 ? 'Morning 06:15 AM' : 'Evening 06:15 PM';
    let remaining = '';
    if (hours > 0) {
      remaining = `${hours}h ${mins}m`;
    } else if (mins > 0) {
      remaining = `${mins}m ${secs}s`;
    } else {
      remaining = `${secs}s`;
    }

    const trackName = autoPlayTrack === 'hindi' ? 'हिन्दी सानिध्य' : 'English';
    autoNextDesc.textContent = `Next: ${slotLabel} (${trackName}) • in ${remaining}`;
  }

  // Check trigger condition on system clock
  const now = new Date();
  const curHour = now.getHours();
  const curMin = now.getMinutes();
  const curSec = now.getSeconds();

  const isMorningSlot = (autoPlaySlot === 0 || autoPlaySlot === 2) && (curHour === 6 && curMin === 15);
  const isEveningSlot = (autoPlaySlot === 1 || autoPlaySlot === 2) && (curHour === 18 && curMin === 15);

  if ((isMorningSlot || isEveningSlot) && curSec <= 2) {
    const triggerKey = `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${curHour}:${curMin}`;
    if (triggerKey !== lastAutoTriggerMinuteKey) {
      lastAutoTriggerMinuteKey = triggerKey;
      if (!isPlaying && !isPreparingDelay) {
        triggerAutoPlayNow();
      }
    }
  }
}

function triggerAutoPlayNow() {
  showToast(`🕉️ Auto-Play: Starting 06:15 ${autoPlayTrack === 'hindi' ? 'हिन्दी' : 'English'} Pooja`);
  if (isAutoBellEnabled) {
    playGentleWakeupChime();
  }
  startPooja(autoPlayTrack, true);
}

// Battery Status
function initBattery() {
  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      const updateBat = () => {
        const pct = Math.round(battery.level * 100);
        const charging = battery.charging ? ' Charging' : '';
        homeBatteryText.textContent = `🔋 ${pct}%${charging}`;
        batteryLevelBar.style.width = `${pct}%`;
        if (pct <= 20) batteryLevelBar.style.background = '#FF3B30';
        else if (battery.charging) batteryLevelBar.style.background = '#34C759';
        else batteryLevelBar.style.background = '#FFFFFF';
      };
      updateBat();
      battery.addEventListener('levelchange', updateBat);
      battery.addEventListener('chargingchange', updateBat);
    }).catch(() => {});
  }
}

// Delay Toggle UI
function initDelayToggleUI() {
  toggleDelay.checked = isDelayEnabled;
  updateDelayBadge();
}

function updateDelayBadge() {
  if (isDelayEnabled) {
    delayBadge.textContent = '⏱️ 5m ON';
    delayBadge.classList.remove('off');
  } else {
    delayBadge.textContent = '⚡ Instant OFF';
    delayBadge.classList.add('off');
  }
}

function showToast(msg) {
  toastMessage.textContent = msg;
  toastMessage.classList.remove('hidden');
  setTimeout(() => toastMessage.classList.add('hidden'), 2500);
}

// Format Seconds to MM:SS
function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// Update Home Badges (Paused timestamps)
function updateHomeCardBadges() {
  const hindiPos = parseFloat(localStorage.getItem(CONFIG.PREFS_KEY_HINDI_POS) || '0');
  if (hindiPos > 5) {
    statusHindi.textContent = `⏸️ Paused at ${formatTime(hindiPos)} (Tap to Open)`;
    statusHindi.classList.add('paused');
  } else {
    statusHindi.textContent = 'Tap to Begin';
    statusHindi.classList.remove('paused');
  }

  const engPos = parseFloat(localStorage.getItem(CONFIG.PREFS_KEY_ENG_POS) || '0');
  if (engPos > 5) {
    statusEnglish.textContent = `⏸️ Paused at ${formatTime(engPos)} (Tap to Open)`;
    statusEnglish.classList.add('paused');
  } else {
    statusEnglish.textContent = 'Tap to Begin';
    statusEnglish.classList.remove('paused');
  }
}

// ==========================================================================
// AUTHENTIC ISHA SANNIDHI TEMPLE BELL PLAYBACK
// Extracted directly from official Isha Sannidhi Guru Pooja recordings
// ==========================================================================
let sannidhiBellAudio = null;
try {
  sannidhiBellAudio = new Audio('./audio/sannidhi_bell.mp3');
  sannidhiBellAudio.preload = 'auto';
} catch (e) {
  console.warn('Bell audio preload warning:', e);
}

function playTempleBellChime() {
  try {
    if (!sannidhiBellAudio) {
      sannidhiBellAudio = new Audio('./audio/sannidhi_bell.mp3');
    }
    sannidhiBellAudio.pause();
    sannidhiBellAudio.currentTime = 0;
    sannidhiBellAudio.volume = 0.90;
    const playPromise = sannidhiBellAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Bell audio playback blocked or pending user interaction:', err);
      });
    }
    showToast('🔔 Authentic Sannidhi Bell Chime Tested');
  } catch (err) {
    console.error('Bell playback failed:', err);
  }
}

// ==========================================================================
// PLAYBACK LOGIC & 10-SECOND PREPARATION COUNTDOWN
// ==========================================================================
function startPooja(trackKey, forceRestart = false) {
  currentTrackKey = trackKey;
  const track = TRACKS[trackKey];

  cancelPreparationDelay();
  audioElement.pause();
  audioElement.src = track.src;

  const savedPos = parseFloat(localStorage.getItem(track.key) || '0');
  const isResume = !forceRestart && savedPos > 5;

  playerTitle.textContent = track.title;
  timeMetaNotice.textContent = '';
  screenHome.classList.add('hidden');
  screenPlayer.classList.remove('hidden');

  setupMediaSession(track);

  if (isResume) {
    // Open in safe PAUSED state
    audioElement.currentTime = savedPos;
    isPlaying = false;
    playerStatusBadge.textContent = '⏸️ PAUSED';
    playerStatusBadge.className = 'player-status-badge paused';
    btnPlayPause.textContent = '▶️ RESUME';
    countdownLabel.textContent = 'REMAINING';
    btnRestart.style.visibility = 'visible';
    portraitHalo.classList.remove('pulse');
    collapseDynamicIsland();
    resetScreenWakeTimer();
    showToast(`Paused at ${formatTime(savedPos)} • Tap ▶️ RESUME when ready`);
  } else {
    // Brand new start from beginning (00:00)
    audioElement.currentTime = 0;
    localStorage.setItem(track.key, '0');

    if (isDelayEnabled) {
      startPreparationDelay(track);
    } else {
      startAudioPlaybackDirectly();
    }
  }
}

// ==========================================================================
// 1-HOUR SCREEN AUTO-TIMEOUT & WAKELOCK MANAGEMENT
// ==========================================================================
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLockSentinel) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  } catch (e) {
    console.warn('WakeLock not granted or supported:', e);
  }
}

function releaseWakeLock() {
  try {
    if (wakeLockSentinel) {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (e) {
    console.warn('WakeLock release error:', e);
  }
}

function resetScreenWakeTimer() {
  clearTimeout(screenTimeoutTimer);
  requestWakeLock();
  removeScreenSleepDim();
  if (isScreenTimeoutEnabled) {
    screenTimeoutTimer = setTimeout(() => {
      handleScreenTimeout();
    }, CONFIG.SCREEN_TIMEOUT_MS);
  }
}

function clearScreenWakeTimer() {
  clearTimeout(screenTimeoutTimer);
  releaseWakeLock();
  removeScreenSleepDim();
}

function handleScreenTimeout() {
  releaseWakeLock();
  applyScreenSleepDim();
  showToast('🌙 1-Hour screen keep-awake ended (Display dimmed)');
}

function applyScreenSleepDim() {
  let dimmer = document.getElementById('screenSleepDimmer');
  if (!dimmer) {
    dimmer = document.createElement('div');
    dimmer.id = 'screenSleepDimmer';
    dimmer.className = 'screen-sleep-dimmer';
    dimmer.innerHTML = '<div class="dimmer-content"><span>🌙 Screen Sleep Mode (1h Timeout)</span><small>Tap anywhere to wake display</small></div>';
    dimmer.addEventListener('click', () => {
      removeScreenSleepDim();
      resetScreenWakeTimer();
    });
    const container = document.querySelector('.iphone-screen') || document.body;
    container.appendChild(dimmer);
  }
  dimmer.classList.add('active');
}

function removeScreenSleepDim() {
  const dimmer = document.getElementById('screenSleepDimmer');
  if (dimmer) {
    dimmer.classList.remove('active');
  }
}

function startPreparationDelay(track) {
  isPreparingDelay = true;
  isPlaying = false;
  delaySecondsRemaining = CONFIG.DELAY_SECONDS;

  const mins = Math.floor(delaySecondsRemaining / 60);
  const secs = delaySecondsRemaining % 60;

  playerStatusBadge.textContent = '⏳ STARTING IN 5m';
  playerStatusBadge.className = 'player-status-badge preparing';
  countdownLabel.textContent = '5 MIN PREPARATION • SETTLE IN AT 06:15';
  countdownDisplay.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  timeMetaNotice.textContent = `Audio starts automatically in ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

  btnPlayPause.textContent = '▶️ START NOW (अभी शुरू)';
  btnRestart.style.visibility = 'hidden';
  portraitHalo.classList.remove('pulse');

  expandDynamicIsland(`Starting in ${mins}m...`);
  resetScreenWakeTimer();
  if (btnDndShield) {
    btnDndShield.textContent = '🔕 DND ON';
    btnDndShield.style.color = '#34C759';
  }

  clearInterval(delayTimer);
  delayTimer = setInterval(() => {
    delaySecondsRemaining--;
    if (delaySecondsRemaining > 0) {
      const curM = Math.floor(delaySecondsRemaining / 60);
      const curS = delaySecondsRemaining % 60;
      countdownDisplay.textContent = `${curM < 10 ? '0' : ''}${curM}:${curS < 10 ? '0' : ''}${curS}`;
      if (curM > 0) {
        playerStatusBadge.textContent = `⏳ STARTING IN ${curM}m ${curS}s`;
        timeMetaNotice.textContent = `Audio starts in ${curM}m ${curS}s`;
        islandText.textContent = `Starting in ${curM}m ${curS}s...`;
      } else {
        playerStatusBadge.textContent = `⏳ STARTING IN ${curS}s`;
        timeMetaNotice.textContent = `Audio starts in ${curS}s`;
        islandText.textContent = `Starting in ${curS}s...`;
      }
    } else {
      cancelPreparationDelay();
      startAudioPlaybackDirectly();
    }
  }, 1000);
}

function cancelPreparationDelay() {
  isPreparingDelay = false;
  if (delayTimer) {
    clearInterval(delayTimer);
    delayTimer = null;
  }
}

function startAudioPlaybackDirectly() {
  cancelPreparationDelay();
  audioElement.volume = CONFIG.SAFE_VOLUME;
  resetScreenWakeTimer();
  if (btnDndShield) {
    btnDndShield.textContent = '🔕 DND ON';
    btnDndShield.style.color = '#34C759';
  }
  audioElement.play().then(() => {
    isPlaying = true;
    playerStatusBadge.textContent = '● PLAYING';
    playerStatusBadge.className = 'player-status-badge';
    countdownLabel.textContent = 'REMAINING';
    btnPlayPause.textContent = '⏸️ PAUSE';
    btnRestart.style.visibility = 'visible';
    timeMetaNotice.textContent = '';
    portraitHalo.classList.add('pulse');
    expandDynamicIsland(TRACKS[currentTrackKey].title);
  }).catch((err) => {
    console.error('Audio play error:', err);
    // User interaction required on some browsers
    btnPlayPause.textContent = '▶️ TAP TO PLAY';
  });
}

function togglePlayPause() {
  if (isPreparingDelay) {
    // User tapped "START NOW" during 5 min preparation countdown
    cancelPreparationDelay();
    startAudioPlaybackDirectly();
    return;
  }

  if (isPlaying) {
    audioElement.pause();
    isPlaying = false;
    playerStatusBadge.textContent = '⏸️ PAUSED';
    playerStatusBadge.className = 'player-status-badge paused';
    btnPlayPause.textContent = '▶️ RESUME';
    portraitHalo.classList.remove('pulse');
    collapseDynamicIsland();
    saveCurrentPosition();
  } else {
    resetScreenWakeTimer();
    audioElement.play().then(() => {
      isPlaying = true;
      playerStatusBadge.textContent = '● PLAYING';
      playerStatusBadge.className = 'player-status-badge';
      btnPlayPause.textContent = '⏸️ PAUSE';
      portraitHalo.classList.add('pulse');
      expandDynamicIsland(TRACKS[currentTrackKey].title);
    });
  }
}

function saveCurrentPosition() {
  if (currentTrackKey && !isPreparingDelay && audioElement.currentTime > 0) {
    localStorage.setItem(TRACKS[currentTrackKey].key, audioElement.currentTime.toString());
  }
}

function returnToHome() {
  cancelPreparationDelay();
  clearScreenWakeTimer();
  audioElement.pause();
  saveCurrentPosition();
  isPlaying = false;
  screenPlayer.classList.add('hidden');
  screenHome.classList.remove('hidden');
  collapseDynamicIsland();
  updateHomeCardBadges();
  if (btnDndShield) {
    btnDndShield.textContent = '🔕 DND';
    btnDndShield.style.color = '';
  }
}

// Media Session for iOS Lock Screen & Control Center
function setupMediaSession(track) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: 'Sadhguru — Isha Foundation',
      album: 'Isha Sannidhi Seva',
      artwork: [
        { src: './images/sadhguru_portrait.webp', sizes: '512x512', type: 'image/webp' },
        { src: './images/ic_launcher.png', sizes: '192x192', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) audioElement.currentTime = details.seekTime;
    });
  }
}

function expandDynamicIsland(label) {
  islandText.textContent = label;
  dynamicIsland.classList.add('expanded');
}

function collapseDynamicIsland() {
  dynamicIsland.classList.remove('expanded');
}

// ==========================================================================
// AUDIO EVENT LISTENERS & PROGRESS
// ==========================================================================
audioElement.addEventListener('timeupdate', () => {
  if (isPreparingDelay) return;

  const current = audioElement.currentTime;
  const duration = audioElement.duration || TRACKS[currentTrackKey]?.approxDuration || 2304;
  const remaining = Math.max(0, duration - current);

  countdownDisplay.textContent = formatTime(remaining);
  timeElapsed.textContent = formatTime(current);
  timeTotal.textContent = formatTime(duration);

  const pct = Math.min(100, Math.max(0, (current / duration) * 100));
  scrubberFill.style.width = `${pct}%`;
  scrubberThumb.style.left = `${pct}%`;

  saveCurrentPosition();
});

audioElement.addEventListener('ended', () => {
  if (currentTrackKey) {
    localStorage.setItem(TRACKS[currentTrackKey].key, '0');
  }
  showToast('Sannidhi Pooja Completed 🙏');
  returnToHome();
});

// Interactive Scrubber Drag/Click
scrubberTrack.addEventListener('click', (e) => {
  if (isPreparingDelay) return;
  const rect = scrubberTrack.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
  const duration = audioElement.duration || TRACKS[currentTrackKey]?.approxDuration || 2304;
  audioElement.currentTime = ratio * duration;
});

// ==========================================================================
// MODAL ALERTS (Cupertino Style)
// ==========================================================================
let pendingModalAction = null;

function showModal(title, msg, confirmText, onConfirm) {
  alertTitle.textContent = title;
  alertMessage.textContent = msg;
  alertBtnConfirm.textContent = confirmText;
  pendingModalAction = onConfirm;
  modalOverlay.classList.remove('hidden');
}

alertBtnCancel.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  pendingModalAction = null;
});

alertBtnConfirm.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  if (pendingModalAction) pendingModalAction();
  pendingModalAction = null;
});

// ==========================================================================
// EVENT LISTENERS BINDING
// ==========================================================================
function setupEventListeners() {
  // Cockpit Mode Switchers
  btnModeSim.addEventListener('click', () => {
    document.body.className = 'simulator-mode';
    btnModeSim.classList.add('active');
    btnModeFull.classList.remove('active');
  });

  btnModeFull.addEventListener('click', () => {
    document.body.className = 'fullscreen-mode';
    btnModeFull.classList.add('active');
    btnModeSim.classList.remove('active');
  });

  btnQuickBell.addEventListener('click', playTempleBellChime);

  // Home Screen Delay Toggle
  cardDelayToggle.addEventListener('click', (e) => {
    if (e.target !== toggleDelay) {
      toggleDelay.checked = !toggleDelay.checked;
    }
    isDelayEnabled = toggleDelay.checked;
    localStorage.setItem(CONFIG.PREFS_KEY_DELAY, isDelayEnabled.toString());
    updateDelayBadge();
    showToast(isDelayEnabled ? '5 min Pre-Pooja Silence Enabled (5 मिनट तैयारी गैप चालू)' : 'Preparation Delay Disabled (तुरंत शुरू होगा)');
  });

  // Auto-Play Schedule Toggle
  rowAutoHeader.addEventListener('click', (e) => {
    if (e.target !== toggleAutoSchedule) {
      toggleAutoSchedule.checked = !toggleAutoSchedule.checked;
    }
    isAutoPlayEnabled = toggleAutoSchedule.checked;
    localStorage.setItem(CONFIG.PREFS_KEY_AUTO_ENABLED, isAutoPlayEnabled.toString());
    updateAutoBadge();
    updateAutoControlsVisibility();
    checkAutoPlaySchedule();
    showToast(isAutoPlayEnabled ? '⏰ 06:15 Auto-Play Enabled (ऑटो चालू)' : 'Auto-Play Disabled (मैन्युअल मोड)');
  });

  // Slot Selection Buttons
  [btnSlotMorning, btnSlotEvening, btnSlotBoth].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      autoPlaySlot = parseInt(btn.dataset.slot, 10);
      localStorage.setItem(CONFIG.PREFS_KEY_AUTO_SLOT, autoPlaySlot.toString());
      updateSlotButtonsUI();
      checkAutoPlaySchedule();
    });
  });

  // Track Selection Buttons
  [btnTrackHindi, btnTrackEnglish].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      autoPlayTrack = btn.dataset.track;
      localStorage.setItem(CONFIG.PREFS_KEY_AUTO_TRACK, autoPlayTrack);
      updateTrackButtonsUI();
      checkAutoPlaySchedule();
    });
  });

  // Gentle Bell Chime Toggle
  if (rowAutoBell) {
    rowAutoBell.addEventListener('click', (e) => {
      if (e.target !== toggleAutoBell) {
        toggleAutoBell.checked = !toggleAutoBell.checked;
      }
      isAutoBellEnabled = toggleAutoBell.checked;
      localStorage.setItem(CONFIG.PREFS_KEY_AUTO_BELL, isAutoBellEnabled.toString());
      updateAutoBellUI();
      showToast(isAutoBellEnabled ? '🔔 Gentle Bell at 06:15 Enabled (हल्की घंटी चालू)' : 'Gentle Bell Disabled (घंटी बंद)');
      if (isAutoBellEnabled) {
        playGentleWakeupChime();
      }
    });
  }

  // Pooja Cards
  cardHindi.addEventListener('click', () => startPooja('hindi'));
  cardEnglish.addEventListener('click', () => startPooja('english'));

  // Player Buttons
  btnPlayPause.addEventListener('click', togglePlayPause);

  btnRestart.addEventListener('click', () => {
    showModal('Restart Pooja?', 'Do you want to restart this pooja audio from the beginning (00:00)?', 'Yes, Restart', () => {
      startPooja(currentTrackKey, true);
      showToast('Restarted from Beginning 🙏');
    });
  });

  btnBack.addEventListener('click', () => {
    if (isPreparingDelay) {
      returnToHome();
    } else {
      showModal('Exit Pooja Screen?', 'Your current progress will remain safely saved in memory.', 'Pause & Exit', () => {
        returnToHome();
      });
    }
  });

  if (btnDndShield) {
    btnDndShield.addEventListener('click', () => {
      showModal(
        '🔕 Sannidhi Disturbance Shield',
        'When Sannidhi Player is active, audio notifications and interruptions are suppressed. To ensure complete peace during Pooja on iPhone, keep the physical Mute/Action switch enabled or toggle Do Not Disturb in iOS Control Center.',
        'Understood 🙏',
        () => {
          showToast('🔕 Disturbance Shield Active: Calls & Alerts Muted');
        }
      );
    });
  }

  btnSoundTest.addEventListener('click', playTempleBellChime);
  btnAirPlay.addEventListener('click', () => {
    showToast('AirPlay / Bluetooth audio route verified');
  });

  // Settings Modal Controls
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      if (toggleHideNotifPopups) toggleHideNotifPopups.checked = isHideNotifPopups;
      if (toggleSettingPrepDelay) toggleSettingPrepDelay.checked = isDelayEnabled;
      if (toggleSettingScreenTimeout) toggleSettingScreenTimeout.checked = isScreenTimeoutEnabled;
      if (settingsModalOverlay) settingsModalOverlay.classList.remove('hidden');
    });
  }

  const closeSettingsModal = () => {
    if (settingsModalOverlay) settingsModalOverlay.classList.add('hidden');
  };

  if (btnSettingsCloseX) btnSettingsCloseX.addEventListener('click', closeSettingsModal);
  if (btnSettingsSave) btnSettingsSave.addEventListener('click', closeSettingsModal);

  if (rowSettingHideNotifs) {
    rowSettingHideNotifs.addEventListener('click', (e) => {
      if (e.target !== toggleHideNotifPopups) {
        toggleHideNotifPopups.checked = !toggleHideNotifPopups.checked;
      }
      isHideNotifPopups = toggleHideNotifPopups.checked;
      localStorage.setItem(CONFIG.PREFS_KEY_HIDE_NOTIFS, isHideNotifPopups.toString());
      showToast(isHideNotifPopups 
        ? 'Notification Popups Hidden (स्क्रीन पॉपअप छुपे रहेंगे)' 
        : 'Notification Popups Allowed Silently (पॉपअप बिना आवाज़ दिखेंगे)');
    });
  }

  if (rowSettingPrepDelay) {
    rowSettingPrepDelay.addEventListener('click', (e) => {
      if (e.target !== toggleSettingPrepDelay) {
        toggleSettingPrepDelay.checked = !toggleSettingPrepDelay.checked;
      }
      isDelayEnabled = toggleSettingPrepDelay.checked;
      localStorage.setItem(CONFIG.PREFS_KEY_DELAY, isDelayEnabled.toString());
      if (toggleDelay) toggleDelay.checked = isDelayEnabled;
      updateDelayBadge();
      showToast(isDelayEnabled 
        ? '5 min Pre-Pooja Silence Enabled (5 मिनट तैयारी गैप चालू)' 
        : 'Preparation Delay Disabled (तुरंत शुरू होगा)');
    });
  }

  if (rowSettingScreenTimeout) {
    rowSettingScreenTimeout.addEventListener('click', (e) => {
      if (e.target !== toggleSettingScreenTimeout) {
        toggleSettingScreenTimeout.checked = !toggleSettingScreenTimeout.checked;
      }
      isScreenTimeoutEnabled = toggleSettingScreenTimeout.checked;
      localStorage.setItem(CONFIG.PREFS_KEY_SCREEN_TIMEOUT, isScreenTimeoutEnabled.toString());
      resetScreenWakeTimer();
      showToast(isScreenTimeoutEnabled 
        ? '1-Hour Screen Sleep Enabled (1 घंटे बाद स्क्रीन बंद)' 
        : 'Screen Sleep Disabled (हमेशा ऑन)');
    });
  }

  if (btnSettingsTestBell) {
    btnSettingsTestBell.addEventListener('click', playTempleBellChime);
  }

  if (btnSettingsDndGuide) {
    btnSettingsDndGuide.addEventListener('click', () => {
      closeSettingsModal();
      if (btnDndShield) btnDndShield.click();
    });
  }

  dynamicIsland.addEventListener('click', () => {
    if (screenPlayer.classList.contains('hidden') && currentTrackKey) {
      screenHome.classList.add('hidden');
      screenPlayer.classList.remove('hidden');
    }
  });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
