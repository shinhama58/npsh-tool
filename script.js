// Antoine式で Pv を計算
function calcPv(tempC) {
  const A = 8.07131;
  const B = 1730.63;
  const C = 233.426;

  const Pv_mmHg = Math.pow(10, A - (B / (C + tempC)));
  return Pv_mmHg * 133.322;  // Pa
}

// 温度入力時に Pv 自動更新
function updatePv() {
  const temp = parseFloat(document.getElementById('temp').value);
  if (isNaN(temp)) {
    document.getElementById('pv').value = "";
    return;
  }
  const pv = calcPv(temp);
  document.getElementById('pv').value = pv.toFixed(0);
}

// NPSHa 計算
function calcNPSHa(pa, pv, rho, g, hs, hf) {
  return (pa - pv) / (rho * g) + hs - hf;
}

// 方式C：経験式
function calcNPSHr_C(Q_m3min, n_rpm, D_mm, Ccoef) {
  const Q = Q_m3min / 60;   // m³/min → m³/s
  const n = n_rpm;
  const D = D_mm / 1000;    // mm → m

  return Ccoef * Math.pow(Q, 0.5) * Math.pow(n, 0.75) * Math.pow(D, 2);
}

// 方式切替（UI）
function switchMethod() {
  const m = document.getElementById('method').value;

  document.querySelectorAll('.method-A').forEach(e => e.style.display = (m === 'A') ? 'flex' : 'none');
  document.querySelectorAll('.method-B').forEach(e => e.style.display = (m === 'B') ? 'flex' : 'none');
  document.querySelectorAll('.method-C').forEach(e => e.style.display = (m === 'C') ? 'flex' : 'none');
}

// 初期表示
window.onload = switchMethod;

// NPSHr を方式ごとに計算
function calcNPSHr_byMethod() {
  const method = document.getElementById('method').value;

  if (method === 'A') {
    return parseFloat(document.getElementById('npshrA').value);

  } else if (method === 'B') {
    const Ns = parseFloat(document.getElementById('ns').value);
    // ★必要なら後で正式な式に差し替え
    return 0.0003 * Math.pow(Ns, 1.5);

  } else {
    const Q = parseFloat(document.getElementById('q').value);
    const n = parseFloat(document.getElementById('n').value);
    const D = parseFloat(document.getElementById('d').value);
    const Ccoef = parseFloat(document.getElementById('c').value);
    return calcNPSHr_C(Q, n, D, Ccoef);
  }
}

// 全計算
function calcAll() {
  const pa    = parseFloat(document.getElementById('pa').value);
  const pv    = parseFloat(document.getElementById('pv').value);
  const rho   = parseFloat(document.getElementById('rho').value);
  const g     = parseFloat(document.getElementById('g').value);
  const hs    = parseFloat(document.getElementById('hs').value);
  const hf    = parseFloat(document.getElementById('hf').value);
  const temp  = parseFloat(document.getElementById('temp').value);

  if ([pa, pv, rho, g, hs, hf, temp].some(v => isNaN(v))) {
    alert('すべての値を入力してください');
    return;
  }

  const npsha = calcNPSHa(pa, pv, rho, g, hs, hf);
  const npshr = calcNPSHr_byMethod();
  const margin = npsha - npshr;

  document.getElementById('result-npsha').textContent = npsha.toFixed(3);
  document.getElementById('result-npshr').textContent = npshr.toFixed(3);
  document.getElementById('result-margin').textContent = margin.toFixed(3);

  const judge = document.getElementById('judge');

  // NPSHa < 0 は運転不能
  if (npsha < 0) {
    judge.textContent = "⚠ NPSHa が負です。吸込条件が破綻しており、ポンプは運転不能です。";
    judge.style.color = "red";
    return;
  }

  // 温度で安全率切替
  if (temp >= 60) {
    if (npsha >= 2 * npshr) {
      judge.textContent = "◎ 高温液でも十分な余裕があります（NPSHa ≥ 2×NPSHr）";
      judge.style.color = "green";
    } else if (npsha >= 1.3 * npshr) {
      judge.textContent = "○ 余裕はあるが高温のため注意（1.3〜2倍）";
      judge.style.color = "orange";
    } else if (npsha >= npshr) {
      judge.textContent = "△ 最低限。高温では危険（NPSHa < 1.3×NPSHr）";
      judge.style.color = "orange";
    } else {
      judge.textContent = "× キャビテーションの可能性大（NPSHa < NPSHr）";
      judge.style.color = "red";
    }

  } else if (temp >= 40) {
    if (npsha >= 1.5 * npshr) {
      judge.textContent = "◎ 中温でも十分な余裕があります（NPSHa ≥ 1.5×NPSHr）";
      judge.style.color = "green";
    } else if (npsha >= 1.3 * npshr) {
      judge.textContent = "○ 余裕はあるが注意（1.3〜1.5倍）";
      judge.style.color = "orange";
    } else if (npsha >= npshr) {
      judge.textContent = "△ 最低限。条件変動に注意（NPSHa < 1.3×NPSHr）";
      judge.style.color = "orange";
    } else {
      judge.textContent = "× キャビテーションの可能性大（NPSHa < NPSHr）";
      judge.style.color = "red";
    }

  } else {
    if (npsha >= 1.3 * npshr) {
      judge.textContent = "◎ 十分な余裕があります（NPSHa ≥ 1.3×NPSHr）";
      judge.style.color = "green";
    } else if (npsha >= 1.1 * npshr) {
      judge.textContent = "○ 最低限の余裕（1.1〜1.3倍）";
      judge.style.color = "orange";
    } else if (npsha >= npshr) {
      judge.textContent = "△ ギリギリ。注意が必要（NPSHa < 1.1×NPSHr）";
      judge.style.color = "orange";
    } else {
      judge.textContent = "× キャビテーションの可能性大（NPSHa < NPSHr）";
      judge.style.color = "red";
    }
  }
}