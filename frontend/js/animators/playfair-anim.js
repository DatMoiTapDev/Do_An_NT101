// Kết xuất hoạt ảnh ma trận 5x5 và biến đổi từng cặp ký tự cho thuật toán PlayFair.

window.NT101 = window.NT101 || {};

window.NT101.PlayfairAnim = (() => {
  function initIdle() {
    const grid = document.getElementById('pf-matrix-grid');
    grid.innerHTML = Array(25).fill('').map((_, i) =>
      `<div id="pf-cell-${i}" class="smooth-node pf-cell mono">·</div>`
    ).join('');
    document.getElementById('pf-svg-overlay').innerHTML = '';
    document.getElementById('pf-box-in').textContent = '--';
    document.getElementById('pf-box-rule').textContent = 'Chờ xử lý';
    document.getElementById('pf-box-out').textContent = '--';
    document.getElementById('pf-coord-calc').textContent = 'Đang chờ bắt đầu...';
    document.getElementById('pf-pairs-strip').innerHTML = '';
    document.getElementById('pf-out-strip').innerHTML = '';
  }

  function cellCenter(r, c) {
    return { x: c * 61.6 + 26.8, y: r * 56 + 24 };
  }

  function renderStep(step) {
    const s = step.state ? step.state : step;
    const keySet = new Set(s.keySet || []);
    const in1 = s.r1 >= 0 ? s.r1 * 5 + s.c1 : -1;
    const in2 = s.r2 >= 0 ? s.r2 * 5 + s.c2 : -1;
    const showOut = s.subPhase === 'result';
    const out1 = showOut ? s.nr1 * 5 + s.nc1 : -1;
    const out2 = showOut ? s.nr2 * 5 + s.nc2 : -1;

    (s.cells || []).forEach((ch, idx) => {
      const el = document.getElementById(`pf-cell-${idx}`);
      if (!el) return;
      el.textContent = ch === 'I' ? 'I/J' : ch;
      let cls = 'smooth-node pf-cell mono ';
      if (idx === out1 || idx === out2) cls += 'out-char';
      else if (idx === in1 || idx === in2) cls += 'in-char';
      else if (keySet.has(ch)) cls += 'key-char';
      el.className = cls;
    });

    document.getElementById('pf-box-in').textContent = s.inPair || '--';
    document.getElementById('pf-box-rule').textContent = s.rule || 'Chờ xử lý';
    document.getElementById('pf-box-out').textContent = s.outPair || '--';
    document.getElementById('pf-coord-calc').textContent = s.coordCalc || '';

    document.getElementById('pf-flow-in').className = `smooth-node flow-box ${s.subPhase === 'locate' ? 'active-primary' : ''}`;
    document.getElementById('pf-flow-rule').className = `smooth-node flow-box ${s.subPhase === 'trace' ? 'active-primary' : ''}`;
    document.getElementById('pf-flow-out').className = `smooth-node flow-box ${s.subPhase === 'result' ? 'active-success' : ''}`;

    const svg = document.getElementById('pf-svg-overlay');
    if (s.subPhase !== 'trace' && s.subPhase !== 'result') {
      svg.innerHTML = '';
    } else {
      const p1 = cellCenter(s.r1, s.c1);
      const p2 = cellCenter(s.r2, s.c2);
      const q1 = cellCenter(s.nr1, s.nc1);
      const q2 = cellCenter(s.nr2, s.nc2);
      let shapes = '';
      if (s.ruleType === 'rect') {
        const minX = Math.min(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        shapes += `<rect x="${minX}" y="${minY}" width="${Math.abs(p1.x - p2.x)}" height="${Math.abs(p1.y - p2.y)}" rx="6" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="5 4" opacity="0.85" />`;
      }
      shapes += `<line x1="${p1.x}" y1="${p1.y}" x2="${q1.x}" y2="${q1.y}" stroke="#10b981" stroke-width="2.8" class="${s.subPhase === 'trace' ? 'svg-draw' : ''}" />`;
      shapes += `<line x1="${p2.x}" y1="${p2.y}" x2="${q2.x}" y2="${q2.y}" stroke="#10b981" stroke-width="2.8" class="${s.subPhase === 'trace' ? 'svg-draw' : ''}" />`;
      svg.innerHTML = shapes;
    }

    document.getElementById('pf-pairs-strip').innerHTML = (s.pairs || []).map((p, idx) => {
      let cls = 'token-chip mono smooth-node ';
      if (idx < s.activePairIndex) cls += 'done';
      else if (idx === s.activePairIndex) cls += 'active';
      return `<span class="${cls}">${p.join('')}</span>`;
    }).join('');

    document.getElementById('pf-out-strip').innerHTML = (s.builtOutput || []).map((pair, idx) => {
      const latest = idx === s.builtOutput.length - 1 && s.subPhase === 'result';
      return `<span class="token-chip mono smooth-node ${latest ? 'result-lit' : ''}">${pair}</span>`;
    }).join('');
  }

  function buildMatrix(keyword) {
    const clean = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    const seen = new Set();
    const cells = [];
    const keyChars = [];
    for (const ch of clean) {
      if (!seen.has(ch)) {
        seen.add(ch);
        cells.push(ch);
        keyChars.push(ch);
      }
    }
    for (let c = 65; c <= 90; c++) {
      const ch = String.fromCharCode(c);
      if (ch !== 'J' && !seen.has(ch)) {
        seen.add(ch);
        cells.push(ch);
      }
    }
    return { cells, keySet: new Set(keyChars) };
  }

  function executeLocal(opMode, payload) {
    const key = (payload.key || '').trim();
    const rawText = (payload.text || '').trim();
    if (!key) throw new Error('Vui lòng nhập từ khoá.');
    if (!rawText) throw new Error('Vui lòng nhập văn bản đầu vào.');

    const { cells, keySet } = buildMatrix(key);
    const cleanText = rawText.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    if (!cleanText) throw new Error('Văn bản cần chứa ít nhất một chữ cái A-Z.');

    const pairs = [];
    if (opMode === 'encrypt') {
      let i = 0;
      while (i < cleanText.length) {
        const a = cleanText[i];
        const b = cleanText[i + 1];
        if (!b || a === b) {
          pairs.push([a, 'X']);
          i += 1;
        } else {
          pairs.push([a, b]);
          i += 2;
        }
      }
    } else {
      if (cleanText.length % 2 !== 0) throw new Error('Bản mã PlayFair phải có độ dài chẵn.');
      for (let i = 0; i < cleanText.length; i += 2) {
        pairs.push([cleanText[i], cleanText[i + 1]]);
      }
    }

    const findPos = (ch) => {
      const idx = cells.indexOf(ch);
      return [Math.floor(idx / 5), idx % 5];
    };

    const shift = opMode === 'encrypt' ? 1 : 4;
    const steps = [];

    steps.push({
      badge: 'MA TRẬN 5×5',
      title: 'Khởi tạo ma trận 5×5 và chia cặp ký tự',
      description: `Nạp từ khoá "${key.toUpperCase()}" và tách chuỗi thành ${pairs.length} cặp ký tự.`,
      state: {
        subPhase: 'init',
        cells,
        keySet: Array.from(keySet),
        pairs,
        activePairIndex: -1,
        inPair: '--',
        outPair: '--',
        rule: 'Khởi tạo bảng',
        coordCalc: `Tổng cộng ${pairs.length} cặp: ${pairs.map(p => p.join('')).join(' ')}`,
        r1: -1, c1: -1, r2: -1, c2: -1, nr1: -1, nc1: -1, nr2: -1, nc2: -1,
        ruleType: 'none',
        builtOutput: []
      }
    });

    const built = [];
    pairs.forEach(([a, b], idx) => {
      const [r1, c1] = findPos(a);
      const [r2, c2] = findPos(b);
      let nr1, nc1, nr2, nc2, rule, ruleType, coordCalc;

      if (r1 === r2) {
        ruleType = 'row';
        rule = opMode === 'encrypt' ? 'Cùng hàng — dịch phải' : 'Cùng hàng — dịch trái';
        nr1 = r1; nc1 = (c1 + shift) % 5; nr2 = r2; nc2 = (c2 + shift) % 5;
        coordCalc = `Cùng hàng ${r1 + 1}: cột (${c1 + 1} → ${nc1 + 1}), cột (${c2 + 1} → ${nc2 + 1})`;
      } else if (c1 === c2) {
        ruleType = 'col';
        rule = opMode === 'encrypt' ? 'Cùng cột — dịch xuống' : 'Cùng cột — dịch lên';
        nr1 = (r1 + shift) % 5; nc1 = c1; nr2 = (r2 + shift) % 5; nc2 = c2;
        coordCalc = `Cùng cột ${c1 + 1}: hàng (${r1 + 1} → ${nr1 + 1}), hàng (${r2 + 1} → ${nr2 + 1})`;
      } else {
        ruleType = 'rect';
        rule = 'Hình chữ nhật — đổi góc';
        nr1 = r1; nc1 = c2; nr2 = r2; nc2 = c1;
        coordCalc = `Đổi cột: (${r1 + 1},${c1 + 1})→(${nr1 + 1},${nc1 + 1}) và (${r2 + 1},${c2 + 1})→(${nr2 + 1},${nc2 + 1})`;
      }

      const outA = cells[nr1 * 5 + nc1];
      const outB = cells[nr2 * 5 + nc2];

      steps.push({
        badge: `CẶP ${idx + 1} · ĐỊNH VỊ`,
        title: `Cặp ${a}${b} — Bước 1: Định vị hai ô gốc trên ma trận`,
        description: `Tìm '${a}' tại (${r1 + 1},${c1 + 1}) và '${b}' tại (${r2 + 1},${c2 + 1}).`,
        state: {
          subPhase: 'locate',
          cells,
          keySet: Array.from(keySet),
          pairs,
          activePairIndex: idx,
          inPair: `${a}${b}`,
          outPair: '??',
          rule,
          coordCalc: `Toạ độ gốc: '${a}'=(${r1 + 1},${c1 + 1}), '${b}'=(${r2 + 1},${c2 + 1})`,
          r1, c1, r2, c2, nr1, nc1, nr2, nc2,
          ruleType,
          builtOutput: [...built]
        }
      });

      steps.push({
        badge: `CẶP ${idx + 1} · THAM CHIẾU`,
        title: `Cặp ${a}${b} — Bước 2: Vẽ đường tham chiếu`,
        description: `Áp dụng quy tắc "${rule}" từ hai ô gốc để xác định vị trí đích.`,
        state: {
          subPhase: 'trace',
          cells,
          keySet: Array.from(keySet),
          pairs,
          activePairIndex: idx,
          inPair: `${a}${b}`,
          outPair: '??',
          rule,
          coordCalc,
          r1, c1, r2, c2, nr1, nc1, nr2, nc2,
          ruleType,
          builtOutput: [...built]
        }
      });

      built.push(outA + outB);

      steps.push({
        badge: `CẶP ${idx + 1} · KẾT QUẢ`,
        title: `Cặp ${a}${b} — Bước 3: Sáng ô kết quả ${outA}${outB}`,
        description: `Hai ô kết quả tại (${nr1 + 1},${nc1 + 1}) và (${nr2 + 1},${nc2 + 1}) phát sáng cho cặp "${outA}${outB}".`,
        state: {
          subPhase: 'result',
          cells,
          keySet: Array.from(keySet),
          pairs,
          activePairIndex: idx,
          inPair: `${a}${b}`,
          outPair: `${outA}${outB}`,
          rule,
          coordCalc: `${coordCalc} ⇒ ${outA}${outB}`,
          r1, c1, r2, c2, nr1, nc1, nr2, nc2,
          ruleType,
          builtOutput: [...built]
        }
      });
    });

    return {
      result: built.join(''),
      meta: [
        { label: 'Số cặp xử lý', value: `${pairs.length} cặp` },
        { label: 'Các cặp đầu vào', value: pairs.map(p => p.join('')).join(' ') }
      ],
      steps
    };
  }

  return { initIdle, renderStep, executeLocal };
})();
