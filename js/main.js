(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const modal = byId("infoModal");
  const modalTitle = byId("modalTitle");
  const modalDescription = byId("modalDescription");
  const descriptionGrid = byId("descriptionGrid");
  const miniGameGrid = byId("miniGameGrid");

  byId("siteTitle").textContent = SITE_CONFIG.siteTitle;
  byId("siteSubtitle").textContent = SITE_CONFIG.siteSubtitle;
  byId("siteFooter").textContent = SITE_CONFIG.siteFooter;
  byId("productButtonTitle").textContent = SITE_CONFIG.productInfo.buttonTitle;

  function openInfo(title, description, emptyMessage) {
    modalTitle.textContent = title;
    modalDescription.textContent = description.trim() || emptyMessage;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    byId("modalClose").focus();
  }

  function closeInfo() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  SITE_CONFIG.descriptionCards.slice(0, 4).forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "description-card";
    button.innerHTML = `<span class="card-number">GUIDE 0${index + 1}</span><strong></strong>`;
    button.querySelector("strong").textContent = item.title || `게임 설명 ${index + 1}`;
    button.addEventListener("click", () => {
      openInfo(item.title || `게임 설명 ${index + 1}`, item.description || "", "아직 설명이 입력되지 않았습니다. js/config.js에서 내용을 작성해 주세요.");
    });
    descriptionGrid.appendChild(button);
  });

  byId("productButton").addEventListener("click", () => {
    openInfo(SITE_CONFIG.productInfo.buttonTitle || "상품 안내", SITE_CONFIG.productInfo.description || "", "아직 상품 안내가 입력되지 않았습니다. js/config.js에서 내용을 작성해 주세요.");
  });

  SITE_CONFIG.miniGames.forEach((name, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-game-button";
    button.innerHTML = `<span></span><small>준비 중</small>`;
    button.querySelector("span").textContent = name || `미니게임 ${index + 1}`;
    button.addEventListener("click", () => {
      openInfo(name || `미니게임 ${index + 1}`, "이 미니게임은 아직 준비 중입니다.", "이 미니게임은 아직 준비 중입니다.");
    });
    miniGameGrid.appendChild(button);
  });

  byId("modalClose").addEventListener("click", closeInfo);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeInfo();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeInfo();
  });
})();
