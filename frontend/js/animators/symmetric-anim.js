// Kết xuất hoạt ảnh mạng Feistel cho DES và ma trận trạng thái 4x4 cho AES.

window.NT101 = window.NT101 || {};

window.NT101.SymmetricAnim = (() => {
  const AES_SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
  ];
  const AES_INV_SBOX = new Array(256);
  for (let i = 0; i < 256; i++) AES_INV_SBOX[AES_SBOX[i]] = i;
  const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];

  const hexB = (v) => v.toString(16).padStart(2, '0').toUpperCase();

  function initDesIdle() {
    document.getElementById('des-round-pill').textContent = 'Vòng 0 / 16';
    ['lprev', 'rprev', 'f', 'k', 'lnext', 'rnext'].forEach(id => {
      document.getElementById(`des-txt-${id}`).textContent = '--------';
    });
    document.getElementById('des-calc-title').textContent = 'Đang chờ chạy thuật toán';
    document.getElementById('des-calc-lines').textContent = '--';
    ['des-path-r-to-f', 'des-path-k-to-f', 'des-path-f-to-xor', 'des-path-l-to-xor', 'des-path-cross-rl', 'des-path-cross-xr'].forEach(id => {
      const el = document.getElementById(id);
      el.setAttribute('stroke', 'var(--text-muted)');
      el.setAttribute('class', '');
    });
    document.getElementById('des-rect-lnext').setAttribute('stroke', 'var(--border)');
    document.getElementById('des-rect-rnext').setAttribute('stroke', 'var(--border)');
  }

  function initAesIdle() {
    const makeGrid = (prefix) => Array(16).fill('').map((_, i) => {
      const r = Math.floor(i / 4);
      const c = i % 4;
      return `<div id="${prefix}-${r}-${c}" class="smooth-node aes-byte mono">00</div>`;
    }).join('');
    document.getElementById('aes-before-grid').innerHTML = makeGrid('aes-b');
    document.getElementById('aes-after-grid').innerHTML = makeGrid('aes-a');
    document.getElementById('aes-round-pill').textContent = 'Vòng 0 / 10';
    document.getElementById('aes-substep-pill').textContent = '--';
    document.getElementById('aes-calc-detail').textContent = 'Nhấn "Chạy thuật toán" để xem chi tiết từng phép biến đổi byte của AES.';
    document.getElementById('aes-rk-hex').textContent = '--------------------------------';
    ['Init', 'SubBytes', 'ShiftRows', 'MixColumns', 'AddRoundKey'].forEach(op => {
      document.getElementById(`aes-pipe-${op}`).className = 'smooth-node aes-step-pill';
    });
    document.getElementById('aes-before-card').className = 'smooth-node aes-matrix-card';
    document.getElementById('aes-calc-card').className = 'smooth-node calc-card';
    document.getElementById('aes-after-card').className = 'smooth-node aes-matrix-card';
  }

  function renderDesStep(step) {
    const s = step.state ? step.state : step;
    document.getElementById('des-round-pill').textContent = `Vòng ${s.round} / 16`;
    document.getElementById('des-txt-lprev').textContent = s.lPrev || '--------';
    document.getElementById('des-txt-rprev').textContent = s.rPrev || '--------';
    document.getElementById('des-txt-f').textContent = s.f || '--------';
    document.getElementById('des-txt-k').textContent = s.k || '--------';
    document.getElementById('des-txt-lnext').textContent = s.lNext || '--------';
    document.getElementById('des-txt-rnext').textContent = s.rNext || '--------';
    document.getElementById('des-calc-title').textContent = s.calcTitle || '';
    document.getElementById('des-calc-lines').textContent = s.calcLines || '';

    const paths = {
      'des-path-r-to-f': s.phase === 'f-func',
      'des-path-k-to-f': s.phase === 'f-func',
      'des-path-f-to-xor': s.phase === 'xor',
      'des-path-l-to-xor': s.phase === 'xor',
      'des-path-cross-rl': s.phase === 'cross',
      'des-path-cross-xr': s.phase === 'cross'
    };
    Object.entries(paths).forEach(([id, active]) => {
      const el = document.getElementById(id);
      el.setAttribute('stroke', active ? (s.phase === 'cross' ? 'var(--success)' : 'var(--primary)') : 'var(--text-muted)');
      el.setAttribute('class', active ? 'svg-flow-active' : '');
      el.style.opacity = active ? '1' : '0.35';
    });

    const isOutLit = s.phase === 'cross';
    document.getElementById('des-rect-lnext').setAttribute('stroke', isOutLit ? 'var(--success)' : 'var(--border)');
    document.getElementById('des-rect-rnext').setAttribute('stroke', isOutLit || s.phase === 'xor' ? 'var(--success)' : 'var(--border)');
  }

  function renderAesStep(step) {
    const s = step.state ? step.state : step;
    document.getElementById('aes-round-pill').textContent = `Vòng ${s.round} / 10`;
    document.getElementById('aes-substep-pill').textContent = s.subStage === 'calc' ? 'Đang tính' : 'Đã cập nhật';
    document.getElementById('aes-calc-detail').textContent = s.calcText || '';
    document.getElementById('aes-rk-hex').textContent = s.rk || '--------------------------------';

    ['Init', 'SubBytes', 'ShiftRows', 'MixColumns', 'AddRoundKey'].forEach(op => {
      const el = document.getElementById(`aes-pipe-${op}`);
      el.className = `smooth-node aes-step-pill ${s.op === op ? 'active' : ''}`;
    });

    const isResultLit = s.subStage === 'result';
    document.getElementById('aes-before-card').className = `smooth-node aes-matrix-card ${!isResultLit ? 'active-primary' : ''}`;
    document.getElementById('aes-calc-card').className = `smooth-node calc-card ${!isResultLit ? 'active-primary' : ''}`;
    document.getElementById('aes-after-card').className = `smooth-node aes-matrix-card ${isResultLit ? 'active-success' : 'dim'}`;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = c * 4 + r;
        const bVal = s.before[idx];
        const aVal = s.after[idx];
        const bCell = document.getElementById(`aes-b-${r}-${c}`);
        const aCell = document.getElementById(`aes-a-${r}-${c}`);
        bCell.textContent = hexB(bVal);
        aCell.textContent = hexB(aVal);

        const changed = bVal !== aVal;
        aCell.className = `smooth-node aes-byte mono ${isResultLit && (changed || s.op === 'Init') ? 'lit-out' : ''}`;

        const inSample = !isResultLit && (
          (s.op === 'MixColumns' && c === 0) ||
          (s.op === 'ShiftRows' && r === 1) ||
          ((s.op === 'SubBytes' || s.op === 'AddRoundKey') && idx < 4)
        );
        bCell.className = `smooth-node aes-byte mono ${inSample ? 'lit-in' : ''}`;
      }
    }
  }

  function padBytes(bytes, blockSize) {
    const pad = blockSize - (bytes.length % blockSize);
    const out = new Uint8Array(bytes.length + pad);
    out.set(bytes);
    out.fill(pad, bytes.length);
    return out;
  }

  function unpadBytes(bytes) {
    const pad = bytes[bytes.length - 1];
    if (pad < 1 || pad > bytes.length) throw new Error('Giải mã thất bại do sai khoá hoặc sai padding.');
    for (let i = bytes.length - pad; i < bytes.length; i++) {
      if (bytes[i] !== pad) throw new Error('Giải mã thất bại do sai khoá hoặc sai dữ liệu.');
    }
    return bytes.slice(0, bytes.length - pad);
  }

  function toFixedBytes(str, len) {
    const raw = new TextEncoder().encode(str);
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = i < raw.length ? raw[i] : 0;
    return out;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(hexB).join('');
  }

  function hexToBytes(hex) {
    const clean = hex.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) throw new Error('Chuỗi Hex không hợp lệ.');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  function aesExpandKey(keyBytes) {
    const w = Array.from(keyBytes);
    for (let i = 4; i < 44; i++) {
      let temp = w.slice((i - 1) * 4, i * 4);
      if (i % 4 === 0) {
        temp = [AES_SBOX[temp[1]] ^ RCON[i / 4 - 1], AES_SBOX[temp[2]], AES_SBOX[temp[3]], AES_SBOX[temp[0]]];
      }
      for (let j = 0; j < 4; j++) w.push(w[(i - 4) * 4 + j] ^ temp[j]);
    }
    const rks = [];
    for (let r = 0; r <= 10; r++) rks.push(w.slice(r * 16, r * 16 + 16));
    return rks;
  }

  const xtime = (a) => ((a << 1) ^ ((a & 0x80) ? 0x1b : 0)) & 0xff;
  const gmul = (a, b) => { let p = 0; for (let i = 0; i < 8; i++) { if (b & 1) p ^= a; a = xtime(a); b >>= 1; } return p; };
  function aesSubBytes(s, inv = false) { const box = inv ? AES_INV_SBOX : AES_SBOX; return s.map(v => box[v]); }
  function aesShiftRows(s, inv = false) {
    const out = [...s];
    for (let r = 1; r < 4; r++) {
      const row = [s[r], s[r + 4], s[r + 8], s[r + 12]];
      for (let c = 0; c < 4; c++) out[r + c * 4] = row[inv ? (c - r + 4) % 4 : (c + r) % 4];
    }
    return out;
  }
  function aesMixColumns(s, inv = false) {
    const out = [...s];
    for (let c = 0; c < 4; c++) {
      const i = c * 4, a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3];
      if (!inv) {
        out[i] = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3;
        out[i + 1] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3;
        out[i + 2] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3);
        out[i + 3] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2);
      } else {
        out[i] = gmul(a0, 14) ^ gmul(a1, 11) ^ gmul(a2, 13) ^ gmul(a3, 9);
        out[i + 1] = gmul(a0, 9) ^ gmul(a1, 14) ^ gmul(a2, 11) ^ gmul(a3, 13);
        out[i + 2] = gmul(a0, 13) ^ gmul(a1, 9) ^ gmul(a2, 14) ^ gmul(a3, 11);
        out[i + 3] = gmul(a0, 11) ^ gmul(a1, 13) ^ gmul(a2, 9) ^ gmul(a3, 14);
      }
    }
    return out;
  }
  function aesAddRoundKey(s, rk) { return s.map((v, i) => v ^ rk[i]); }

  function pushAesPair(steps, op, round, prefix, beforeSt, afterSt, rk, calcText) {
    steps.push({
      badge: `VÒNG ${round} · TÍNH`,
      title: `${prefix} — Bước 1: Thực hiện phép tính`,
      description: `Áp dụng phép biến đổi ${op} lên Ma trận trước.`,
      state: { op, round, subStage: 'calc', before: [...beforeSt], after: [...beforeSt], rk: bytesToHex(rk), calcText }
    });
    steps.push({
      badge: `VÒNG ${round} · KẾT QUẢ`,
      title: `${prefix} — Bước 2: Cập nhật & sáng Ma trận sau`,
      description: `Hoàn tất ${op}, kết quả được ghi sang Ma trận sau.`,
      state: { op, round, subStage: 'result', before: [...beforeSt], after: [...afterSt], rk: bytesToHex(rk), calcText }
    });
  }

  function aesBlockEncrypt(block, rks, trace = false) {
    const steps = [];
    let st = Array.from(block);
    if (trace) {
      steps.push({
        badge: 'NẠP KHỐI',
        title: 'Nạp khối 16 byte đầu vào thành Ma trận 4×4',
        description: '16 byte dữ liệu đầu tiên được xếp theo chiều dọc từng cột.',
        state: {
          op: 'Init', round: 0, subStage: 'result', before: [...st], after: [...st], rk: bytesToHex(rks[0]),
          calcText: `16 byte đầu vào:\n${bytesToHex(st).match(/.{2}/g).join(' ')}`
        }
      });
    }

    let next = aesAddRoundKey(st, rks[0]);
    if (trace) {
      pushAesPair(steps, 'AddRoundKey', 0, 'Vòng 0 (AddRoundKey)', st, next, rks[0],
        `XOR từng byte State với Round Key 0:\n` +
        `Ô[0,0]: ${hexB(st[0])} ⊕ ${hexB(rks[0][0])} = ${hexB(next[0])}\n` +
        `Ô[1,0]: ${hexB(st[1])} ⊕ ${hexB(rks[0][1])} = ${hexB(next[1])}\n` +
        `Ô[2,0]: ${hexB(st[2])} ⊕ ${hexB(rks[0][2])} = ${hexB(next[2])}\n` +
        `Ô[3,0]: ${hexB(st[3])} ⊕ ${hexB(rks[0][3])} = ${hexB(next[3])}`
      );
    }
    st = next;

    for (let r = 1; r <= 9; r++) {
      const bSub = [...st];
      st = aesSubBytes(st);
      if (trace && r === 1) {
        pushAesPair(steps, 'SubBytes', 1, 'Vòng 1 (SubBytes)', bSub, st, rks[1],
          `Tra bảng S-Box (4 bit đầu = hàng, 4 bit sau = cột):\n` +
          `Ô[0,0]: SBox[${hexB(bSub[0])[0]}][${hexB(bSub[0])[1]}] = ${hexB(st[0])}\n` +
          `Ô[1,0]: SBox[${hexB(bSub[1])[0]}][${hexB(bSub[1])[1]}] = ${hexB(st[1])}\n` +
          `Ô[0,1]: SBox[${hexB(bSub[4])[0]}][${hexB(bSub[4])[1]}] = ${hexB(st[4])}`
        );
      }

      const bShift = [...st];
      st = aesShiftRows(st);
      if (trace && r === 1) {
        pushAesPair(steps, 'ShiftRows', 1, 'Vòng 1 (ShiftRows)', bShift, st, rks[1],
          `Dịch vòng sang trái từng hàng:\n` +
          `Hàng 0: ${hexB(bShift[0])} ${hexB(bShift[4])} ${hexB(bShift[8])} ${hexB(bShift[12])}\n` +
          `Hàng 1 (trái 1): ${hexB(bShift[1])} ${hexB(bShift[5])} ${hexB(bShift[9])} ${hexB(bShift[13])} → ${hexB(st[1])} ${hexB(st[5])} ${hexB(st[9])} ${hexB(st[13])}\n` +
          `Hàng 2 (trái 2): → ${hexB(st[2])} ${hexB(st[6])} ${hexB(st[10])} ${hexB(st[14])}\n` +
          `Hàng 3 (trái 3): → ${hexB(st[3])} ${hexB(st[7])} ${hexB(st[11])} ${hexB(st[15])}`
        );
      }

      const bMix = [...st];
      st = aesMixColumns(st);
      if (trace && r === 1) {
        pushAesPair(steps, 'MixColumns', 1, 'Vòng 1 (MixColumns)', bMix, st, rks[1],
          `Nhân ma trận GF(2^8) với Cột 0:\n` +
          `[02 03 01 01]   [${hexB(bMix[0])}]   [${hexB(st[0])}]\n` +
          `[01 02 03 01] × [${hexB(bMix[1])}] = [${hexB(st[1])}]\n` +
          `[01 01 02 03]   [${hexB(bMix[2])}]   [${hexB(st[2])}]\n` +
          `[03 01 01 02]   [${hexB(bMix[3])}]   [${hexB(st[3])}]`
        );
      }

      const bAdd = [...st];
      st = aesAddRoundKey(st, rks[r]);
      if (trace && (r === 1 || r === 9)) {
        pushAesPair(steps, 'AddRoundKey', r, `Vòng ${r} (AddRoundKey)`, bAdd, st, rks[r],
          `XOR State với Round Key ${r}:\n` +
          `Ô[0,0]: ${hexB(bAdd[0])} ⊕ ${hexB(rks[r][0])} = ${hexB(st[0])}\n` +
          `Ô[1,0]: ${hexB(bAdd[1])} ⊕ ${hexB(rks[r][1])} = ${hexB(st[1])}`
        );
      }
    }

    const bFinal = [...st];
    st = aesSubBytes(st);
    st = aesShiftRows(st);
    st = aesAddRoundKey(st, rks[10]);
    if (trace) {
      pushAesPair(steps, 'AddRoundKey', 10, 'Vòng 10 (Vòng cuối AES)', bFinal, st, rks[10],
        `Vòng cuối bỏ qua MixColumns:\nSubBytes → ShiftRows → AddRoundKey(K10)\nKhối mã 16 byte: ${bytesToHex(st)}`
      );
    }
    return { block: new Uint8Array(st), steps };
  }

  function aesBlockDecrypt(block, rks, trace = false) {
    const steps = [];
    let st = Array.from(block);
    if (trace) {
      steps.push({
        badge: 'NẠP BẢN MÃ',
        title: 'Nạp khối bản mã 16 byte vào State',
        description: 'Bắt đầu giải mã ngược từ vòng 10 về vòng 0.',
        state: {
          op: 'Init', round: 10, subStage: 'result', before: [...st], after: [...st], rk: bytesToHex(rks[10]),
          calcText: `Khối mã đầu vào:\n${bytesToHex(st).match(/.{2}/g).join(' ')}`
        }
      });
    }

    let next = aesAddRoundKey(st, rks[10]);
    if (trace) {
      pushAesPair(steps, 'AddRoundKey', 10, 'Vòng 10 (AddRoundKey ngược)', st, next, rks[10],
        `Ô[0,0]: ${hexB(st[0])} ⊕ ${hexB(rks[10][0])} = ${hexB(next[0])}`
      );
    }
    st = next;

    for (let r = 9; r >= 1; r--) {
      const bS = [...st];
      st = aesShiftRows(st, true);
      if (trace && r === 9) {
        pushAesPair(steps, 'ShiftRows', 9, 'Vòng 9 (InvShiftRows)', bS, st, rks[9],
          'Dịch vòng sang phải 0, 1, 2, 3 ô trên 4 hàng.'
        );
      }
      const bSub = [...st];
      st = aesSubBytes(st, true);
      if (trace && r === 9) {
        pushAesPair(steps, 'SubBytes', 9, 'Vòng 9 (InvSubBytes)', bSub, st, rks[9],
          `Tra bảng S-Box nghịch đảo: ${hexB(bSub[0])} → ${hexB(st[0])}`
        );
      }
      const bMix = [...st];
      st = aesAddRoundKey(st, rks[r]);
      st = aesMixColumns(st, true);
      if (trace && (r === 9 || r === 1)) {
        pushAesPair(steps, 'MixColumns', r, `Vòng ${r} (AddRoundKey + InvMixColumns)`, bMix, st, rks[r],
          `XOR với Round Key ${r} rồi nhân ma trận InvMixColumns khôi phục cột.`
        );
      }
    }

    const bEnd = [...st];
    st = aesShiftRows(st, true);
    st = aesSubBytes(st, true);
    st = aesAddRoundKey(st, rks[0]);
    if (trace) {
      pushAesPair(steps, 'AddRoundKey', 0, 'Vòng 0 (Khôi phục khối rõ)', bEnd, st, rks[0],
        `Hoàn tất giải mã: ${bytesToHex(st)}`
      );
    }
    return { block: new Uint8Array(st), steps };
  }

  function desRoundF(rBytes, subKeyBytes) {
    const out = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      const s = AES_SBOX[(rBytes[i] ^ subKeyBytes[i]) & 0xff];
      out[i] = ((s << 1) | (s >>> 7)) & 0xff;
    }
    return out;
  }

  function desSubkeys(keyBytes) {
    const keys = [];
    for (let r = 1; r <= 16; r++) {
      const rk = new Uint8Array(4);
      for (let i = 0; i < 4; i++) rk[i] = keyBytes[(i + r) % 8] ^ ((r * 19 + i * 7) & 0xff);
      keys.push(rk);
    }
    return keys;
  }

  function desBlockProcess(block, subkeys, isEncrypt, trace = false) {
    let L = new Uint8Array(block.slice(0, 4));
    let R = new Uint8Array(block.slice(4, 8));
    const steps = [];
    const order = isEncrypt ? Array.from({ length: 16 }, (_, i) => i) : Array.from({ length: 16 }, (_, i) => 15 - i);

    order.forEach((kIdx, stepNo) => {
      const rk = subkeys[kIdx];
      const fOut = desRoundF(R, rk);
      const nextL = new Uint8Array(R);
      const nextR = new Uint8Array(4);
      for (let i = 0; i < 4; i++) nextR[i] = L[i] ^ fOut[i];

      const lHex = bytesToHex(L);
      const rHex = bytesToHex(R);
      const kHex = bytesToHex(rk);
      const fHex = bytesToHex(fOut);
      const nlHex = bytesToHex(nextL);
      const nrHex = bytesToHex(nextR);

      if (trace && (stepNo === 0 || stepNo === 1 || stepNo === 15)) {
        const rnd = stepNo + 1;
        steps.push({
          badge: `VÒNG ${rnd} · HÀM F`,
          title: `Vòng ${rnd} — Pha 1: Tính hàm F(R, K${kIdx + 1})`,
          description: `Đưa nửa phải R và khoá con K${kIdx + 1} vào hàm F để tạo chuỗi 32-bit.`,
          state: {
            round: rnd, phase: 'f-func',
            calcTitle: `Tính F(R, K${kIdx + 1})`,
            calcLines: `R      = ${rHex}\nK${kIdx + 1}     = ${kHex}\nF(R,K) = ${fHex}`,
            lPrev: lHex, rPrev: rHex, k: kHex, f: fHex, lNext: '--------', rNext: '--------'
          }
        });
        steps.push({
          badge: `VÒNG ${rnd} · XOR`,
          title: `Vòng ${rnd} — Pha 2: Tính R' = L ⊕ F(R, K)`,
          description: 'Thực hiện phép XOR từng bit giữa nửa trái L và đầu ra hàm F.',
          state: {
            round: rnd, phase: 'xor',
            calcTitle: "Phép XOR tạo R'",
            calcLines: `L      = ${lHex}\n⊕ F    = ${fHex}\n──────────────────\nR'     = ${nrHex}`,
            lPrev: lHex, rPrev: rHex, k: kHex, f: fHex, lNext: '--------', rNext: nrHex
          }
        });
        steps.push({
          badge: `VÒNG ${rnd} · SÁNG KẾT QUẢ`,
          title: `Vòng ${rnd} — Pha 3: Hoán đổi chéo & sáng (L', R')`,
          description: "Nửa phải R chuyển sang trái L', kết quả XOR chuyển xuống phải R'.",
          state: {
            round: rnd, phase: 'cross',
            calcTitle: `Hoán đổi đầu ra vòng ${rnd}`,
            calcLines: `L' = R = ${nlHex}\nR'     = ${nrHex}`,
            lPrev: lHex, rPrev: rHex, k: kHex, f: fHex, lNext: nlHex, rNext: nrHex
          }
        });
      }
      L = nextL;
      R = nextR;
    });

    const out = new Uint8Array(8);
    out.set(R, 0);
    out.set(L, 4);
    return { block: out, steps };
  }

  function executeLocal(algo, opMode, payload) {
    const mode = payload.cipher_mode || 'CBC';
    const keyStr = payload.key || '';
    const ivStr = payload.iv || '';
    const text = payload.text || '';
    if (!keyStr) throw new Error('Vui lòng nhập khoá bí mật.');
    if (!text) throw new Error('Vui lòng nhập dữ liệu đầu vào.');

    const blockSize = algo === 'des' ? 8 : 16;
    const keyBytes = toFixedBytes(keyStr, blockSize);
    const ivBytes = toFixedBytes(ivStr || '0', blockSize);
    const rawInput = opMode === 'encrypt' ? padBytes(new TextEncoder().encode(text), blockSize) : hexToBytes(text);

    if (opMode === 'decrypt' && rawInput.length % blockSize !== 0) {
      throw new Error(`Bản mã Hex phải chia hết cho ${blockSize} byte.`);
    }

    const output = new Uint8Array(rawInput.length);
    let traceSteps = [];
    const rks = algo === 'aes' ? aesExpandKey(keyBytes) : desSubkeys(keyBytes);
    let prevCipher = new Uint8Array(ivBytes);

    for (let off = 0; off < rawInput.length; off += blockSize) {
      const block = rawInput.slice(off, off + blockSize);
      const isFirst = off === 0;
      if (opMode === 'encrypt') {
        if (mode === 'CBC') for (let i = 0; i < blockSize; i++) block[i] ^= prevCipher[i];
        const res = algo === 'aes' ? aesBlockEncrypt(block, rks, isFirst) : desBlockProcess(block, rks, true, isFirst);
        output.set(res.block, off);
        prevCipher = res.block;
        if (isFirst) traceSteps = res.steps;
      } else {
        const cipherCopy = new Uint8Array(block);
        const res = algo === 'aes' ? aesBlockDecrypt(block, rks, isFirst) : desBlockProcess(block, rks, false, isFirst);
        const plainBlock = new Uint8Array(res.block);
        if (mode === 'CBC') for (let i = 0; i < blockSize; i++) plainBlock[i] ^= prevCipher[i];
        output.set(plainBlock, off);
        prevCipher = cipherCopy;
        if (isFirst) traceSteps = res.steps;
      }
    }

    const resultText = opMode === 'encrypt' ? bytesToHex(output) : new TextDecoder().decode(unpadBytes(output));
    return {
      result: resultText,
      meta: [
        { label: 'Thuật toán & Chế độ', value: `${algo.toUpperCase()} — ${mode}` },
        { label: 'Kích thước khối', value: `${blockSize * 8}-bit (${rawInput.length / blockSize} khối)` }
      ],
      steps: traceSteps
    };
  }

  return { initDesIdle, initAesIdle, renderDesStep, renderAesStep, executeLocal };
})();
