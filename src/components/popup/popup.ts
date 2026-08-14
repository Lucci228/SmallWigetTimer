import { getCurrentWindow } from "@tauri-apps/api/window";

const close_btn = document.getElementById("close-btn");
close_btn?.addEventListener("click", async () => {
  await getCurrentWindow().close();
})
const wrong_btn = document.getElementById("wrong-btn");
wrong_btn?.addEventListener("click", () => {
  wrong_btn.remove()
})
wrong_btn?.onclick
