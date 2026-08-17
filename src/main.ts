import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import alarmUrl from './assets/alarm.mp3'
import confettiUrl from './assets/confetti.mp3'
import cicadaUrl from './assets/cicada.mp3'
import bulbUrl from './assets/lightbulb.mp3'

let globalCounter: number = 0;
let randomTimer: number = 0;
let timerLoading: boolean = true;
let timerPaused: boolean = false;
let popupActive: boolean = false;


let alarmNoise = new Audio(alarmUrl)
alarmNoise.volume = 0.5
let confettiNoise = new Audio(confettiUrl)
let cicadaNoise = new Audio(cicadaUrl)
cicadaNoise.volume = 0.05
cicadaNoise.loop = true
let bulbNoise = new Audio(bulbUrl)
bulbNoise.volume = 0.2
bulbNoise.loop = true


const timeout: number = 1000;
let min_timer = 5;
let max_timer = 10;
let timerId: number | null = null;
let timerStartTime: number = 0;
let remainingTime: number = 0;

const load_logo = document.getElementById("load-cat");
const dance_cat = document.getElementById("cat-container");
const refresh_btn = document.getElementById("popup-btn");
const loading_text = document.getElementById("loading-text");
const title_message = document.getElementById("title-text");
const sleep_cat = document.getElementById("sleep-cat")
const body_cont = document.getElementById("body-main")
const body_header = document.getElementById("title-container")


function startLoading(): void {
  showElement(load_logo);
  hideElement(dance_cat);
  hideElement(refresh_btn);
  showElement(loading_text);
  refreshTitle();
  stopShake(title_message);
}

function finishedLoading(): void {
  timerLoading = false
  if (timerPaused) return
  alarmNoise.play()
  hideElement(load_logo)
  showElement(dance_cat)
  showElement(refresh_btn)
  hideElement(loading_text)
  refreshTitle()
  startShake(title_message)
}

function unpauseLoading() {
  timerPaused = false
  hideElement(sleep_cat)
  cicadaNoise.pause()
  bulbNoise.pause()
  body_cont?.classList.remove("sleep-bg")
  body_header?.classList.remove("sleep")
  if (body_header) {
    for (const child of Array.from(body_header.children)) {
      child.classList.remove("sleep");
    }
  }
  if (timerLoading) {
      startLoading();
      if (remainingTime > 0) {
        runTimer(remainingTime);
      } else {
        finishedLoading();
      }
    } else {
      finishedLoading();
    }
}

async function playBackground() {
  bulbNoise.play()
  cicadaNoise.play()
}

async function pauseLoading(): Promise<void> {
  timerPaused = true
  alarmNoise.pause()
  if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
      const elapsedTime = Date.now() - timerStartTime;
    remainingTime = Math.max(0, remainingTime - elapsedTime);
  }
  body_cont?.classList.add("sleep-bg")
  body_header?.classList.add("sleep")
  if (body_header) {
    for (const child of Array.from(body_header.children)) {
      child.classList.add("sleep");
    }
  }
  hideElement(load_logo)
  hideElement(dance_cat)
  hideElement(refresh_btn)
  hideElement(loading_text)
  showElement(sleep_cat)
  stopShake(title_message)
  refreshTitle()
  await playBackground()
}


function refreshTitle(): void {
  const title_container = document.getElementById("title-text");
  if (title_container) {
    if (timerPaused) title_container.innerText = "Beb Moments Paused Zzz..."
    else if (timerLoading) title_container.innerText = "Beb Moments in Progress";
    else title_container.innerText = "Dai mesaj lui BEB!!!!";
  }
}

function restart_timer(): void {
  timerLoading = true;
  startLoading();
  startTimer();
}

function incrementText(): void {
  globalCounter = (globalCounter + 1) % 4;
  const baseText = "Loading! Please wait";
  const textContainer = document.getElementById("loading-text");
  if (textContainer === null) return;
  if (textContainer.classList.contains("hidden")) return;
  textContainer.innerHTML = baseText + ".".repeat(globalCounter);
}

