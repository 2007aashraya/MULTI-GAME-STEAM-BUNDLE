/* ============================================================
   NULL BYTE — MULTI GAMES BUNDLE
   home.js — game wall render + order-id authentication (demo)
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 1. GAME ART SOURCES ---------- */
  const GAME_IMAGES = [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYEvzeM4rqDUUWY8DOepk3HpdSzHdY2rDL8EiRlX93g790BuQVhQUOBGVT&s=10",
    "https://m.media-amazon.com/images/M/MV5BOGI2Yjk1ZTEtZTA2Yy00ZjQ3LTk4MTgtYTgyMGQ1Zjk3YjgzXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "https://assets-prd.ignimgs.com/2025/08/30/eafc26-1756536969467.jpg",
    "https://store-images.s-microsoft.com/image/apps.60342.13547047233571036.013c5ec3-a5d7-4e8a-83e7-470299116376.2346f664-c01a-4b06-a92c-4819a43e8f75",
    "https://m.media-amazon.com/images/M/MV5BMWM3MGExMDMtN2ZkMC00YmNlLWFlZTQtMDM2YjRlMjhmMjNkXkEyXkFqcGc@._V1_.jpg",
    "https://static.posters.cz/image/1300/149551.jpg",
    "https://cdn1.epicgames.com/spt-assets/4c57275be6f1469b9ae10006f7429a81/f1-25-1u7mv.jpg",
    "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png",
    "https://image.api.playstation.com/vulcan/ap/rnd/202008/1020/T45iRN1bhiWcJUzST6UFGBvO.png",
    "https://cdn1.epicgames.com/offer/3ddd6a590da64e3686042d108968a6b2/EGS_GodofWar_SantaMonicaStudio_S2_1200x1600-fbdf3cbc2980749091d52751ffabb7b7_1200x1600-fbdf3cbc2980749091d52751ffabb7b7",
    "https://www.gamescard.net/wp-content/uploads/2023/11/God-of-War-Ragnarok-For-Ps5.jpg",
    "https://m.media-amazon.com/images/M/MV5BZDBmYzY3NTItZTA3Ny00OWY2LTliYzQtM2UwMzRjMjU2OGYzXkEyXkFqcGc@._V1_.jpg",
    "https://cdn1.epicgames.com/offer/7713e3fa4b234e0d8f553044205d53b6/EGS_TheLastofUsPartIIRemastered_NaughtyDogLLCNixxesSoftwareIronGalaxy_S2_1200x1600-2e13755a6b3fec2ee9dbcc231a1cf39c",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBIU1mE9NMbYv3lULMACiH_QbUGkTuI6KlxMhcZkQIhs9x4LXfhxUOCJtC&s=10",
    "https://image.api.playstation.com/vulcan/ap/rnd/202509/1814/8ed0a9e5f23ed173881e2e21e259eac99a2457994f059b6c.png",
    "https://cdn1.epicgames.com/spt-assets/a7641d724f1242db95f8f72fc0fd8d81/kingdom-come-deliverance-2-14rqo.png",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSphDR1Bg8l0QXWcoqfeLLJZJs2wRtJceZ27PIAFgGRlg&s=10",
    "https://cdn1.epicgames.com/0a84818055e740a7be21a2e5b6162703/offer/WatchDogs_Legion_Store_Portrait_1200x1600-1200x1600-a6b2d4cce489aeeb87bad4a6db168bed.jpg",
    "https://assets-prd.ignimgs.com/2023/10/05/cyberpunk-2077-button-1696522368798.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJLCNC4lMP3uYHsq063HFlu77Skk-heShJlqYuu8SCbGFVVeZCTBtbGXOb&s=10",
    "https://store-images.s-microsoft.com/image/apps.33244.14422109142805611.71c71dc7-fe47-4083-ad56-ab54c9a5607d.32a28f70-8b6e-4b7e-ae64-c38ae01f32c1",
    "https://cdn1.epicgames.com/offer/6e6aa039c73347b885803de65ac5d3db/EGS_GhostofTsushima_SuckerPunchProductions_S2_1200x1600-e23e02c1d70be7b528dba50860f87d39",
    "https://store-images.s-microsoft.com/image/apps.19050.71189044859921004.2f5f4865-c27c-4313-976b-c3322734813b.84db885c-96d6-45a8-9de0-32ac9824a54d",
    "https://assets.xboxservices.com/assets/28/98/2898b802-4629-4b5d-b825-e5aee13aab8c.jpg?n=Starfield_GLP-Page-Hero-0_1083x1222_05.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6Ep3DE58K2QVQnUNEmttC_8zPDCueAZ44nKq7xXzO0w&s=10",
    "https://cdn1.epicgames.com/offer/ed55aa5edc5941de92fd7f64de415793/EGS_HITMANWorldofAssassination_IOInteractiveAS_Bundles_S2_1200x1600-b5b14d86572a4696beb07f24d1d097dd"
  ];

  /* split the pool round-robin into 3 columns, then duplicate
     each column's list so the drift animation always has content
     to show no matter how far it travels */
  function buildColumns(images) {
    const cols = [[], [], []];
    images.forEach((src, i) => cols[i % 3].push(src));
    return cols.map((list) => list.concat(list)); // duplicate for seamless coverage
  }

  function renderWall() {
    const columns = buildColumns(GAME_IMAGES);
    const els = [
      document.querySelector(".col--a"),
      document.querySelector(".col--b"),
      document.querySelector(".col--c")
    ];

    columns.forEach((list, idx) => {
      const el = els[idx];
      if (!el) return;
      const frag = document.createDocumentFragment();
      list.forEach((src) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.style.backgroundImage = `url("${src}")`;
        frag.appendChild(tile);
      });
      el.appendChild(frag);
    });
  }

  /* ---------- 2. ORDER-ID AUTHENTICATION (frontend demo) ----------
     NOTE: this is a client-side placeholder only. In production the
     order IDs below move server-side (e.g. server.js reading from
     key.json) and this form should POST to that endpoint instead of
     checking an in-page array. */
  const VALID_ORDER_IDS = [
    "NB-0001-XQ7",
    "NB-0002-K4R",
    "NB-0003-T9L",
    "NB-0004-P2W",
    "NB-0005-Z8H"
  ];

  function initAuth() {
    const input = document.getElementById("orderId");
    const btn = document.getElementById("loginBtn");
    const msg = document.getElementById("authMsg");

    function setMessage(text, type) {
      msg.textContent = text;
      msg.className = "auth-msg" + (type ? " " + type : "");
    }

    function clearError() {
      input.classList.remove("is-error");
    }

    function attemptLogin() {
      const value = input.value.trim().toUpperCase();

      if (!value) {
        input.classList.add("is-error");
        setMessage("ENTER YOUR ORDER ID TO CONTINUE.", "error");
        input.focus();
        return;
      }

      btn.disabled = true;
      btn.querySelector("span").textContent = "VERIFYING...";

      // simulate a lookup call
      setTimeout(() => {
        const isValid = VALID_ORDER_IDS.includes(value);

        if (isValid) {
          setMessage("ORDER VERIFIED. WELCOME TO THE BUNDLE.", "success");
          clearError();
          btn.querySelector("span").textContent = "LOGIN";
          btn.disabled = false;
          // TODO: redirect to the library / unlock the game wall
        } else {
          input.classList.add("is-error");
          setMessage("ORDER ID NOT RECOGNIZED. CHECK AND TRY AGAIN.", "error");
          btn.querySelector("span").textContent = "LOGIN";
          btn.disabled = false;
        }
      }, 500);
    }

    btn.addEventListener("click", attemptLogin);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attemptLogin();
    });
    input.addEventListener("input", () => {
      clearError();
      setMessage("", "");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderWall();
    initAuth();
  });
})();