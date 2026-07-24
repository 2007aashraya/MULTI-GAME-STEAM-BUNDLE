/* ============================================================
   NULL BYTE — library.js
   Reads the session token, asks the backend which package that
   specific order ID was assigned to, and renders ONLY that
   package's content. No client-side package selection — the
   backend is the single source of truth.
   ============================================================ */

(function () {
  "use strict";

  const API_BASE_URL = "";

  // representative art — swap in your real per-package game lists later
  const STANDARD_GAMES = [
    "https://m.media-amazon.com/images/M/MV5BOGI2Yjk1ZTEtZTA2Yy00ZjQ3LTk4MTgtYTgyMGQ1Zjk3YjgzXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "https://assets-prd.ignimgs.com/2025/08/30/eafc26-1756536969467.jpg",
    "https://m.media-amazon.com/images/M/MV5BMWM3MGExMDMtN2ZkMC00YmNlLWFlZTQtMDM2YjRlMjhmMjNkXkEyXkFqcGc@._V1_.jpg",
    "https://cdn1.epicgames.com/spt-assets/4c57275be6f1469b9ae10006f7429a81/f1-25-1u7mv.jpg",
    "https://image.api.playstation.com/vulcan/ap/rnd/202008/1020/T45iRN1bhiWcJUzST6UFGBvO.png",
    "https://m.media-amazon.com/images/M/MV5BZDBmYzY3NTItZTA3Ny00OWY2LTliYzQtM2UwMzRjMjU2OGYzXkEyXkFqcGc@._V1_.jpg",
    "https://assets-prd.ignimgs.com/2023/10/05/cyberpunk-2077-button-1696522368798.jpg",
    "https://store-images.s-microsoft.com/image/apps.19050.71189044859921004.2f5f4865-c27c-4313-976b-c3322734813b.84db885c-96d6-45a8-9de0-32ac9824a54d"
  ];

  const DELUXE_BONUS_GAMES = [
    "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png",
    "https://cdn1.epicgames.com/offer/3ddd6a590da64e3686042d108968a6b2/EGS_GodofWar_SantaMonicaStudio_S2_1200x1600-fbdf3cbc2980749091d52751ffabb7b7_1200x1600-fbdf3cbc2980749091d52751ffabb7b7",
    "https://cdn1.epicgames.com/offer/7713e3fa4b234e0d8f553044205d53b6/EGS_TheLastofUsPartIIRemastered_NaughtyDogLLCNixxesSoftwareIronGalaxy_S2_1200x1600-2e13755a6b3fec2ee9dbcc231a1cf39c",
    "https://cdn1.epicgames.com/spt-assets/a7641d724f1242db95f8f72fc0fd8d81/kingdom-come-deliverance-2-14rqo.png",
    "https://cdn1.epicgames.com/offer/6e6aa039c73347b885803de65ac5d3db/EGS_GhostofTsushima_SuckerPunchProductions_S2_1200x1600-e23e02c1d70be7b528dba50860f87d39",
    "https://assets.xboxservices.com/assets/28/98/2898b802-4629-4b5d-b825-e5aee13aab8c.jpg?n=Starfield_GLP-Page-Hero-0_1083x1222_05.jpg"
  ];

  function tileGrid(urls) {
    return urls.map((u) => `<div class="lib__tile" style="background-image:url('${u}')"></div>`).join("");
  }

  function redirectToLogin() {
    localStorage.removeItem("nullbyte_token");
    window.location.href = "index.html";
  }

  function render(pkg, packageInfo) {
    const badge = document.getElementById("packageBadge");
    const body = document.getElementById("libBody");

    badge.textContent = (packageInfo?.label || pkg).toUpperCase();
    badge.classList.add(pkg);

    const isDeluxe = pkg === "deluxe";

    let html = `
      <div class="lib__intro">
        <p class="lib__eyebrow">YOUR LIBRARY</p>
        <h1 class="lib__title">${packageInfo?.label || "Your Bundle"}</h1>
        <p class="lib__sub">
          ${isDeluxe
            ? "Full catalog access, including Deluxe-exclusive titles."
            : "Core catalog access. Upgrade to Deluxe for the full bonus lineup."}
        </p>
      </div>

      <div class="lib__section-label">STANDARD CATALOG</div>
      <div class="lib__grid">${tileGrid(STANDARD_GAMES)}</div>
    `;

    if (isDeluxe) {
      html += `
        <div class="lib__section-label gold">DELUXE BONUS</div>
        <div class="lib__grid">${tileGrid(DELUXE_BONUS_GAMES)}</div>
      `;
    } else {
      html += `
        <div class="lib__locked-note">
          ${DELUXE_BONUS_GAMES.length} additional titles are available on the Deluxe
          Package. Your current Order ID is assigned to Standard, so this
          bonus catalog isn't included.
        </div>
      `;
    }

    body.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("nullbyte_token");
    if (!token) return redirectToLogin();

    try {
      const res = await fetch(`${API_BASE_URL}/api/me/${token}`);
      const data = await res.json();

      if (!data.valid) return redirectToLogin();

      render(data.package, data.packageInfo);
    } catch (err) {
      document.getElementById("libStatus").textContent =
        "Could not reach the server. Refresh to try again.";
    }
  });
})();
