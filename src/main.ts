import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import alarmUrl from "./assets/alarm.mp3";
import confettiUrl from "./assets/confetti.mp3";
import cicadaUrl from "./assets/cicada.mp3";
import bulbUrl from "./assets/lightbulb.mp3";
import rollUrl from "./assets/pacanea-roll.mp3";
import rollDoneUrl from "./assets/pacanea-done.mp3";
import rollWinUrl from "./assets/pacanea-win.mp3";
import errorUrl from "./assets/popup.mp3"


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

const BASE_TIMER_TIME_MS = 600 * 1000;


interface TimerState {
  hour: number;
  minute: number;
  second: number;
}

const targetTime: TimerState = { hour: 0, minute: 0, second: 0 };

function computeTime() {
  state.currTimerTime = targetTime.hour * 60 * 60 * 1000 + targetTime.minute * 60 * 1000 + targetTime.second * 1000;
}

function generateRandomTarget(): void {
  targetTime.hour = randomIntValue(0, 1);
  targetTime.minute = randomIntValue(0, 59);
  targetTime.second = randomIntValue(1, 59);
}

function randomValue(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomIntValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ------------------------------------------------------------------ */
/*  Mutable App State                                                  */
/* ------------------------------------------------------------------ */

const state = {
  loadingDotCount: 0,
  timerRolled: false,
  timerSet: false,
  timerLoading: true,
  timerPaused: false,
  popupActive: false,
  screenPaused: false,

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
  roll: new Audio(rollUrl),
  spinDone: new Audio(rollDoneUrl),
  spinWin: new Audio(rollWinUrl),
  error: new Audio(errorUrl)
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
  gambleBtn: document.getElementById("dialog-gamble-btn"),
  secondSlot: document.getElementById("gamble-second"),
  minuteSlot: document.getElementById("gamble-minute"),
  hourSlot: document.getElementById("gamble-hour"),

};

const timerDialog = document.getElementById("timer-dialog") as HTMLDialogElement;
const timerSlots = document.querySelectorAll<HTMLElement>(".gamble-text")
const timerSlotDivs = document.querySelectorAll<HTMLElement>(".slot-outline")


/* ------------------------------------------------------------------ */
/*  DOM Helpers                                                        */
/* ------------------------------------------------------------------ */
async function playAnimation(element: HTMLElement, triggerClass: string) {
  element.classList.add(triggerClass);

  element.style.animationDuration = `${randomValue(0.3, 0.8)}s`
  element.style.animationDelay = `${randomValue(0, 0.3)}s`
  element.style.animationIterationCount = `${randomIntValue(5, 15)}`
  const animations = element.getAnimations();
  try {
    await Promise.all(animations.map(anim => anim.finished));
    element.classList.remove(triggerClass)
    console.log('All animations finished!');
    element.style.animationIterationCount = `1`
    element.style.animationDelay = `0s`
    element.classList.add('finish');

    const finishAnimations = element.getAnimations();
    await Promise.all(finishAnimations.map(anim => anim.finished));

    console.log('Finish animation done!');
    sounds.spinDone.play();

  } catch {
    console.log('An animation was cancelled before finishing');
  }
}

async function playAnimationOnce(element: HTMLElement, triggerClass: string) {
  element.classList.add(triggerClass);

  const animations = element.getAnimations();
  if (animations.length === 0) {
    console.warn(`No active animation found for class .${triggerClass}`);
    element.classList.remove(triggerClass);
    return;
  }
  try {
    await Promise.all(animations.map((anim) => anim.finished));
    element.classList.remove(triggerClass)
  } catch (err) {
    console.log("Animation cancelled:", err);
  }
}

async function playSlots() {
  generateRandomTarget()
  console.log(`New timer generated ${targetTime.hour}h ${targetTime.minute}m ${targetTime.second}s`)
  timerSlots.forEach((elem) => elem.classList.remove("finish"))
  timerSlotDivs.forEach((elem) => elem.classList.remove("shake"))
  const promises = Array.from(timerSlots).map(slot =>
    playAnimation(slot, "spin")
  );
  await Promise.all(promises);
  timerSlotDivs.forEach((elem) => playAnimationOnce(elem, "shake"))
  sounds.spinWin.play();
}

function clearSlots() {
  state.timerSet = false;
  timerSlots.forEach((slot) => {
    slot.textContent = "0";
    slot.classList.remove("finish");
    slot.classList.remove("spin")
  })
}

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
/*  Low Latency Audio                                                  */
/* ------------------------------------------------------------------ */

const audioCtx = new AudioContext();
let rollBuffer: AudioBuffer;


async function loadSound(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  rollBuffer = await audioCtx.decodeAudioData(arrayBuffer);
}

function playRoll() {
  const source = audioCtx.createBufferSource();
  source.buffer = rollBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

function playShake(element: HTMLElement | null) {
  if (!element) return
  element.classList.remove("shake");
  void element.offsetWidth;
  element.classList.add("shake");
}

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
  setAnimTime()
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
  state.screenPaused = true
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
  state.screenPaused = false
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
  state.timerSet = false
  state.timerRolled = false
  clearSlots()
  state.currTimerTime = BASE_TIMER_TIME_MS;
  pauseTimer();
  timerDialog.showModal();
}

/* ------------------------------------------------------------------ */
/*  Event Wiring                                                       */
/* ------------------------------------------------------------------ */

function addSlotIterEvent(element: HTMLElement | null, min_val: number, max_val: number): void {
  if (!element) return
  element.addEventListener("animationiteration", (event: AnimationEvent) => {
    if (event.animationName === "gamble-spin") {
      playRoll()
      element.innerText = randomIntValue(min_val, max_val).toString();
    }
  })
}

function addSlotFinishHandler(element: HTMLElement | null, state: TimerState, key: keyof TimerState) {
  if (element === null)  return
  element.addEventListener("animationend", (event: AnimationEvent) => {
    if (event.animationName !== "finish")
      element.textContent = state[key].toString();
  });
}

function initEventListeners(): void {
  window.addEventListener("load", () => loadSound(rollUrl))

  window.addEventListener("DOMContentLoaded", () => {
    setAnimTime(0);
    timerDialog.showModal();
    addSlotIterEvent(dom.secondSlot, 1, 59)
    addSlotIterEvent(dom.minuteSlot, 0, 59)
    addSlotIterEvent(dom.hourSlot, 0, 5)
    addSlotFinishHandler(dom.hourSlot, targetTime, "hour");
    addSlotFinishHandler(dom.minuteSlot, targetTime, "minute");
    addSlotFinishHandler(dom.secondSlot, targetTime, "second");
  });

  document.getElementById("popup-btn")?.addEventListener("click", () => {
    sounds.alarm.pause();
    createPopup();
    toggleBlock();
  });

  dom.gambleBtn?.addEventListener("click", () => {
    state.timerRolled = true;
    playSlots()
  })

  document.getElementById("dialog-cancel-btn")?.addEventListener("click", () => {
    if (!state.timerSet || !state.timerRolled) {
      playShake(document.getElementById("dialog-title"))
      sounds.error.currentTime = 0
      sounds.error.play()
      return
    }
    unpauseTimer();
    timerDialog.close();
  });

  document.getElementById("dialog-confirm-btn")?.addEventListener("click", () => {
    if (!state.timerRolled ) {
      playShake(document.getElementById("dialog-title"))
      sounds.error.currentTime = 0
      sounds.error.play()
      return
    }
    computeTime();
    state.timerSet = true
    if (state.screenPaused) unpauseLoading()
    restartTimer();
    unpauseTimer();
    timerDialog.close();
  });

  document.addEventListener("contextmenu", (e) => {
    if (state.popupActive) e.preventDefault();
  });

  document.getElementById("settings-btn")?.addEventListener("click", () => {
    pauseTimer();
    timerDialog.showModal()
    playSlots()
  });

  document.getElementById("pause-btn")?.addEventListener("click", () => {
    if (state.timerPaused) unpauseLoading();
    else pauseLoading();
  });

  window.setInterval(incrementLoadingText, TICK_INTERVAL_MS);
}

initEventListeners();
