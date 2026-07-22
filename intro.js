/* ============================================================
   NULL BYTE — intro.js
   Orchestrates the reveal sequence and guards the page behind
   a valid session token issued by the backend at /api/login.
   ============================================================ */

(function () {
  "use strict";

  const API_BASE_URL = ""; // same server serves frontend + API

  /* ---------- reveal sequence ----------
     Each [data-reveal] element gets .is-visible added in order, with
     a short stagger. One pass, no loops, nothing re-animates. */
  function runRevealSequence() {
    const els = Array.from(document.querySelectorAll("[data-reveal]"))
      .sort((a, b) => Number(a.dataset.reveal) - Number(b.dataset.reveal));

    els.forEach((el, i) => {
      setTimeout(() => el.classList.add("is-visible"), 160 + i * 110);
    });
  }

  /* ---------- session guard ---------- */
  async function checkSession() {
    const statusEl = document.getElementById("introStatus");
    const token = localStorage.getItem("nullbyte_token");

    if (!token) {
      redirectToLogin(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/${token}`);
      const data = await response.json();

      if (data.valid) {
        statusEl.textContent = "SESSION ACTIVE";
      } else {
        statusEl.textContent = "SESSION EXPIRED — RETURNING TO LOGIN";
        redirectToLogin(900);
      }
    } catch (err) {
      statusEl.textContent = "COULD NOT VERIFY SESSION — RETRYING LOGIN";
      redirectToLogin(1200);
    }
  }

  function redirectToLogin(delay) {
    localStorage.removeItem("nullbyte_token");
    setTimeout(() => {
      window.location.href = "index.html";
    }, delay);
  }

  document.addEventListener("DOMContentLoaded", () => {
    runRevealSequence();
    checkSession();

    document.getElementById("enterLibrary").addEventListener("click", (e) => {
      e.preventDefault();
      alert("Library page coming soon.");
    });
  });
})();
