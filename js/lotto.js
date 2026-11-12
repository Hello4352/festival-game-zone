
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

  // 오디오 변수
  let audioContext = null;
  let drumBuffer = null;
  let drumSources = [];
  let drumGain = null;
  let drumTimer = null;
  let drumPlaying = false;

  // 공 회전 변수
  let ballIntervals = [];

  const LOTTO_CONFIG = {
    countdownSeconds: 3,
    spinInterval: 110,
    revealInterval: 2800,
    lastNumberPause: 2800,
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

      // 첫 번째 소리
      if (drumSources.length === 0) {
        gain.gain.setValueAtTime(1, start);
      } else {
        // 다음 소리를 미리 시작
        gain.gain.setValueAtTime(0, start);

        gain.gain.linearRampToValueAtTime(
          1,
          start + overlap
        );

        // 이전 소리와 자연스럽게 연결
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

      // 다음 소리 예약
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

  // =====================================
  // 공 초기화
  // =====================================

  function resetBalls() {
    stopAllBallSpinning();

    balls.forEach((ball) => {
      ball.textContent = "?";

      ball.classList.remove(
        "revealed",
        "last",
        "spinning"
      );
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

      // 모든 공이 각각 랜덤 숫자로 계속 변경
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

    // 마지막 공이 아니면 일반 공개 시간
    if (isLast) {
      await wait(LOTTO_CONFIG.lastNumberPause);
    } else {
      await wait(LOTTO_CONFIG.revealInterval);
    }

    // 해당 공만 회전 정지
    stopBallSpinning(index);

    // 당첨 번호 표시
    ball.textContent = number;
    ball.classList.add("revealed");

    // 마지막 공 처리
    if (isLast) {
      ball.classList.add("last");

      // 드럼롤 정지
      stopDrumRoll();

      // 쾅 소리
      playBoom();
    }

    await wait(LOTTO_CONFIG.afterRevealDelay);
  }

  // =====================================
  // 최종 결과 표시
  // =====================================

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
      // 오디오 미리 준비
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

      // 6개 공 모두 동시에 회전 시작
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

      // 결과 표시
      showResult(numbers);

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
