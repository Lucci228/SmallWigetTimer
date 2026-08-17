import { getCurrentWindow } from "@tauri-apps/api/window";

// ---- Assets ----
const soundUrl = new URL('../../assets/gunshot.mp3', import.meta.url).href;
const yipeeSoundUrl = new URL('../../assets/yippee.mp3', import.meta.url).href;
const errorUrl = new URL('../../assets/popup.mp3', import.meta.url).href;

const gunshotNoise: HTMLAudioElement = new Audio(soundUrl);
const yipeeNoise: HTMLAudioElement = new Audio(yipeeSoundUrl);
const errorNoise: HTMLAudioElement = new Audio(errorUrl);
yipeeNoise.volume = 0.01;

// ---- WhatsApp link config ----
const ws_message: string = "Salut beb! Ce mai faci? :*";
const ws_number: string = "40787594964";
const waUrl = `https://wa.me/${ws_number}?text=${encodeURIComponent(ws_message)}`;

// ---- State ----
let click_count: number = 0;

// ---- DOM references ----
const yes_btn = document.getElementById("yes-btn") as HTMLAnchorElement;
const close_btn = document.getElementById("close-btn");
const wrong_btn = document.getElementById("wrong-btn");
const header_text = document.getElementById("header-text");
const body_text = document.getElementById("body-text");

yes_btn.href = waUrl;

// ---- Helper functions ----
function triggerShake(el: HTMLElement | null) {
  if (el === null) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

async function typeWriter(element: HTMLElement | null, speed = 100) {
  if (element === null) return;
  const fullText = element.textContent;
  element.textContent = '';
  element.style.visibility = 'visible';
  for (let i = 0; i < fullText.length; i++) {
    element.textContent += fullText.charAt(i);
    let pause = speed;
    await new Promise(resolve => setTimeout(resolve, pause));
  }
  element.style.border = "none";
}

async function showElements(delay = 100) {
  const hiddenElem = document.querySelectorAll<HTMLElement>(".hidden");
  for (const elem of hiddenElem) {
    await new Promise(resolve => setTimeout(resolve, delay));
    elem.classList.toggle("hidden");
  }
}

// ---- Event listeners ----
yes_btn.addEventListener("click", async () => {
  await yipeeNoise.play()
  await new Promise(resolve => setTimeout(resolve, 700))
  await getCurrentWindow().close()
});

close_btn?.addEventListener("click", () => {
  errorNoise.load();
  errorNoise.play();
  click_count++;

  if (header_text) {
    header_text.textContent = "BEB NU MAI INCERCA SA SCAPI";
    triggerShake(header_text);
  }

  if (click_count > 5) {
    if (body_text) {
      body_text.textContent = "OPRESTETEEEEE!!!!!!";
    }
  }

  if (click_count > 7) {
    gunshotNoise.play();
    close_btn.remove();
  }
});

wrong_btn?.addEventListener("click", () => {
  wrong_btn.remove();
  gunshotNoise.volume = 0.1;
  gunshotNoise.play();
});

// ---- Init ----
window.addEventListener("DOMContentLoaded", async () => {
  await typeWriter(body_text, 50);
  showElements(800);
});
