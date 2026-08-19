import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import alarmUrl from "./assets/alarm.mp3";
import confettiUrl from "./assets/confetti.mp3";
import cicadaUrl from "./assets/cicada.mp3";
import bulbUrl from "./assets/lightbulb.mp3";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimerPreset {
  timerTime: number; // seconds
  anim_speed: number; // seconds
}

/* ------------------------------------------------------------------ */
/*  Constants / Config                                                 */
/* ------------------------------------------------------------------ */

const TICK_INTERVAL_MS = 1000;

const ANIM = {
  base: 2.74,
  min: 0.5,
  max: 2.74 * 5000,
  dampingFactor: 0.3, // lower = slower change, 1 = original behaviour, 0 = no change
};

const BASE_TIMER_TIME_MS = 60 * 1000;

const TIMER_PRESETS: Record<string, TimerPreset> = {
  short: { timerTime: 1, anim_speed: 1.74 },
  medium: { timerTime: 60, anim_speed: 2.74 },
  long: { timerTime: 200, anim_speed: 3.74 },
};

/**
 * NOTE: these were present in the original file but not referenced by
 * any active code path (no callers of `newTimerValue`, `randomTimer` is
 * only logged once). Kept here, isolated, in case something still
 * depends on them; safe to delete if confirmed unused.
 */
const LEGACY_UNUSED = {
  minTimer: 5,
  maxTimer: 10,
  randomTimer: 0,
};

function newTimerValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/* ------------------------------------------------------------------ */
/*  Mutable App State                                                  */
/* ------------------------------------------------------------------ */

const state = {
  loadingDotCount: 0,
  timerLoading: true,
  timerPaused: false,
  popupActive: false,

  currTimerTime: BASE_TIMER_TIME_MS,

  timerId: null as number | null,
  timerStartTime: 0,
  remainingTime: 0,
};

/* ------------------------------------------------------------------ */
/*  Audio                                                              */
/* ------------------------------------------------------------------ */

const sounds = {
  alarm: new Audio(alarmUrl),
  confetti: new Audio(confettiUrl),
  cicada: new Audio(cicadaUrl),
  bulb: new Audio(bulbUrl),
};

sounds.alarm.volume = 0.5;

sounds.cicada.volume = 0.05;
sounds.cicada.loop = true;

sounds.bulb.volume = 0.2;
sounds.bulb.loop = true;

/* ------------------------------------------------------------------ */
/*  DOM References                                                     */
/* ------------------------------------------------------------------ */

const dom = {
  loadLogo: document.getElementById("load-cat"),
  danceCat: document.getElementById("cat-container"),
  refreshBtn: document.getElementById("popup-btn"),
  loadingText: document.getElementById("loading-text"),
  titleMessage: document.getElementById("title-text"),
  sleepCat: document.getElementById("sleep-cat"),
  bodyMain: document.getElementById("body-main"),
  titleContainer: document.getElementById("title-container"),
};

const timerDialog = document.getElementById("timer-dialog") as HTMLDialogElement;
const dialog1 = document.getElementById("dialog1") as HTMLDialogElement;

/* ------------------------------------------------------------------ */
/*  DOM Helpers                                                        */
/* ------------------------------------------------------------------ */

function hideElement(element: HTMLElement | null): void {
  if (!element) return;
  element.classList.add("hidden");
  console.log("Toggled element " + element.id);
}

function showElement(element: HTMLElement | null): void {
  if (!element) return;
  element.classList.remove("hidden");
  console.log("Toggled element " + element.id);
}

function startShake(element: HTMLElement | null): void {
  if (!element) return;
  element.classList.add("shake-element");
  console.log("Toggled element " + element.id);
}

function stopShake(element: HTMLElement | null): void {
  if (!element) return;
  element.classList.remove("shake-element");
  console.log("Toggled element " + element.id);
}

