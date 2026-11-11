
(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  const modal = byId("infoModal");
  const modalTitle = byId("modalTitle");
  const modalDescription = byId("modalDescription");
  const descriptionGrid = byId("descriptionGrid");
  const miniGameGrid = byId("miniGameGrid");

  // 메인 화면 설정
  byId("siteTitle").textContent = SITE_CONFIG.siteTitle;
  byId("siteSubtitle").textContent = SITE_CONFIG.siteSubtitle;
  byId("siteFooter").textContent = SITE_CONFIG.siteFooter;

  // 게임별 페이지 연결
  const gameLinks = [
    "games/2048.html",
    "games/brick-breaker.html",
    "games/reaction.html",
    "games/omok.html",
    "games/Snake.html",
    "games/coming-soon.html?game=Neon%20Shooter",
    "games/coming-soon.html?game=Chess%20AI",
    "games/coming-soon.html?game=테트리스"
  ];

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

  // 미니게임 버튼 8개 생성
  SITE_CONFIG.miniGames.slice(0, 8).forEach((name, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-game-button";

    const title = document.createElement("span");
    title.textContent = name || `미니게임 ${index + 1}`;

    const status = document.createElement("small");

    // 현재 실제 게임이 만들어진 항목
    const isAvailable = index < 2;

    status.textContent = isAvailable
      ? "PLAY NOW"
      : "준비 중";

    if (isAvailable) {
      button.classList.add("available");
    }

    button.append(title, status);

    button.addEventListener("click", () => {
      window.location.href = gameLinks[index];
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
