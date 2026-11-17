
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const balls = Array.from(document.querySelectorAll(".ball"));
  const startButton = $("startButton");
  const statusText = $("status");
  const countdownText = $("countdown");

  const fireworksCanvas = $("fireworks");
  const fireworksCtx = fireworksCanvas
    ? fireworksCanvas.getContext("2d")
    : null;

  let isDrawing = false;

  // 오디오 변수
  let audioContext = null;
  let drumBuffer = null;
  let drumSources = [];
  let drumGain = null;
  let drumTimer = null;
  let drumPlaying = false;

  // 공 회전 변수
  let ballIntervals = [];

  // 폭죽 변수
  let fireworksParticles = [];
  let fireworksAnimation = null;
  let fireworksTimers = [];
  let fireworksRunning = false;
  let fireworksEndTimer = null;

  const LOTTO_CONFIG = {
    countdownSeconds: 3,
    spinInterval: 110,
    revealInterval: 2000,
    lastNumberPause: 3000,
    afterRevealDelay: 350,
    minNumber: 1,
    maxNumber: 45,
    audioOverlap: 0.1
  };

  // =====================================
  // 기본 문구
  // =====================================

  if ($("lottoEyebrow")) {
    $("lottoEyebrow").textContent = "LOTTO DRAW";
  }

  if ($("lottoTitle")) {
    $("lottoTitle").textContent = "LOTTO";
  }

  if ($("lottoSubtitle")) {
    $("lottoSubtitle").textContent = "행운의 번호를 추첨합니다.";
  }

  if ($("lottoFooter")) {
    $("lottoFooter").textContent = "GOOD LUCK!";
  }

  // =====================================
  // 오디오 준비
  // =====================================

  async function prepareAudio() {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("이 브라우저는 오디오를 지원하지 않습니다.");
      }

      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (!drumBuffer) {
      const response = await fetch("sounds/drum-roll.mp3");

      if (!response.ok) {
        throw new Error("드럼롤 MP3 파일을 불러오지 못했습니다.");
      }

      const arrayBuffer = await response.arrayBuffer();

      drumBuffer =
        await audioContext.decodeAudioData(arrayBuffer);
    }
  }

  // =====================================
  // 드럼롤 재생
  // =====================================

  function playDrumRoll() {
    stopDrumRoll();

    if (!drumBuffer || !audioContext) return;

    drumPlaying = true;

    const duration = drumBuffer.duration;
    const overlap = LOTTO_CONFIG.audioOverlap;

    drumGain = audioContext.createGain();
    drumGain.gain.value = 1;
    drumGain.connect(audioContext.destination);

    let nextStartTime = audioContext.currentTime + 0.05;

    function scheduleDrum() {
      if (!drumPlaying || !drumGain) return;

      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();

      source.buffer = drumBuffer;
      source.connect(gain);
      gain.connect(drumGain);

      const start = nextStartTime;
      const end = start + duration;

      if (drumSources.length === 0) {
        gain.gain.setValueAtTime(1, start);
      } else {
        gain.gain.setValueAtTime(0, start);

        gain.gain.linearRampToValueAtTime(
          1,
          start + overlap
        );

        const previous =
          drumSources[drumSources.length - 1];

        previous.gain.gain.cancelScheduledValues(start);

        previous.gain.gain.setValueAtTime(1, start);

        previous.gain.gain.linearRampToValueAtTime(
          0,
          start + overlap
        );
      }

      source.start(start);

      drumSources.push({
        source,
        gain
      });

      nextStartTime = end - overlap;

      const delay = Math.max(
        0,
        (nextStartTime - audioContext.currentTime - 0.2) * 1000
      );

      drumTimer = setTimeout(scheduleDrum, delay);
    }

    scheduleDrum();
  }

  // =====================================
  // 드럼롤 정지
  // =====================================

  function stopDrumRoll() {
    drumPlaying = false;

    if (drumTimer) {
      clearTimeout(drumTimer);
      drumTimer = null;
    }

    if (drumGain && audioContext) {
      const now = audioContext.currentTime;

      drumGain.gain.cancelScheduledValues(now);

      drumGain.gain.setTargetAtTime(
        0,
        now,
        0.015
      );
    }

    drumSources.forEach(({ source }) => {
      try {
        source.stop(audioContext.currentTime + 0.05);
      } catch (error) {}
    });

    drumSources = [];
    drumGain = null;
  }

  // =====================================
  // 마지막 공 쾅 효과음
  // =====================================

  function playBoom() {
    if (!audioContext) return;

    const ctx = audioContext;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // 저음 충격음
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(100, now);

    oscillator.frequency.exponentialRampToValueAtTime(
      25,
      now + 0.65
    );

    gain.gain.setValueAtTime(1, now);

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.75
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.8);

    // 충격 노이즈
    const bufferSize = ctx.sampleRate * 0.45;

    const buffer = ctx.createBuffer(
      1,
      bufferSize,
      ctx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    noise.buffer = buffer;

    filter.type = "lowpass";
    filter.frequency.value = 180;

    noiseGain.gain.setValueAtTime(0.7, now);

    noiseGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.4
    );

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.45);
  }

  // =====================================
  // 폭죽 캔버스 크기 설정
  // =====================================

  function resizeFireworksCanvas() {
    if (!fireworksCanvas || !fireworksCtx) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    fireworksCanvas.width = window.innerWidth * ratio;
    fireworksCanvas.height = window.innerHeight * ratio;

    fireworksCtx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );
  }

  window.addEventListener("resize", resizeFireworksCanvas);
  resizeFireworksCanvas();

  // =====================================
  // 폭죽 하나 생성
  // =====================================

  function createFirework(x, y) {
    const colors = [
      "#ffdf70",
      "#ff526b",
      "#52e5ff",
      "#a77bff",
      "#ffffff",
      "#5cff9d",
      "#ff9d42"
    ];

    const color = colors[
      Math.floor(Math.random() * colors.length)
    ];

    const particleCount = 65;

    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount +
        (Math.random() - 0.5) * 0.12;

      const speed = 2 + Math.random() * 5;

      fireworksParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.008 + Math.random() * 0.012,
        radius: 1.5 + Math.random() * 2.5,
        color
      });
    }
  }

  // =====================================
  // 폭죽 애니메이션
  // =====================================

  function animateFireworks() {
    if (!fireworksCtx || !fireworksCanvas) return;

    const ctx = fireworksCtx;
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    for (let i = fireworksParticles.length - 1; i >= 0; i--) {
      const p = fireworksParticles[i];

      p.x += p.vx;
      p.y += p.vy;

      p.vy += 0.045;
      p.vx *= 0.99;
      p.vy *= 0.99;

      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        fireworksParticles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        p.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (fireworksRunning || fireworksParticles.length > 0) {
      fireworksAnimation =
        requestAnimationFrame(animateFireworks);
    } else {
      ctx.clearRect(0, 0, width, height);
      fireworksAnimation = null;
    }
  }

  // =====================================
  // 폭죽 시작
  // =====================================

  function launchFireworks() {
    if (!fireworksCanvas || !fireworksCtx) return;

    stopFireworks();

    fireworksRunning = true;
    fireworksCanvas.classList.add("active");

    // 폭죽 4회 발사
    const launchTimes = [0, 450, 950, 1500];

    launchTimes.forEach((delay) => {
      const timer = setTimeout(() => {
        const x =
          window.innerWidth * (0.15 + Math.random() * 0.7);

        const y =
          window.innerHeight * (0.15 + Math.random() * 0.4);

        createFirework(x, y);

      }, delay);

      fireworksTimers.push(timer);
    });

    if (!fireworksAnimation) {
      animateFireworks();
    }

    // 약 4.5초 후 폭죽 종료
    fireworksEndTimer = setTimeout(() => {
      fireworksRunning = false;

      fireworksCanvas.classList.remove("active");

    }, 4500);
  }

  // =====================================
  // 폭죽 정지 및 초기화
  // =====================================

  function stopFireworks() {
    fireworksTimers.forEach((timer) => {
      clearTimeout(timer);
    });

    fireworksTimers = [];

    if (fireworksEndTimer) {
      clearTimeout(fireworksEndTimer);
      fireworksEndTimer = null;
    }

    fireworksRunning = false;
    fireworksParticles = [];

    if (fireworksAnimation) {
      cancelAnimationFrame(fireworksAnimation);
      fireworksAnimation = null;
    }

    if (fireworksCtx && fireworksCanvas) {
      fireworksCtx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      fireworksCanvas.classList.remove("active");
    }
  }

  // =====================================
  // 대기 함수
  // =====================================

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =====================================
  // 로또 번호 생성
  // =====================================

  function generateNumbers() {
    const numbers = [];

    while (numbers.length < 6) {
      const number = Math.floor(
        Math.random() *
        (LOTTO_CONFIG.maxNumber - LOTTO_CONFIG.minNumber + 1)
      ) + LOTTO_CONFIG.minNumber;

      if (!numbers.includes(number)) {
        numbers.push(number);
      }
    }

    // 오름차순 정렬하지 않고 추첨 순서 유지
    return numbers;
  }

  // =====================================
  // 공 초기화
  // =====================================

  function resetBalls() {
    stopAllBallSpinning();
    stopFireworks();

    balls.forEach((ball) => {
      ball.textContent = "?";

      ball.classList.remove(
        "revealed",
        "last",
        "spinning"
      );
    });
  }

  // =====================================
  // 카운트다운
  // =====================================

  async function countdown() {
    for (
      let i = LOTTO_CONFIG.countdownSeconds;
      i >= 1;
      i--
    ) {
      countdownText.textContent = i;

      await wait(1000);
    }

    countdownText.textContent = "START!";

    await wait(300);

    countdownText.textContent = "";
  }

  // =====================================
  // 모든 공 동시에 회전
  // =====================================

  function startAllBallsSpinning() {
    stopAllBallSpinning();

    balls.forEach((ball, index) => {
      ball.classList.add("spinning");

      const interval = setInterval(() => {
        ball.textContent =
          Math.floor(
            Math.random() * LOTTO_CONFIG.maxNumber
          ) + 1;
      }, LOTTO_CONFIG.spinInterval);

      ballIntervals[index] = interval;
    });
  }

  // =====================================
  // 개별 공 회전 정지
  // =====================================

  function stopBallSpinning(index) {
    if (ballIntervals[index]) {
      clearInterval(ballIntervals[index]);
      ballIntervals[index] = null;
    }

    if (balls[index]) {
      balls[index].classList.remove("spinning");
    }
  }

  // =====================================
  // 전체 공 회전 정지
  // =====================================

  function stopAllBallSpinning() {
    ballIntervals.forEach((interval) => {
      if (interval) {
        clearInterval(interval);
      }
    });

    ballIntervals = [];

    balls.forEach((ball) => {
      ball.classList.remove("spinning");
    });
  }

  // =====================================
  // 공 하나씩 공개
  // =====================================

  async function revealBall(index, number, isLast) {
    const ball = balls[index];

    if (isLast) {
      await wait(LOTTO_CONFIG.lastNumberPause);
    } else {
      await wait(LOTTO_CONFIG.revealInterval);
    }

    stopBallSpinning(index);

    ball.textContent = number;
    ball.classList.add("revealed");

    if (isLast) {
      ball.classList.add("last");

      stopDrumRoll();

      playBoom();
    }

    await wait(LOTTO_CONFIG.afterRevealDelay);
  }

  // =====================================
  // 추첨 시작
  // =====================================

  async function startDrawing() {
    if (isDrawing) return;

    isDrawing = true;
    startButton.disabled = true;

    stopDrumRoll();
    resetBalls();

    try {
      // 오디오 준비
      await prepareAudio();

      if (statusText) {
        statusText.textContent = "추첨 준비 중...";
      }

      // 3, 2, 1 카운트다운
      await countdown();

      if (statusText) {
        statusText.textContent = "행운의 번호 추첨 중...";
      }

      // 드럼롤 시작
      playDrumRoll();

      // 6개 공 모두 동시에 회전
      startAllBallsSpinning();

      // 최종 당첨 번호 생성
      const numbers = generateNumbers();

      // 공을 순서대로 하나씩 공개
      for (let i = 0; i < balls.length; i++) {
        const isLast = i === balls.length - 1;

        await revealBall(
          i,
          numbers[i],
          isLast
        );
      }

      // 남아 있는 회전 정리
      stopAllBallSpinning();

      // 폭죽 실행
      launchFireworks();

      // 최종 결과 화면 없이 추첨 완료
      if (statusText) {
        statusText.textContent = "추첨 완료!";
      }

    } catch (error) {
      console.error("추첨 오류:", error);

      stopDrumRoll();
      stopAllBallSpinning();

      if (statusText) {
        statusText.textContent =
          "추첨 중 오류가 발생했습니다.";
      }

    } finally {
      isDrawing = false;
      startButton.disabled = false;
    }
  }

  // =====================================
  // 버튼 연결
  // =====================================

  startButton.addEventListener("click", startDrawing);

})();