function startTimer(): void {
  if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
  }
  randomTimer = newTimerValue(min_timer, max_timer) * 1000;
  remainingTime = randomTimer;
  runTimer(remainingTime)
}

function runTimer(duration: number): void {
  timerStartTime = Date.now();
  timerId = window.setTimeout(() => {
    timerId = null;
    finishedLoading();
  }, duration);
}

function hideElement(element: HTMLElement | null) {
  if (!element) return;
  element.classList.add("hidden");
  console.log("Toggled element " + element.id);
}

function showElement(element: HTMLElement | null) {
  if (!element) return;
  element.classList.remove("hidden");
  console.log("Toggled element " + element.id);
}


function startShake(element: HTMLElement | null) {
  if (!element) return;
  element.classList.add("shake-element");
  console.log("Toggled element " + element.id);
}

function stopShake(element: HTMLElement | null) {
  if (!element) return;
  element.classList.remove("shake-element");
  console.log("Toggled element " + element.id);
}

function toggleBlock(): void {
  document.getElementById("main")?.classList.toggle("blocked");
}


async function createPopup() {
  console.log("Invoked function createPopup");

  // WebviewWindow creates both the window and webview together
  const popup = new WebviewWindow("popup", {
    url: "/src/components/popup/popup.html", // path to your page
    width: 400,
    height: 200,
    decorations: false,
    title: "Popup Window",
    resizable: false,
    center: true,
  });

  // Listen for window creation failure
  popup.once("tauri://error", (e) => {
    console.error("Error creating popup window:", e);
  });

  // Listen for window creation success
  popup.once("tauri://created", () => {
    console.log("Popup window successfully created!");
    confettiNoise.play()
    popupActive = true;
    //play noises
    //focus window
  });

  popup.once("tauri://close-requested", async () => {
    await popup.destroy()
    popupActive = false
    toggleBlock()
    restart_timer()
  })

  popup.once("tauri://destroyed", async () => {
  });
}

const newTimerValue = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};


const dialog1 = <HTMLDialogElement>document.getElementById("dialog1");

window.addEventListener("DOMContentLoaded", () => {
  startTimer();

  console.log("Timer is " + randomTimer);
});

document
  .getElementById("close-btn")
  ?.addEventListener("click", () => dialog1.close());

document.getElementById("popup-btn")?.addEventListener("click", () => {
  alarmNoise.pause()
  createPopup();
  toggleBlock();
});

window.setInterval(incrementText, timeout);
document.addEventListener("contextmenu", (e) => {
  if (popupActive) e.preventDefault()

});

const timerDialog = <HTMLDialogElement>document.getElementById("timer-dialog");

const timerPresets: Record<string, { min: number; max: number, anim_speed:string }> = {
  short: { min: 10, max: 20, anim_speed: "1.74s" },
  medium: { min: 60, max: 120, anim_speed: "2.74s" },
  long: { min: 3600, max: 7200, anim_speed: "3.74s" },
};

document.getElementById("settings-btn")?.addEventListener("click", () => {
  timerDialog.showModal();
});

document.getElementById("pause-btn")?.addEventListener("click", () => {
  if (timerPaused) unpauseLoading()
  else pauseLoading()
})

document.getElementById("dialog-cancel-btn")?.addEventListener("click", () => {
  timerDialog.close();
});

document.querySelectorAll<HTMLButtonElement>(".timer-option-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const length = btn.dataset.length;
    if (length && timerPresets[length]) {
      min_timer = timerPresets[length].min;
      max_timer = timerPresets[length].max;
      document.documentElement.style.setProperty('--anim-speed', timerPresets[length].anim_speed);
      console.log(`Timer set to ${length}: ${min_timer}-${max_timer}s`);
      if (timerLoading) restart_timer()
    }
    timerDialog.close();
  });
});
