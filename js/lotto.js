
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
  let audioContext = null;

  // 두구두구 효과음
  const drumRoll = new Audio("sounds/drum-roll.mp3");
  drumRoll.preload = "auto";
  drumRoll.loop = true;

  // 오디오 실행 환경 준비
  function prepareAudio() {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch((error) => {
        console.warn("오디오 실행 오류:", error);
      });
    }
  }

  // 두구두구 재생
  function playDrumRoll() {
    drumRoll.pause();
    drumRoll.currentTime = 0;

    drumRoll.play().catch((error) => {
      console.warn("두구두구 효과음 재생 오류:", error);
    });
  }

  // 두구두구 정지
  function stopDrumRoll() {
    drumRoll.pause();
    drumRoll.currentTime = 0;
  }

  // 마지막 공이 나올 때 쾅 소리
  function playBoom() {
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    // 저음 충격음
    const oscillator = audioContext.createOscillator();
    const oscillatorGain = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(110, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      38,
      now + 0.45
    );

    oscillatorGain.gain.setValueAtTime(0.001, now);
    oscillatorGain.gain.exponentialRampToValueAtTime(
      0.9,
      now + 0.015
    );
    oscillatorGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.7
    );

    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.72);

    // 짧은 타격 노이즈
    const bufferSize = Math.floor(
      audioContext.sampleRate * 0.25
    );

    const noiseBuffer = audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate
    );

    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();

    noise.buffer = noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);

    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(
      0.45,
      now + 0.01
    );
    noiseGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.22
    );

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);

    noise.start(now);
    noise.stop(now + 0.25);
  }

  $("lottoEyebrow").textContent = LOTTO_CONFIG.eyebrow;
  $("lottoTitle").textContent = LOTTO_CONFIG.title;
  $("lottoSubtitle").textContent = LOTTO_CONFIG.subtitle;
  $("lottoFooter").textContent = LOTTO_CONFIG.footer;
  startButton.textContent = LOTTO_CONFIG.startText;

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

  function drawSixNumbers() {
    const numbers = Array.from(
      { length: 45 },
      (_, index) => index + 1
    );

    for (let i = numbers.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    return numbers.slice(0, 6);
  }

  const wait = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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

  function revealNumber(ball, number, isLast) {
    ball.textContent = String(number).padStart(2, "0");
    ball.className = isLast
      ? "ball revealed last"
      : "ball revealed";
  }

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

    // 버튼을 누른 순간 오디오 환경 준비
    prepareAudio();
    stopDrumRoll();

    resetScreen();

    const selectedNumbers = drawSixNumbers();

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
      // 3, 2, 1 카운트다운: 소리 없음
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

      // 카운트다운이 끝난 직후 두구두구 시작
      countdownText.textContent = "START!";
      statusText.textContent = LOTTO_CONFIG.drawingText;

      playDrumRoll();

      // 번호 순차 공개
      for (let i = 0; i < selectedNumbers.length; i++) {
        if (i === selectedNumbers.length - 1) {
          statusText.textContent =
            LOTTO_CONFIG.lastNumberText;

          await wait(LOTTO_CONFIG.lastNumberPause);
        } else {
          statusText.textContent =
            `${i + 1}번째 행운의 번호 공개`;
        }

        await wait(LOTTO_CONFIG.revealInterval);

        // 공이 공개되는 순간
        revealNumber(
          balls[i],
          selectedNumbers[i],
          i === selectedNumbers.length - 1
        );

        // 마지막 공이 공개되면 두구두구 정지 후 쾅!
        if (i === selectedNumbers.length - 1) {
          stopDrumRoll();
          playBoom();
        }

        await wait(350);
      }

      countdownText.textContent = "";
      statusText.textContent = LOTTO_CONFIG.finishText;
      startButton.textContent = "다시 추첨하기";

      showSummary(selectedNumbers);
      launchFireworks();

    } catch (error) {
      console.error("추첨 중 오류:", error);

      statusText.textContent =
        "추첨 중 오류가 발생했습니다. 다시 시도해 주세요.";

      startButton.textContent = LOTTO_CONFIG.startText;

    } finally {
      stopDrumRoll();
      window.clearInterval(spinTimer);
      startButton.disabled = false;
      isDrawing = false;
    }
  }

  startButton.addEventListener("click", startDraw);

  function launchFireworks() {
    const canvas = $("fireworks");
    const context = canvas.getContext("2d");

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

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
      const elapsed = performance.now() - startTime;

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

        context.globalAlpha = Math.max(0, particle.life);
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
