import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

let globalCounter: number = 0;
let randomTimer: number = 0;
let timerReset: boolean = true;
const timeout: number = 1000;
const min_timer = 5;
const max_timer = 10;
const togglePlay = (audio: {
  paused: boolean;
  play: () => void;
  pause: () => void;
}) => (audio.paused ? audio.play() : audio.pause());

function toggleLoading(): void {
  const load_logo = document.getElementById("load-cat");
  const dance_cat = document.getElementById("cat-container");
  const refresh_btn = document.getElementById("refresh-btn");
  const loading_text = document.getElementById("loading-text");
  const title_message = document.getElementById("title-text");
  // const slots_audio = <HTMLAudioElement>document.getElementById("myAudio");
  // playAudio(slots_audio);
  toggleVisibility(load_logo);
  toggleVisibility(dance_cat);
  toggleVisibility(refresh_btn);
  toggleVisibility(loading_text);
  refreshTitle();
  toggleShake(title_message);
}

function playAudio(element: HTMLAudioElement | null) {
  if (!element) return;
  element.volume = 0.05;
  togglePlay(element);
}

function refreshTitle(): void {
  const title_container = document.getElementById("title-text");
  if (title_container) {
    if (timerReset) title_container.innerText = "Beb Moments in Progress";
    else title_container.innerText = "Dai mesaj lui BEB!!!!";
  }
}

function restart_timer(): void {
  timerReset = true;
  toggleLoading();
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

function danceCat(): void {
  timerReset = false;
  toggleLoading();
}

function startTimer(): void {
  randomTimer = newTimerValue(min_timer, max_timer) * 1000;
  window.setTimeout(danceCat, randomTimer);
}

function toggleVisibility(element: HTMLElement | null) {
  if (!element) return;
  element.classList.toggle("hidden");
  console.log("Toggled element " + element.id);
}

function toggleShake(element: HTMLElement | null) {
  if (!element) return;
  element.classList.toggle("shake-element");
  console.log("Toggled element " + element.id);
}

// function closeDialog(element:HTMLDialogElement | null) {
//   if (!element) return;
//   element.close();
// }

async function createPopup() {
  console.log("Invoked function createPopup");

  // WebviewWindow creates both the window and webview together
  const popup = new WebviewWindow('popup', {
    url: '/src/components/popup/popup.html', // path to your page
    width: 400,
    height: 200,
    decorations: false,
    title: 'Popup Window',
    resizable: false,
    center: true,
  });

  // Listen for window creation failure
  popup.once('tauri://error', (e) => {
    console.error('Error creating popup window:', e);
  });

  // Listen for window creation success
  popup.once('tauri://created', () => {
    console.log('Popup window successfully created!');
  });
}

const newTimerValue = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const button = document.getElementById("refresh-btn");
button?.addEventListener("click", () => restart_timer());

const dialog1 = <HTMLDialogElement>document.getElementById("dialog1")

window.addEventListener("DOMContentLoaded", () => {
  startTimer();

  console.log("Timer is " + randomTimer);
});

document.getElementById("close-btn")?.addEventListener("click", () => dialog1.close())
document.getElementById("popup-btn")?.addEventListener("click", () => createPopup())




window.setInterval(incrementText, timeout);
