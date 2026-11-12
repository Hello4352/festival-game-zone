
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const balls = Array.from(document.querySelectorAll(".ball"));
  const startButton = $("startButton");
  const statusText = $("status");
  const countdownText = $("countdown");
  const resultSummary = $("resultSummary");
  const summaryBalls = $("summaryBalls");

  let isDrawing = false;

  // 오디오 설정
  let audioContext = null;
  let drumTimer = null;

  // 설정값 표시
  $("lottoEyebrow").textContent = LOTTO_CONFIG.eyebrow;
  $("lottoTitle").textContent = LOTTO_CONFIG.title;
  $("lottoSubtitle").textContent = LOTTO_CONFIG.subtitle;
  $("lottoFooter").textContent = LOTTO_CONFIG.footer;
  startButton.textContent = LOTTO_CONFIG.startText;

  // 드럼 소리 한 번 재생
  function playDrumHit() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      130,
      audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      55,
      audioContext.currentTime + 0.16
    );

    gain.gain.setValueAtTime(
      0.001,
      audioContext.currentTime
    );

    gain.gain.linearRampToValueAtTime(
      0.18,
      audioContext.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.2
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.21);
  }

  // 두구두구 반복 재생
  async function startDrumRoll() {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    try {
      await audioContext.resume();
    } catch (error) {
      console.warn("오디오 재생을 시작하지 못했습니다.", error);
      return;
    }

    if (drumTimer) clearInterval(drumTimer);

    playDrumHit();

    drumTimer = window.setInterval(() => {
      playDrumHit();
    }, 110);
  }

  // 드럼 소리 정지
  function stopDrumRoll() {
    if (drumTimer) {
      clearInterval(drumTimer);
      drumTimer = null;
    }
  }

  // 안전한 난수 생성
  function secureRandomInt(max) {
    const range = 0x100000000;
    const limit = Math.floor(range / max) * max;
    const values = new Uint32Array(1);

    let value;

    do {
      crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);

    return value % max;
  }

  // 번호 6개 추첨
  function drawSixNumbers() {
    const numbers = Array.from(
      { length: 45 },
      (_, index) => index + 1
    );

    for (let i = numbers.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);

      [numbers[i], numbers[j]] = [
        numbers[j],
        numbers[i]
      ];
    }

    return numbers.slice(0, 6);
  }

  const wait = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // 화면 초기화
  function resetScreen() {
    balls.forEach((ball) => {
      ball.textContent = "?";
      ball.className = "ball";
    });

    resultSummary.hidden = true;
    summaryBalls.replaceChildren();
    countdownText.textContent = "";
    statusText.textContent = LOTTO_CONFIG.drawingText;
  }

  // 번호 공개
  function revealNumber(ball, number, isLast) {
    ball.textContent = String(number).padStart(2, "0");

    ball.className = isLast
      ? "ball revealed last"
      : "ball revealed";
  }

  // 최종 결과 표시
  function showSummary(numbers) {
    summaryBalls.replaceChildren();

    numbers.forEach((number) => {
      const chip = document.createElement("span");

      chip.className = "summary-number";
      chip.textContent = String(number).padStart(2, "0");

      summaryBalls.appendChild(chip);
    });

    resultSummary.hidden = false;
  }

  // 추첨 시작
  async function startDraw() {
    if (isDrawing) return;

    if (
      !window.crypto ||
      typeof crypto.getRandomValues !== "function"
    ) {
      statusText.textContent =
        "안전한 추첨을 위해 HTTPS 환경에서 열어주세요.";
      return;
    }

    isDrawing = true;

    startButton.disabled = true;
    startButton.textContent = "추첨 진행 중...";

    resetScreen();

    const selectedNumbers = drawSixNumbers();

    // 드럼 소리 시작
    startDrumRoll();

    // 추첨 중 공 회전 효과
    const spinTimer = window.setInterval(() => {
      balls.forEach((ball) => {
        if (!ball.classList.contains("revealed")) {
          ball.textContent = String(
            secureRandomInt(45) + 1
          ).padStart(2, "0");

          ball.classList.add("spinning");
        }
      });
    }, 110);

    try {
      // 카운트다운
      for (
        let seconds = LOTTO_CONFIG.countdownSeconds;
        seconds > 0;
        seconds--
      ) {
        countdownText.textContent = String(seconds);

        statusText.textContent =
          "운명의 순간이 다가옵니다...";

        await wait(1000);
      }

      countdownText.textContent = "START!";

      statusText.textContent =
        LOTTO_CONFIG.drawingText;

      // 번호 하나씩 공개
      for (let i = 0; i < selectedNumbers.length; i++) {

        if (i === selectedNumbers.length - 1) {
          statusText.textContent =
            LOTTO_CONFIG.lastNumberText;

          await wait(LOTTO_CONFIG.lastNumberPause);
        } else {
          statusText.textContent =
            `${i + 1}번째 행운의 번호 공개`;
        }

        // 드럼 소리 정지
        stopDrumRoll();

        await wait(LOTTO_CONFIG.revealInterval);

        // 공 공개 순간 효과음
        playDrumHit();

        revealNumber(
          balls[i],
          selectedNumbers[i],
          i === selectedNumbers.length - 1
        );

        await wait(350);

        // 다음 번호를 기다리는 동안 드럼 소리 재시작
        if (i < selectedNumbers.length - 1) {
          startDrumRoll();
        }
      }

      countdownText.textContent = "";

      statusText.textContent =
        LOTTO_CONFIG.finishText;

      startButton.textContent = "다시 추첨하기";

      showSummary(selectedNumbers);

      launchFireworks();

    } catch (error) {
      console.error("추첨 중 오류:", error);

      statusText.textContent =
        "추첨 중 오류가 발생했습니다. 다시 시도해 주세요.";

      startButton.textContent =
        LOTTO_CONFIG.startText;

    } finally {
      stopDrumRoll();

      window.clearInterval(spinTimer);

      startButton.disabled = false;
      isDrawing = false;
    }
  }

  // 버튼 이벤트
  startButton.addEventListener("click", startDraw);

  // 폭죽 효과
  function launchFireworks() {
    const canvas = $("fireworks");
    const context = canvas.getContext("2d");

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = Math.floor(
      window.innerWidth * dpr
    );

    canvas.height = Math.floor(
      window.innerHeight * dpr
    );

    context.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    const colors = [
      "#ffd76d",
      "#fff2bb",
      "#ff9e35",
      "#ffffff",
      "#f3c454"
    ];

    let particles = [];

    const startTime = performance.now();

    function createBurst() {
      const x =
        window.innerWidth * (0.2 + Math.random() * 0.6);

      const y =
        window.innerHeight * (0.12 + Math.random() * 0.42);

      const color =
        colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < 65; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 2 + Math.random() * 3,
          color
        });
      }
    }

    createBurst();

    window.setTimeout(createBurst, 450);
    window.setTimeout(createBurst, 950);
    window.setTimeout(createBurst, 1500);

    function animate() {
      const elapsed =
        performance.now() - startTime;

      context.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      particles = particles.filter(
        (particle) => particle.life > 0
      );

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.045;
        particle.vx *= 0.99;
        particle.life -= 0.009;

        context.globalAlpha =
          Math.max(0, particle.life);

        context.fillStyle = particle.color;

        context.beginPath();

        context.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        );

        context.fill();
      });

      context.globalAlpha = 1;

      if (elapsed < 4500 || particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        context.clearRect(
          0,
          0,
          window.innerWidth,
          window.innerHeight
        );
      }
    }

    requestAnimationFrame(animate);
  }

})();
