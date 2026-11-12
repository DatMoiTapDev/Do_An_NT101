// Điều phối chọn thuật toán, gọi API Python, hiển thị đáp án và tự động phát hoạt ảnh.

window.NT101 = window.NT101 || {};

(() => {
  const state = {
    algo: 'playfair',
    opMode: 'encrypt',
    symAlgo: 'aes',
    steps: [],
    currentStep: -1,
    isPlaying: false,
    timer: null,
    speedMs: 1450,
    lastResult: '',
    rsaSampleIdx: 0
  };

  function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    document.getElementById('theme-toggle').textContent = isLight ? 'Giao diện Sáng' : 'Giao diện Tối';
  }

  function setRuntimeBadge(label, colorVar) {
    document.getElementById('runtime-label').textContent = label;
    document.getElementById('runtime-dot').style.backgroundColor = colorVar;
  }

  function switchStageVisibility() {
    document.getElementById('stage-playfair').classList.toggle('hidden', state.algo !== 'playfair');
    document.getElementById('stage-rsa').classList.toggle('hidden', state.algo !== 'rsa');
    document.getElementById('stage-des').classList.toggle('hidden', !(state.algo === 'symmetric' && state.symAlgo === 'des'));
    document.getElementById('stage-aes').classList.toggle('hidden', !(state.algo === 'symmetric' && state.symAlgo === 'aes'));
  }

  function initIdleDiagram() {
    if (state.algo === 'playfair') window.NT101.PlayfairAnim.initIdle();
    else if (state.algo === 'rsa') window.NT101.RsaAnim.initIdle();
    else if (state.symAlgo === 'des') window.NT101.SymmetricAnim.initDesIdle();
    else window.NT101.SymmetricAnim.initAesIdle();
  }

  function selectAlgorithm(algo) {
    stopAnimation();
    state.algo = algo;
    state.steps = [];
    state.currentStep = -1;
    state.lastResult = '';

    ['playfair', 'rsa', 'symmetric'].forEach(key => {
      document.getElementById(`btn-algo-${key}`).classList.toggle('active', key === algo);
    });

    document.getElementById('form-playfair').classList.toggle('hidden', algo !== 'playfair');
    document.getElementById('form-rsa').classList.toggle('hidden', algo !== 'rsa');
    document.getElementById('form-symmetric').classList.toggle('hidden', algo !== 'symmetric');

    switchStageVisibility();
    hideError();
    document.getElementById('result-output').textContent = 'Nhấn nút "Chạy thuật toán" để xem đáp án.';
    document.getElementById('result-card').classList.remove('lit');
    document.getElementById('result-meta').classList.add('hidden');
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('step-counter').textContent = 'Tự động phát ngay khi chạy thuật toán';
    document.getElementById('step-title').textContent = 'Sẵn sàng mô phỏng';
    document.getElementById('step-desc').textContent = 'Nhấn "Chạy thuật toán" để xem lưu đồ tính toán chi tiết và kết quả phát sáng qua từng bước.';
    document.getElementById('step-badge').textContent = 'IDLE';

    initIdleDiagram();
    updateControlsUI();
  }

  function setOperationMode(mode) {
    state.opMode = mode;
    document.getElementById('mode-encrypt').classList.toggle('active', mode === 'encrypt');
    document.getElementById('mode-decrypt').classList.toggle('active', mode === 'decrypt');
  }

  function setSymmetricAlgo(type) {
    state.symAlgo = type;
    document.getElementById('sym-type-des').classList.toggle('active', type === 'des');
    document.getElementById('sym-type-aes').classList.toggle('active', type === 'aes');

    const keyLabel = document.getElementById('sym-key-label');
    const keyInput = document.getElementById('sym-key');
    const ivInput = document.getElementById('sym-iv');

    if (type === 'des') {
      keyLabel.textContent = 'Khoá bí mật DES 64-bit';
      if (keyInput.value === 'NT101-SECRET-KEY') keyInput.value = 'NT101DES';
      if (ivInput.value === '1234567890ABCDEF') ivInput.value = '12345678';
    } else {
      keyLabel.textContent = 'Khoá bí mật AES 128-bit';
      if (keyInput.value === 'NT101DES') keyInput.value = 'NT101-SECRET-KEY';
      if (ivInput.value === '12345678') ivInput.value = '1234567890ABCDEF';
    }
    switchStageVisibility();
    initIdleDiagram();
  }

  function toggleIvField() {
    const mode = document.getElementById('sym-mode').value;
    document.getElementById('sym-iv-wrap').classList.toggle('hidden', mode === 'ECB');
  }

  function randomizeRsaPrimes() {
    const samples = window.NT101.MockData.rsaSamplePrimes;
    state.rsaSampleIdx = (state.rsaSampleIdx + 1) % samples.length;
    const [p, q, e] = samples[state.rsaSampleIdx];
    document.getElementById('rsa-p').value = p;
    document.getElementById('rsa-q').value = q;
    document.getElementById('rsa-e').value = e;
  }

  function showError(msg) {
    const box = document.getElementById('error-box');
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  function hideError() {
    document.getElementById('error-box').classList.add('hidden');
  }

  function copyResult() {
    if (!state.lastResult) return;
    navigator.clipboard?.writeText(state.lastResult);
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'Đã chép';
    setTimeout(() => { btn.textContent = 'Sao chép'; }, 1200);
  }

  function swapResultToInput() {
    if (!state.lastResult) return;
    if (state.algo === 'playfair') document.getElementById('pf-text').value = state.lastResult;
    else if (state.algo === 'rsa') document.getElementById('rsa-text').value = state.lastResult;
    else document.getElementById('sym-text').value = state.lastResult;
    setOperationMode(state.opMode === 'encrypt' ? 'decrypt' : 'encrypt');
    runAlgorithm();
  }

  function collectPayload() {
    if (state.algo === 'playfair') {
      return {
        algorithm: 'playfair',
        mode: state.opMode,
        payload: {
          key: document.getElementById('pf-key').value,
          text: document.getElementById('pf-text').value
        }
      };
    }
    if (state.algo === 'rsa') {
      return {
        algorithm: 'rsa',
        mode: state.opMode,
        payload: {
          p: document.getElementById('rsa-p').value,
          q: document.getElementById('rsa-q').value,
          e: document.getElementById('rsa-e').value,
          text: document.getElementById('rsa-text').value
        }
      };
    }
    return {
      algorithm: state.symAlgo,
      mode: state.opMode,
      payload: {
        cipher_mode: document.getElementById('sym-mode').value,
        key: document.getElementById('sym-key').value,
        iv: document.getElementById('sym-iv').value,
        text: document.getElementById('sym-text').value
      }
    };
  }

  async function executeViaBackendOrLocal(req) {
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        });
        const data = await res.json();
        if (res.ok && data.status === 'ok') {
          setRuntimeBadge('Python Backend', 'var(--success)');
          const meta = Object.entries(data.metadata || {}).map(([label, value]) => ({ label, value: String(value) }));
          return { result: data.result, meta, steps: data.steps || [] };
        }
        if (data.status === 'error') {
          throw new Error(data.message || 'Lỗi từ thuật toán Python.');
        }
      } catch (err) {
        if (err && err.name !== 'TypeError' && !String(err.message).includes('fetch')) {
          throw err;
        }
      }
    }

    setRuntimeBadge('Mô phỏng cục bộ', 'var(--primary)');
    if (req.algorithm === 'playfair') return window.NT101.PlayfairAnim.executeLocal(req.mode, req.payload);
    if (req.algorithm === 'rsa') return window.NT101.RsaAnim.executeLocal(req.mode, req.payload);
    return window.NT101.SymmetricAnim.executeLocal(req.algorithm, req.mode, req.payload);
  }

  async function runAlgorithm() {
    hideError();
    stopAnimation();
    switchStageVisibility();
    initIdleDiagram();
    document.getElementById('result-card').classList.remove('lit');

    try {
      const req = collectPayload();
      const output = await executeViaBackendOrLocal(req);

      state.lastResult = output.result;
      state.steps = output.steps || [];
      state.currentStep = 0;

      document.getElementById('result-output').textContent = output.result;
      renderMetaCards(output.meta || []);

      if (state.steps.length > 0) {
        renderCurrentStep();
        startAutoPlay();
      } else {
        document.getElementById('result-card').classList.add('lit');
      }
    } catch (err) {
      showError(err.message || 'Dữ liệu đầu vào không hợp lệ.');
    }
  }

  function renderMetaCards(items) {
    const container = document.getElementById('result-meta');
    if (!items.length) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    container.innerHTML = items.map(item => `
      <div class="meta-item">
        <div class="meta-label">${item.label}</div>
        <div class="mono meta-val">${item.value}</div>
      </div>
    `).join('');
  }

  function startAutoPlay() {
    if (!state.steps.length) return;
    state.isPlaying = true;
    updateControlsUI();
    clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (state.currentStep < state.steps.length - 1) {
        state.currentStep++;
        renderCurrentStep();
      } else {
        stopAnimation();
      }
    }, state.speedMs);
  }

  function stopAnimation() {
    state.isPlaying = false;
    clearInterval(state.timer);
    state.timer = null;
    updateControlsUI();
  }

  function togglePlay() {
    if (!state.steps.length) return;
    if (state.isPlaying) {
      stopAnimation();
    } else {
      if (state.currentStep >= state.steps.length - 1) {
        state.currentStep = 0;
        renderCurrentStep();
      }
      startAutoPlay();
    }
  }

  function prevStep() {
    if (!state.steps.length) return;
    stopAnimation();
    if (state.currentStep > 0) {
      state.currentStep--;
      renderCurrentStep();
    }
  }

  function nextStep() {
    if (!state.steps.length) return;
    stopAnimation();
    if (state.currentStep < state.steps.length - 1) {
      state.currentStep++;
      renderCurrentStep();
    }
  }

  function replayAnimation() {
    if (!state.steps.length) return;
    stopAnimation();
    state.currentStep = 0;
    renderCurrentStep();
    startAutoPlay();
  }

  function changeSpeed() {
    state.speedMs = Number(document.getElementById('ctrl-speed').value);
    if (state.isPlaying) startAutoPlay();
  }

  function updateControlsUI() {
    const hasSteps = state.steps.length > 0;
    document.getElementById('ctrl-prev').disabled = !hasSteps || state.currentStep <= 0;
    document.getElementById('ctrl-next').disabled = !hasSteps || state.currentStep >= state.steps.length - 1;
    document.getElementById('ctrl-play').disabled = !hasSteps;
    document.getElementById('ctrl-replay').disabled = !hasSteps;
    document.getElementById('ctrl-play').textContent = state.isPlaying ? 'Pause' : 'Play';
  }

  function renderCurrentStep() {
    const step = state.steps[state.currentStep];
    if (!step) return;
    const total = state.steps.length;
    const isLast = state.currentStep === total - 1;

    document.getElementById('progress-bar').style.width = `${Math.round(((state.currentStep + 1) / total) * 100)}%`;
    document.getElementById('step-counter').textContent = `Bước ${state.currentStep + 1} / ${total}`;
    document.getElementById('step-title').textContent = step.title || '';
    document.getElementById('step-desc').textContent = step.description || '';
    document.getElementById('step-badge').textContent = step.badge || `STEP ${state.currentStep + 1}`;

    document.getElementById('result-card').classList.toggle('lit', isLast);

    if (state.algo === 'playfair') window.NT101.PlayfairAnim.renderStep(step);
    else if (state.algo === 'rsa') window.NT101.RsaAnim.renderStep(step);
    else if (state.symAlgo === 'des') window.NT101.SymmetricAnim.renderDesStep(step);
    else window.NT101.SymmetricAnim.renderAesStep(step);

    updateControlsUI();
  }

  Object.assign(window.NT101, {
    toggleTheme,
    selectAlgorithm,
    setOperationMode,
    setSymmetricAlgo,
    toggleIvField,
    randomizeRsaPrimes,
    copyResult,
    swapResultToInput,
    runAlgorithm,
    togglePlay,
    prevStep,
    nextStep,
    replayAnimation,
    changeSpeed
  });

  document.addEventListener('DOMContentLoaded', () => {
    setOperationMode('encrypt');
    setSymmetricAlgo('aes');
    selectAlgorithm('playfair');
  });
})();
