
(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  const modal = byId("infoModal");
  const modalTitle = byId("modalTitle");
  const modalDescription = byId("modalDescription");
  const descriptionGrid = byId("descriptionGrid");
  const miniGameGrid = byId("miniGameGrid");

  // 설정 내용 표시
  byId("siteTitle").textContent = SITE_CONFIG.siteTitle;
  byId("siteSubtitle").textContent = SITE_CONFIG.siteSubtitle;
  byId("siteFooter").textContent = SITE_CONFIG.siteFooter;

  // 설명 팝업 열기
  function openInfo(title, description) {
    modalTitle.textContent = title;
    modalDescription.textContent =
      description || "아직 설명이 입력되지 않았습니다.";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  // 설명 팝업 닫기
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

  // 미니게임 버튼 생성
  SITE_CONFIG.miniGames.slice(0, 6).forEach((name, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "mini-game-button";

    const title = document.createElement("span");
    title.textContent = name || `미니게임 ${index + 1}`;

    const status = document.createElement("small");

    // 첫 번째 게임은 2048로 연결
    if (index === 0) {
      status.textContent = "PLAY NOW";
      button.classList.add("available");
    } else {
      status.textContent = "준비 중";
    }

    button.append(title, status);

    button.addEventListener("click", () => {
      if (index === 0) {
        window.location.href = "games/2048.html";
        return;
      }

      openInfo(
        name || `미니게임 ${index + 1}`,
        "이 미니게임은 아직 준비 중입니다."
      );
    });

    miniGameGrid.appendChild(button);
  });

  // 팝업 닫기 버튼
  byId("modalClose").addEventListener("click", closeInfo);

  // 팝업 바깥을 누르면 닫기
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeInfo();
    }
  });

  // ESC 키로 팝업 닫기
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal.classList.contains("is-open")
    ) {
      closeInfo();
    }
  });

})();
