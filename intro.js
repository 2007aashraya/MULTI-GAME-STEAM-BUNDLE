/* ============================================================
   NULL BYTE — intro.js
   Guards the welcome page: only visible with a valid session
   token issued by the backend at /api/login.
   ============================================================ */

(function () {
  "use strict";

  const API_BASE_URL = ""; // same server now serves frontend + API
  const statusEl = document.getElementById("introStatus");

  async function checkSession() {
    const token = localStorage.getItem("nullbyte_token");

    if (!token) {
      redirectToLogin();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/session/${token}`);
      const data = await response.json();

      if (data.valid) {
        statusEl.textContent = "SESSION ACTIVE";
      } else {
        redirectToLogin();
      }
    } catch (err) {
      statusEl.textContent = "COULD NOT VERIFY SESSION — RETRY LOGIN.";
      redirectToLogin(1500);
    }
  }

  function redirectToLogin(delay) {
    localStorage.removeItem("nullbyte_token");
    setTimeout(() => {
      window.location.href = "index.html";
    }, delay || 300);
  }

  document.addEventListener("DOMContentLoaded", checkSession);

  // "ENTER LIBRARY" is a placeholder until the actual library page exists
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("continueBtn");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Library page coming soon.");
    });
  });
})();
