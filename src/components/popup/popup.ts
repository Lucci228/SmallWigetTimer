import { getCurrentWindow } from "@tauri-apps/api/window";

const close_btn = document.getElementById("close-btn");
close_btn?.addEventListener("click", async () => {
  await getCurrentWindow().close();
})
