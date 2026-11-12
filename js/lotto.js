
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
  let drumAudio = null;
  let audioContext = null;

  const LOTTO_CONFIG = {
    countdownSeconds: 3,
    spinInterval: 110,
    revealInterval: 2800,
    lastNumberPause: 2800,
    afterRevealDelay: 350,
    minNumber: 1,
    maxNumber: 45
  };

  // 화면 기본 문구
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

  // 드럼롤 오디오 준비
  function prepareAudio() {
    if (!drumAudio) {
      drumAudio = new Audio("sounds/drum-roll.mp3");
      drumAudio.loop = true;
      drumAudio.volume = 1;
      drumAudio.preload = "auto";
    }

    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }
  }

  // 드럼롤 시작
  function playDrumRoll() {
    if (!drumAudio) return;

    drumAudio.currentTime = 0;
    drumAudio.volume = 1;

    drumAudio.play().catch((error) => {
      console.warn("드럼롤 재생 실패:", error);
    });
  }

  // 드럼롤 정지
  function stopDrumRoll() {
    if (!drumAudio) return;

    drumAudio.pause();
    drumAudio.currentTime = 0;
  }

  // 마지막 공에서 재생할 강한 쾅 소리
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

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.75
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.8);

    // 충격음에 노이즈 추가
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

  // 대기 함수
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 랜덤 번호 생성
  function generateNumbers() {
    const numbers = [];

    while (numbers.length < balls.length) {
      const number =
        Math.floor(
          Math.random() *
          (LOTTO_CONFIG.maxNumber - LOTTO_CONFIG.minNumber + 1)
        ) + LOTTO_CONFIG.minNumber;

      if (!numbers.includes(number)) {
        numbers.push(number);
      }
    }

    return numbers.sort((a, b) => a - b);
  }

  // 공 초기화
  function resetBalls() {
    balls.forEach((ball) => {
      ball.textContent = "?";
      ball.classList.remove("revealed", "last", "spinning");
    });

    if (resultSummary) {
      resultSummary.style.display = "none";
    }

    if (summaryBalls) {
      summaryBalls.innerHTML = "";
    }

    if ($("fireworks")) {
      $("fireworks").classList.remove("active");
    }
  }

  // 카운트다운
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

  // 공 회전 애니메이션
  function startSpinning(ball) {
    ball.classList.add("spinning");

    const interval = setInterval(() => {
      ball.textContent =
        Math.floor(Math.random() * 45) + 1;
    }, LOTTO_CONFIG.spinInterval);

    return interval;
  }

  // 공 번호 공개
  async function revealBall(ball, number, isLast) {
    const interval = startSpinning(ball);

    if (isLast) {
      await wait(LOTTO_CONFIG.lastNumberPause);
    } else {
      await wait(LOTTO_CONFIG.revealInterval);
    }

    clearInterval(interval);

    ball.classList.remove("spinning");
    ball.textContent = number;
    ball.classList.add("revealed");

    if (isLast) {
      ball.classList.add("last");

      // 마지막 공에서 드럼롤 정지 후 쾅!
      stopDrumRoll();
      playBoom();
    }

    await wait(LOTTO_CONFIG.afterRevealDelay);
  }

  // 최종 결과 표시
  function showResult(numbers) {
    if (resultSummary) {
      resultSummary.style.display = "block";
    }

    if (summaryBalls) {
      summaryBalls.innerHTML = "";

      numbers.forEach((number) => {
        const span = document.createElement("span");

        span.className = "summary-number";
        span.textContent = number;

        summaryBalls.appendChild(span);
      });
    }

    if (statusText) {
      statusText.textContent = "추첨 완료!";
    }

    if ($("fireworks")) {
      $("fireworks").classList.add("active");
    }
  }

  // 추첨 시작
  async function startDrawing() {
    if (isDrawing) return;

    isDrawing = true;
    startButton.disabled = true;

    prepareAudio();

    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    }

    stopDrumRoll();
    resetBalls();

    if (statusText) {
      statusText.textContent = "추첨 준비 중...";
    }

    // 3, 2, 1 카운트다운 (무음)
    await countdown();

    if (statusText) {
      statusText.textContent = "행운의 번호 추첨 중...";
    }

    // 카운트다운이 끝난 직후 드럼롤 시작
    playDrumRoll();

    const numbers = generateNumbers();

    // 번호 순서대로 공 공개
    for (let i = 0; i < balls.length; i++) {
      const isLast = i === balls.length - 1;

      await revealBall(
        balls[i],
        numbers[i],
        isLast
      );
    }

    showResult(numbers);

    isDrawing = false;
    startButton.disabled = false;
  }

  // 버튼 연결
  startButton.addEventListener("click", startDrawing);

})();
