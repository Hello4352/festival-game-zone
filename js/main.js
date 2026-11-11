
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

  function openInfo(title, description) {
    modalTitle.textContent = title;
    modalDescription.textContent =
      description || "아직 설명이 입력되지 않았습니다.";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeInfo() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // 게임 설명 버튼 4개 생성
  SITE_CONFIG.descriptionCards.slice(0, 4).forEach((item, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "description-card";

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = `GUIDE 0${index + 1}`;

    const title = document.createElement("strong");
    title.textContent = item.title || `게임 설명 ${index + 1}`;

    button.append(number, title);

    button.addEventListener("click", () => {
      openInfo(
        item.title || `게임 설명 ${index + 1}`,
        item.description
      );
    });

    descriptionGrid.appendChild(button);
  });

  // 미니게임 버튼 6개 생성
  SITE_CONFIG.miniGames.slice(0, 6).forEach((name, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "mini-game-button";

    const title = document.createElement("span");
    title.textContent = name || `미니게임 ${index + 1}`;

    const status = document.createElement("small");
    status.textContent = "준비 중";

    button.append(title, status);

    button.addEventListener("click", () => {
      openInfo(
        name || `미니게임 ${index + 1}`,
        "이 미니게임은 아직 준비 중입니다."
      );
    });

    miniGameGrid.appendChild(button);
  });

  // 팝업 닫기
  byId("modalClose").addEventListener("click", closeInfo);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeInfo();
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal.classList.contains("is-open")
    ) {
      closeInfo();
    }
  });

})();
