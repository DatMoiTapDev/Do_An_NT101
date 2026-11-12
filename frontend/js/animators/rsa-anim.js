// Kết xuất hoạt ảnh quy trình sinh khoá và phép tính luỹ thừa mô-đun cho thuật toán RSA.

window.NT101 = window.NT101 || {};

window.NT101.RsaAnim = (() => {
  function initIdle() {
    ['pq', 'n', 'phi', 'keys'].forEach(k => {
      document.getElementById(`rsa-val-${k}`).textContent = '--';
      document.getElementById(`rsa-node-${k}`).className = 'smooth-node flow-box';
    });
    [1, 2, 3, 4, 5].forEach(w => {
      const wire = document.getElementById(`rsa-wire-${w}`);
      if (wire) {
        wire.setAttribute('class', '');
        wire.style.color = '';
      }
    });
    document.getElementById('rsa-calc-formula').textContent = 'Chờ thực thi thuật toán...';
    document.getElementById('rsa-box-in').textContent = '--';
    document.getElementById('rsa-box-fn').textContent = '--';
    document.getElementById('rsa-box-out').textContent = '--';
    document.getElementById('rsa-pipe-in').className = 'smooth-node flow-box dim';
    document.getElementById('rsa-pipe-fn').className = 'smooth-node flow-box dim';
    document.getElementById('rsa-pipe-out').className = 'smooth-node flow-box dim';
    document.getElementById('rsa-history-strip').innerHTML = '';
  }

  function renderStep(step) {
    const s = step.state ? step.state : step;
    document.getElementById('rsa-val-pq').textContent = `${s.p}, ${s.q}`;
    document.getElementById('rsa-val-n').textContent = `${s.n}`;
    document.getElementById('rsa-val-phi').textContent = `${s.phi}`;
    document.getElementById('rsa-val-keys').textContent = s.d === '--' ? '--' : `${s.e} / ${s.d}`;
    document.getElementById('rsa-calc-formula').textContent = s.calcFormula || '';

    const order = ['pq', 'n', 'phi', 'keys'];
    const curIdx = (s.stage || '').startsWith('pipe') ? 4 : order.indexOf(s.stage);

    order.forEach((k, idx) => {
      const node = document.getElementById(`rsa-node-${k}`);
      if (idx === curIdx) node.className = 'smooth-node flow-box active-primary';
      else if (idx < curIdx) node.className = 'smooth-node flow-box active-success';
      else node.className = 'smooth-node flow-box dim';
    });

    [1, 2, 3].forEach(w => {
      const wire = document.getElementById(`rsa-wire-${w}`);
      if (curIdx >= w) {
        wire.setAttribute('class', 'svg-flow-active');
        wire.style.color = 'var(--primary)';
      } else {
        wire.setAttribute('class', '');
        wire.style.color = 'var(--text-muted)';
      }
    });

    const inPipe = (s.stage || '').startsWith('pipe');
    document.getElementById('rsa-box-in').textContent = s.activeIn || '--';
    document.getElementById('rsa-box-fn').textContent = s.activeFn || '--';
    document.getElementById('rsa-box-out').textContent = s.activeOut || '--';

    document.getElementById('rsa-pipe-in').className = `smooth-node flow-box ${inPipe ? 'active-primary' : 'dim'}`;
    document.getElementById('rsa-pipe-fn').className = `smooth-node flow-box ${s.stage === 'pipe-calc' ? 'active-primary' : (inPipe ? '' : 'dim')}`;
    document.getElementById('rsa-pipe-out').className = `smooth-node flow-box ${s.pipeDone ? 'active-success' : 'dim'}`;

    const w4 = document.getElementById('rsa-wire-4');
    const w5 = document.getElementById('rsa-wire-5');
    w4.setAttribute('class', inPipe ? 'svg-flow-active' : '');
    w4.style.color = inPipe ? 'var(--primary)' : 'var(--text-muted)';
    w5.setAttribute('class', s.pipeDone ? 'svg-flow-active' : '');
    w5.style.color = s.pipeDone ? 'var(--success)' : 'var(--text-muted)';

    document.getElementById('rsa-history-strip').innerHTML = (s.history || []).map((h, i) => {
      const latest = i === s.history.length - 1 && s.pipeDone;
      return `<span class="token-chip mono smooth-node ${latest ? 'result-lit' : ''}">${h}</span>`;
    }).join('');
  }

  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  }

  function gcdBig(a, b) {
    while (b !== 0n) [a, b] = [b, a % b];
    return a;
  }

  function modInverse(e, phi) {
    let [oldR, r] = [e, phi];
    let [oldS, s] = [1n, 0n];
    while (r !== 0n) {
      const q = oldR / r;
      [oldR, r] = [r, oldR - q * r];
      [oldS, s] = [s, oldS - q * s];
    }
    return oldS < 0n ? oldS + phi : oldS;
  }

  function modPow(base, exp, mod) {
    let res = 1n;
    base %= mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) res = (res * base) % mod;
      exp >>= 1n;
      base = (base * base) % mod;
    }
    return res;
  }

  function executeLocal(opMode, payload) {
    const pNum = Number(payload.p);
    const qNum = Number(payload.q);
    const eNum = Number(payload.e);
    const inputStr = (payload.text || '').trim();

    if (!isPrime(pNum) || !isPrime(qNum)) throw new Error('p và q phải là hai số nguyên tố hợp lệ.');
    if (pNum === qNum) throw new Error('p và q phải khác nhau.');
    if (!inputStr) throw new Error('Vui lòng nhập thông điệp đầu vào.');

    const p = BigInt(pNum);
    const q = BigInt(qNum);
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const e = BigInt(eNum);

    if (e <= 1n || e >= phi || gcdBig(e, phi) !== 1n) throw new Error('Số mũ e phải nguyên tố cùng nhau với φ(n).');
    if (n <= 127n) throw new Error('Tích n = p × q phải lớn hơn 127.');

    const d = modInverse(e, phi);
    const steps = [];

    steps.push({
      badge: 'KEYGEN 1/4',
      title: 'Nạp hai số nguyên tố p và q',
      description: `Chọn hai số nguyên tố p = ${p} và q = ${q}.`,
      state: {
        stage: 'pq', calcFormula: `Đầu vào: p = ${p}, q = ${q}`,
        p: p.toString(), q: q.toString(), n: '--', phi: '--', e: '--', d: '--',
        activeIn: '--', activeFn: '--', activeOut: '--', pipeDone: false, history: []
      }
    });
    steps.push({
      badge: 'KEYGEN 2/4',
      title: 'Tính mô-đun n = p × q',
      description: 'Thực hiện phép nhân hai số nguyên tố để tạo mô-đun công khai n.',
      state: {
        stage: 'n', calcFormula: `n = p × q = ${p} × ${q} = ${n}`,
        p: p.toString(), q: q.toString(), n: n.toString(), phi: '--', e: '--', d: '--',
        activeIn: '--', activeFn: '--', activeOut: '--', pipeDone: false, history: []
      }
    });
    steps.push({
      badge: 'KEYGEN 3/4',
      title: 'Tính hàm Euler φ(n)',
      description: 'Tính số lượng số nguyên tố cùng nhau nhỏ hơn n.',
      state: {
        stage: 'phi', calcFormula: `φ(n) = (${p} - 1) × (${q} - 1) = ${p - 1n} × ${q - 1n} = ${phi}`,
        p: p.toString(), q: q.toString(), n: n.toString(), phi: phi.toString(), e: '--', d: '--',
        activeIn: '--', activeFn: '--', activeOut: '--', pipeDone: false, history: []
      }
    });
    steps.push({
      badge: 'KEYGEN 4/4',
      title: 'Tính khoá bí mật d bằng Euclid mở rộng',
      description: 'Tìm nghịch đảo mô-đun của e theo φ(n) để hoàn tất cặp khoá.',
      state: {
        stage: 'keys', calcFormula: `e = ${e} ⇒ d = ${e}⁻¹ mod ${phi} = ${d}  (vì ${e} × ${d} mod ${phi} = ${(e * d) % phi})`,
        p: p.toString(), q: q.toString(), n: n.toString(), phi: phi.toString(), e: e.toString(), d: d.toString(),
        activeIn: '--', activeFn: '--', activeOut: '--', pipeDone: false, history: []
      }
    });

    const history = [];
    let finalResult = '';

    if (opMode === 'encrypt') {
      const chars = Array.from(inputStr);
      const outNums = [];
      chars.forEach((ch, idx) => {
        const code = BigInt(ch.charCodeAt(0));
        if (code >= n) throw new Error(`Mã ký tự '${ch}' vượt quá mô-đun n.`);
        const c = modPow(code, e, n);
        outNums.push(c.toString());

        steps.push({
          badge: `KÝ TỰ ${idx + 1} · TÍNH`,
          title: `Ký tự '${ch}' — Bước 1: Thực hiện phép luỹ thừa mô-đun`,
          description: `Chuyển '${ch}' sang mã ASCII M = ${code} và đưa vào công thức C = M^e mod n.`,
          state: {
            stage: 'pipe-calc', calcFormula: `M = '${ch}' (${code}) → Tính C = ${code}^${e} mod ${n} ...`,
            p: p.toString(), q: q.toString(), n: n.toString(), phi: phi.toString(), e: e.toString(), d: d.toString(),
            activeIn: `'${ch}' (${code})`, activeFn: `${code}^${e} mod ${n}`, activeOut: '...',
            pipeDone: false, history: [...history]
          }
        });

        history.push(`'${ch}' → ${c}`);
        steps.push({
          badge: `KÝ TỰ ${idx + 1} · KẾT QUẢ`,
          title: `Ký tự '${ch}' — Bước 2: Sáng kết quả C = ${c}`,
          description: `Kết quả phép tính mô-đun là ${c}.`,
          state: {
            stage: 'pipe-out', calcFormula: `C = ${code}^${e} mod ${n} = ${c}`,
            p: p.toString(), q: q.toString(), n: n.toString(), phi: phi.toString(), e: e.toString(), d: d.toString(),
            activeIn: `'${ch}' (${code})`, activeFn: `${code}^${e} mod ${n}`, activeOut: `${c}`,
            pipeDone: true, history: [...history]
          }
        });
      });
      finalResult = outNums.join(' ');
    } else {
      const parts = inputStr.split(/[\s,]+/).filter(Boolean);
      const plainChars = [];
      parts.forEach((part, idx) => {
        if (!/^\d+$/.test(part)) throw new Error('Đầu vào giải mã RSA phải là các số nguyên.');
        const c = BigInt(part);
        const m = modPow(c, d, n);
        const ch = String.fromCharCode(Number(m));
        plainChars.push(ch);

        steps.push({
          badge: `KHỐI ${idx + 1} · TÍNH`,
          title: `Khối ${part} — Bước 1: Tính luỹ thừa với khoá bí mật d`,
          description: 'Áp dụng công thức giải mã M = C^d mod n.',
          state: {
            stage: 'pipe-calc', calcFormula: `C = ${part} → Tính M = ${part}^${d} mod ${n} ...`,
            p: p.toString(), q: q.toString(), n: n.toString(), phi: phi.toString(), e: e.toString(), d: d.toString(),
            activeIn: `${part}`, activeFn: `${part}^${d} mod ${n}`, activeOut: '...',
            pipeDone: false, history: [...history]
          }
        });

        history.push(`${part} → '${ch}'`);
        steps.push({
          badge: `KHỐI ${idx + 1} · KẾT QUẢ`,
          title: `Khối ${part} — Bước 2: Khôi phục ký tự '${ch}'`,
          description: `Thu được mã ASCII ${m}, tương ứng ký tự '${ch}'.`,
          state: {
            stage: 'pipe-out', calcFormula: `M = ${part}^${d} mod ${n} = ${m} ('${ch}')`,
            p: p.toString(), q: q.toString(), n: n.toString(), phi: phi.toString(), e: e.toString(), d: d.toString(),
            activeIn: `${part}`, activeFn: `${part}^${d} mod ${n}`, activeOut: `${m} ('${ch}')`,
            pipeDone: true, history: [...history]
          }
        });
      });
      finalResult = plainChars.join('');
    }

    return {
      result: finalResult,
      meta: [
        { label: 'Public Key (e, n)', value: `(${e}, ${n})` },
        { label: 'Private Key (d, n)', value: `(${d}, ${n})` }
      ],
      steps
    };
  }

  return { initIdle, renderStep, executeLocal };
})();
