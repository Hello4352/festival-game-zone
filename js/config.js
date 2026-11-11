/*
  이 파일에서 메인 화면의 제목, 설명, 상품 안내, 미니게임 이름을 수정하세요.
  설명은 큰따옴표 안에 작성하고, 줄바꿈은 \n 으로 입력하면 됩니다.
*/

const SITE_CONFIG = {
  siteTitle: "게임 부스",
  siteSubtitle: "원하는 게임을 선택해 도전해 보세요!",
  siteFooter: "ENJOY THE FESTIVAL",

  // 게임 설명 버튼 4개: title과 description을 원하는 내용으로 바꾸세요.
  descriptionCards: [
    {
      title: "게임 설명 1",
      description: "첫 번째 게임의 설명을 여기에 입력하세요."
    },
    {
      title: "게임 설명 2",
      description: "두 번째 게임의 설명을 여기에 입력하세요."
    },
    {
      title: "게임 설명 3",
      description: "세 번째 게임의 설명을 여기에 입력하세요."
    },
    {
      title: "게임 설명 4",
      description: "네 번째 게임의 설명을 여기에 입력하세요."
    }
  ],

  // 상품 안내 버튼을 눌렀을 때 나오는 내용입니다.
  productInfo: {
    buttonTitle: "상품 안내",
    description: "상품의 종류와 수령 방법을 여기에 입력하세요."
  },

  // 미니게임 이름만 먼저 정해둘 수 있습니다. 실제 게임 기능은 아직 연결하지 않았습니다.
  miniGames: [
    "미니게임 1",
    "미니게임 2",
    "미니게임 3",
    "미니게임 4"
  ]
};

/* 로또 화면의 표시 문구와 시간 설정 */
const LOTTO_CONFIG = {
  eyebrow: "THE GRAND FINALE",
  title: "THE FINAL DRAW",
  subtitle: "축제의 마지막 순간, 행운의 주인공이 탄생한다.",
  footer: "ONE LAST CHANCE · ONE LUCKY WINNER",
  startText: "운명의 추첨을 시작한다",
  drawingText: "운명의 번호가 공개됩니다...",
  lastNumberText: "마지막 번호... 운명의 순간!",
  finishText: "오늘의 행운의 번호가 탄생했습니다!",
  countdownSeconds: 3,
  revealInterval: 2800,
  lastNumberPause: 2800
};