function toggleBlock(): void {
  document.getElementById("main")?.classList.toggle("blocked");
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

function getScaledAnimTime(): number {
  let ratio = state.currTimerTime / BASE_TIMER_TIME_MS;
  ratio = 1 + (ratio - 1) * ANIM.dampingFactor;
  const scaled = ANIM.base * ratio;
  console.log(`New anim time ${scaled}, currTimerTime:${state.currTimerTime}`);
  return Math.min(Math.max(scaled, ANIM.min), ANIM.max);
}

function setAnimTime(val: number = -1): void {
  const value = val === -1 ? getScaledAnimTime() : val;
  document.documentElement.style.setProperty("--anim-speed", `${value}s`);
}

/* ------------------------------------------------------------------ */
/*  Title / Text                                                       */
/* ------------------------------------------------------------------ */

function refreshTitle(): void {
  if (!dom.titleMessage) return;
  if (state.timerPaused) {
    dom.titleMessage.innerText = "Beb Moments Paused Zzz...";
  } else if (state.timerLoading) {
    dom.titleMessage.innerText = "Beb Moments in Progress";
  } else {
    dom.titleMessage.innerText = "Dai mesaj lui BEB!!!!";
  }
}

function incrementLoadingText(): void {
  state.loadingDotCount = (state.loadingDotCount + 1) % 4;
  const baseText = "Loading! Please wait";
  if (!dom.loadingText || dom.loadingText.classList.contains("hidden")) return;
  dom.loadingText.innerHTML = baseText + ".".repeat(state.loadingDotCount);
}

/* ------------------------------------------------------------------ */
/*  Timer Core                                                         */
/* ------------------------------------------------------------------ */

function startTimer(): void {
  if (state.timerId !== null) {
    window.clearTimeout(state.timerId);
    state.timerId = null;
  }
  state.remainingTime = state.currTimerTime;
  runTimer(state.remainingTime);
}

function runTimer(duration: number): void {
  state.timerStartTime = Date.now();
  state.timerId = window.setTimeout(() => {
    state.timerId = null;
    finishedLoading();
  }, duration);
}

function restartTimer(): void {
  state.timerLoading = true;
  startLoading();
  startTimer();
}

/* ------------------------------------------------------------------ */
/*  Loading Lifecycle                                                  */
/* ------------------------------------------------------------------ */

function startLoading(): void {
  showElement(dom.loadLogo);
  hideElement(dom.danceCat);
  hideElement(dom.refreshBtn);
  showElement(dom.loadingText);
  refreshTitle();
  stopShake(dom.titleMessage);
}

function finishedLoading(): void {
  state.timerLoading = false;
  if (state.timerPaused) return;

  sounds.alarm.play();
  hideElement(dom.loadLogo);
  showElement(dom.danceCat);
  showElement(dom.refreshBtn);
  hideElement(dom.loadingText);
  refreshTitle();
  startShake(dom.titleMessage);
}

/* ------------------------------------------------------------------ */
/*  Pause / Resume                                                     */
/* ------------------------------------------------------------------ */

function pauseTimer(): void {
  state.timerPaused = true;
  sounds.alarm.pause();

  if (state.timerId !== null) {
    window.clearTimeout(state.timerId);
    state.timerId = null;
    const elapsedTime = Date.now() - state.timerStartTime;
    state.remainingTime = Math.max(0, state.remainingTime - elapsedTime);
  }
}

function unpauseTimer(): void {
  state.timerPaused = false;

  if (state.timerLoading) {
    startLoading();
    if (state.remainingTime > 0) {
      runTimer(state.remainingTime);
    } else {
      finishedLoading();
    }
  } else {
    finishedLoading();
  }
}

/* ------------------------------------------------------------------ */
/*  "Sleep" Mode (extended pause with ambience)                        */
/* ------------------------------------------------------------------ */

function setSleepModeClasses(enabled: boolean): void {
  dom.bodyMain?.classList.toggle("sleep-bg", enabled);
  dom.titleContainer?.classList.toggle("sleep", enabled);
  if (dom.titleContainer) {
    for (const child of Array.from(dom.titleContainer.children)) {
      child.classList.toggle("sleep", enabled);
    }
  }
}

async function playBackground(): Promise<void> {
  sounds.bulb.play();
  sounds.cicada.play();
}

async function pauseLoading(): Promise<void> {
  pauseTimer();
  setSleepModeClasses(true);

  hideElement(dom.loadLogo);
  hideElement(dom.danceCat);
  hideElement(dom.refreshBtn);
  hideElement(dom.loadingText);
  showElement(dom.sleepCat);
  stopShake(dom.titleMessage);
  refreshTitle();

  await playBackground();
}

function unpauseLoading(): void {
  hideElement(dom.sleepCat);
  sounds.cicada.pause();
  sounds.bulb.pause();
  setSleepModeClasses(false);

  unpauseTimer();
}

/* ------------------------------------------------------------------ */
/*  Popup Window                                                       */
/* ------------------------------------------------------------------ */

async function createPopup(): Promise<void> {
  console.log("Invoked function createPopup");

  // WebviewWindow creates both the window and webview together
  const popup = new WebviewWindow("popup", {
    url: "/src/components/popup/popup.html",
    width: 400,
    height: 200,
    decorations: false,
    title: "Popup Window",
    resizable: false,
    center: true,
  });

  popup.once("tauri://error", (e) => {
    console.error("Error creating popup window:", e);
  });

  popup.once("tauri://created", () => {
    console.log("Popup window successfully created!");
    sounds.confetti.play();
    state.popupActive = true;
  });

  popup.once("tauri://close-requested", async () => {
    await popup.destroy();
    state.popupActive = false;
    toggleBlock();
    startLoading();
    startPage();
  });
}

function startPage(): void {
  setAnimTime(0);
  state.currTimerTime = BASE_TIMER_TIME_MS;
  pauseTimer();
  timerDialog.showModal();
}

/* ------------------------------------------------------------------ */
/*  Event Wiring                                                       */
/* ------------------------------------------------------------------ */

function initEventListeners(): void {
  window.addEventListener("DOMContentLoaded", () => {
    setAnimTime(0);
    timerDialog.showModal();
    console.log("Timer is " + LEGACY_UNUSED.randomTimer);
  });

  document.getElementById("close-btn")?.addEventListener("click", () => {
    dialog1.close();
  });

  document.getElementById("popup-btn")?.addEventListener("click", () => {
    sounds.alarm.pause();
    createPopup();
    toggleBlock();
  });

  document.addEventListener("contextmenu", (e) => {
    if (state.popupActive) e.preventDefault();
  });

  document.getElementById("settings-btn")?.addEventListener("click", () => {
    pauseTimer();
    timerDialog.showModal();
  });

  document.getElementById("pause-btn")?.addEventListener("click", () => {
    if (state.timerPaused) unpauseLoading();
    else pauseLoading();
  });

  document.getElementById("dialog-cancel-btn")?.addEventListener("click", () => {
    unpauseTimer();
    timerDialog.close();
  });

  document.querySelectorAll<HTMLButtonElement>(".timer-option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const length = btn.dataset.length;
      if (length && TIMER_PRESETS[length]) {
        state.currTimerTime = TIMER_PRESETS[length].timerTime * 1000;
        setAnimTime();
        if (state.timerLoading) restartTimer();
      }
      timerDialog.close();
    });
  });

  window.setInterval(incrementLoadingText, TICK_INTERVAL_MS);
}

initEventListeners();
