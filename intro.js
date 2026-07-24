/* ============================================================
   NULL BYTE — intro.js
   1. Verifies the session token in the background.
   2. Plays a boot-sequence (typed log lines + progress bar).
   3. Crossfades into the access screen.
   Invalid/missing session -> bail out to login immediately,
   no boot sequence shown.
   ============================================================ */

(function () {
  "use strict";

  const API_BASE_URL = ""; // same server serves frontend + API

  const BOOT_LINES = [
    { text: "INITIALIZING SECURE SESSION" },
    { text: "ORDER ID VERIFIED", ok: true },
    { text: "DECRYPTING BUNDLE INDEX" },
    { text: "MOUNTING GAME LIBRARY" },
    { text: "ACCESS GRANTED", ok: true }
  ];

  const CHAR_MS = 16;      // typing speed per character
  const LINE_PAUSE_MS = 220; // pause after each line finishes

  function redirectToLogin(delay) {
    localStorage.removeItem("nullbyte_token");
    setTimeout(() => { window.location.href = "index.html"; }, delay || 0);
  }

  async function verifySession() {
    const token = localStorage.getItem("nullbyte_token");
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/${token}`);
      const data = await res.json();
      return !!data.valid;
    } catch (err) {
      return false;
    }
  }

  function typeLine(el, text, done) {
    let i = 0;
    el.classList.add("is-shown");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    function step() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        el.appendChild(cursor);
        i++;
        setTimeout(step, CHAR_MS);
      } else {
        cursor.remove();
        done();
      }
    }
    step();
  }

  function playBoot(onComplete) {
    const logEl = document.getElementById("bootLog");
    const fillEl = document.getElementById("bootBarFill");
    const pctEl = document.getElementById("bootPct");
    const total = BOOT_LINES.length;
    let index = 0;

    function nextLine() {
      if (index >= total) {
        setTimeout(onComplete, 350);
        return;
      }

      const line = BOOT_LINES[index];
      const row = document.createElement("span");
      row.className = "boot__log-line";
      logEl.appendChild(row);

      const prefix = line.ok ? "[ OK ] " : "> ";
      typeLine(row, prefix + line.text, () => {
        if (line.ok) {
          row.innerHTML = `<span class="ok">[ OK ]</span> ${line.text}`;
        }
        index++;
        const pct = Math.round((index / total) * 100);
        fillEl.style.width = pct + "%";
        pctEl.textContent = String(pct).padStart(2, "0") + "%";
        setTimeout(nextLine, LINE_PAUSE_MS);
      });
    }

    nextLine();
  }

  function runRevealSequence() {
    const els = Array.from(document.querySelectorAll("[data-reveal]"))
      .sort((a, b) => Number(a.dataset.reveal) - Number(b.dataset.reveal));

    els.forEach((el, i) => {
      setTimeout(() => el.classList.add("is-visible"), i * 100);
    });
  }

  function showAccessScreen() {
    document.getElementById("boot").classList.add("is-done");
    runRevealSequence();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const valid = await verifySession();

    if (!valid) {
      redirectToLogin(0);
      return;
    }

    playBoot(showAccessScreen);

    document.getElementById("enterLibrary").addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "library.html";
    });
  });
})();
