'use strict';
/* ====== BAGIAN 1: MATEMATIKA (bilangan kompleks & rangkaian) ====== */
const Z = {
  c: (re, im = 0) => ({ re, im }),
  add: (a, b) => Z.c(a.re + b.re, a.im + b.im),
  mul: (a, b) => Z.c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re),
  div: (a, b) => { const d = b.re * b.re + b.im * b.im; return Z.c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); },
  k: (a, s) => Z.c(a.re * s, a.im * s),
  abs: a => Math.hypot(a.re, a.im),
  arg: a => Math.atan2(a.im, a.re) * 180 / Math.PI,
  pol: (m, deg) => { const t = deg * Math.PI / 180; return Z.c(m * Math.cos(t), m * Math.sin(t)); }
};
const NOL = Z.c(0, 0);

/* Validasi masukan; mengembalikan daftar pesan kesalahan (kosong = valid) */
function validasi(p) {
  const e = [];
  for (const k in p) if (!Number.isFinite(p[k])) e.push('Nilai "' + k + '" harus berupa angka yang valid.');
  if (e.length) return e;
  if (p.v1 < 0 || p.v2 < 0) e.push('Tegangan RMS tidak boleh negatif (gunakan sudut fase 180° untuk membalik polaritas).');
  if (p.r1 <= 0 || p.r2 <= 0) e.push('Resistor cabang harus lebih besar dari 0 Ω (jika 0 Ω, node keluaran terhubung langsung ke sumber dan persamaan nodal tidak terdefinisi).');
  if (p.rl < 0) e.push('Resistor beban tidak boleh negatif.');
  if (p.L < 0) e.push('Induktansi tidak boleh negatif.');
  if (p.f < 0) e.push('Frekuensi tidak boleh negatif.');
  if (!e.length && p.rl === 0 && (p.L === 0 || p.f === 0)) e.push('Impedansi beban = 0 (R beban = 0 dan ωL = 0): node keluaran terhubung singkat ke ground, sehingga Vout = 0 dan arus beban tak terhingga/tidak terdefinisi. Naikkan R beban atau L.');
  return e;
}

/* Perhitungan lengkap. mode: 's1' | 's2' | 'both' menentukan keadaan rangkaian yang digambar */
function hitung(p, mode) {
  const w = 2 * Math.PI * p.f;
  const Zb = Z.c(p.rl, w * p.L / 1000);                 // Zbeban = R + jωL
  const Y = Z.add(Z.add(Z.c(1 / p.r1), Z.c(1 / p.r2)), Z.div(Z.c(1), Zb));
  const V1 = Z.pol(p.v1, p.a1), V2 = Z.pol(p.v2, p.a2);
  const Vo1 = Z.div(Z.k(V1, 1 / p.r1), Y);              // V2 dihubung singkat (V2 = 0)
  const Vo2 = Z.div(Z.k(V2, 1 / p.r2), Y);              // V1 dihubung singkat (V1 = 0)
  const Vsum = Z.add(Vo1, Vo2);
  const Vdir = Z.div(Z.add(Z.k(V1, 1 / p.r1), Z.k(V2, 1 / p.r2)), Y); // kedua sumber aktif
  const s1 = mode !== 's2', s2 = mode !== 's1';
  const Va1 = s1 ? V1 : NOL, Va2 = s2 ? V2 : NOL;       // sumber nonaktif = 0 V (hubung singkat)
  const Vout = Z.div(Z.add(Z.k(Va1, 1 / p.r1), Z.k(Va2, 1 / p.r2)), Y);
  const I1 = Z.k(Z.add(Va1, Z.k(Vout, -1)), 1 / p.r1);  // arah: sumber -> node
  const I2 = Z.k(Z.add(Va2, Z.k(Vout, -1)), 1 / p.r2);
  const Ib = Z.div(Vout, Zb);                           // arah: node -> ground
  const Ib1 = Z.div(Vo1, Zb), Ib2 = Z.div(Vo2, Zb), IbDir = Z.div(Vdir, Zb);
  const Vtot = Z.add(s1 ? Vo1 : NOL, s2 ? Vo2 : NOL);
  const selisih = Z.abs(Z.add(Vsum, Z.k(Vdir, -1)));
  const tol = 1e-9 * Math.max(1, Z.abs(Vdir));
  return { w, Zb, Y, V1, V2, Vo1, Vo2, Vsum, Vdir, Vout, Vtot, I1, I2, Ib, Ib1, Ib2, IbDir, s1, s2, selisih, tol, ok: selisih <= tol, Va1, Va2 };
}
if (typeof module !== 'undefined') module.exports = { Z, hitung, validasi };

/* ====== BAGIAN 2: ANTARMUKA ====== */
if (typeof document !== 'undefined') window.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const CT = [ // id, label, satuan, min, max, step, default, warna
    ['v1', 'Tegangan sumber 1', 'V RMS', 0, 30, 0.5, 10, 'c1'], ['a1', 'Sudut fase sumber 1', '°', -180, 180, 1, 0, 'c1'],
    ['v2', 'Tegangan sumber 2', 'V RMS', 0, 30, 0.5, 6, 'c2'], ['a2', 'Sudut fase sumber 2', '°', -180, 180, 1, 30, 'c2'],
    ['r1', 'Resistor cabang 1 (R1)', 'Ω', 1, 1000, 1, 100, 'c1'], ['r2', 'Resistor cabang 2 (R2)', 'Ω', 1, 1000, 1, 150, 'c2'],
    ['rl', 'Resistor beban (Rb)', 'Ω', 0, 1000, 1, 100, 'ct'], ['L', 'Induktansi beban (L)', 'mH', 0, 1000, 1, 100, 'ct'],
    ['f', 'Frekuensi (f)', 'Hz', 0, 500, 1, 50, 'ct']];
  const kontrol = $('#kontrol');
  CT.forEach(([id, lab, sat, mn, mx, st, df, cl]) => {
    const d = document.createElement('div'); d.className = 'ctl ' + cl;
    d.innerHTML = `<label for="n_${id}">${lab}</label><div class="row"><input type="range" id="r_${id}" min="${mn}" max="${mx}" step="${st}" value="${df}" aria-label="${lab} (slider)"><input type="number" id="n_${id}" step="any" value="${df}" inputmode="decimal"><span>${sat}</span></div>`;
    kontrol.appendChild(d);
    const r = d.querySelector('[type=range]'), n = d.querySelector('[type=number]');
    r.addEventListener('input', () => { n.value = r.value; update(); });
    n.addEventListener('input', () => { if (n.value !== '' && Number.isFinite(+n.value)) r.value = n.value; update(); });
  });

  let mode = 'both', jalan = false, tvis = 0, last = 0, R = null, P = null;
  const fn = (x, d = 3) => { const s = (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d); return s === '-0.' + '0'.repeat(d) ? (0).toFixed(d) : s; };
  const rect = z => `${fn(z.re)} ${z.im < 0 ? '−' : '+'} j${fn(Math.abs(z.im))}`;
  const pola = z => `${fn(Z.abs(z))} ∠ ${fn(Z.arg(z), 2)}°`;
  const ang = z => Z.abs(z) < 1e-12 ? 0 : Z.arg(z);
  const num = x => fn(x, 3).replace(/\.?0+$/, m => m.includes('.') ? '' : m);
  const nilai = id => $('#n_' + id).value.trim() === '' ? NaN : Number($('#n_' + id).value);
  const bacaP = () => { const p = {}; CT.forEach(c => p[c[0]] = nilai(c[0])); return p; };
  const win = () => P.f > 0 ? 3 / P.f : 0.02;               // jendela waktu: 3 periode (20 ms jika f = 0)
  const tReal = () => ((tvis / 6) % 1) * win();              // waktu nyata pada penanda animasi
  const set = (id, t) => { $('#' + id).textContent = t; };

  function update() {
    const p = bacaP(), err = validasi(p);
    const box = $('#pesan');
    if (err.length) { box.hidden = false; box.innerHTML = '<strong>Masukan tidak valid:</strong><ul>' + err.map(e => '<li>' + e + '</li>').join('') + '</ul>'; return; }
    box.hidden = true; P = p; R = hitung(p, mode);
    renderSVG(); renderTabel(); renderBanding(); renderTeori(); gambar();
  }

  function renderSVG() {
    const p = P, r = R;
    set('lv1', `V₁ = ${num(p.v1)} V ∠ ${num(p.a1)}°`); set('lv2', `V₂ = ${num(p.v2)} V ∠ ${num(p.a2)}°`);
    set('lr1', `R₁ = ${num(p.r1)} Ω`); set('lr2', `R₂ = ${num(p.r2)} Ω`);
    set('lrb', `Rb = ${num(p.rl)} Ω`); set('llb', `L = ${num(p.L)} mH`);
    set('lzb', `Zb = ${pola(r.Zb)} Ω`);
    set('st1', r.s1 ? 'AKTIF' : 'NONAKTIF → hubung singkat'); set('st2', r.s2 ? 'AKTIF' : 'NONAKTIF → hubung singkat');
    $('#s1on').style.display = r.s1 ? '' : 'none'; $('#s1off').style.display = r.s1 ? 'none' : '';
    $('#s2on').style.display = r.s2 ? '' : 'none'; $('#s2off').style.display = r.s2 ? 'none' : '';
    set('li1', `I₁ = ${pola(r.I1)} A`); set('li2', `I₂ = ${pola(r.I2)} A`); set('lib', `Ib = ${pola(r.Ib)} A`);
    set('lvo', `Vout = ${pola(r.Vout)} V`);
  }

  function renderTabel() {
    const r = R, br = (n, z, u) => `<tr><th scope="row">${n}</th><td>${rect(z)} ${u}</td><td>${pola(z)}</td><td>${fn(Z.abs(z), 4)}</td><td>${fn(ang(z), 2)}°</td></tr>`;
    $('#tbody').innerHTML = br('Vout1 (sumber 1 saja)', r.Vo1, 'V') + br('Vout2 (sumber 2 saja)', r.Vo2, 'V') +
      br('Vout total (mode aktif)', r.Vtot, 'V') + br('Vout langsung (mode aktif)', r.Vout, 'V') + br('I beban', r.Ib, 'A') +
      br('I₁ (cabang 1)', r.I1, 'A') + br('I₂ (cabang 2)', r.I2, 'A') + br('Z beban', r.Zb, 'Ω');
    const sm = Z.abs(Z.add(r.Vtot, Z.k(r.Vout, -1)));
    const ok = sm <= 1e-9 * Math.max(1, Z.abs(r.Vout));
    $('#statusMode').innerHTML = `Mode ini: |Vout total − Vout langsung| = ${sm.toExponential(2)} V → <b class="${ok ? 'ok' : 'bad'}">${ok ? 'Sesuai' : 'Tidak Sesuai'}</b>`;
  }

  function renderBanding() {
    const r = R, mag = Z.abs(r.Vo1) + Z.abs(r.Vo2), P1 = Math.pow(Z.abs(r.Ib1), 2) * P.rl, P2 = Math.pow(Z.abs(r.Ib2), 2) * P.rl, Pd = Math.pow(Z.abs(r.IbDir), 2) * P.rl;
    $('#banding').innerHTML = `
      <div class="kv"><span>Vout1 + Vout2 (fasor)</span><b>${pola(r.Vsum)} V</b></div>
      <div class="kv"><span>Vout, kedua sumber aktif (nodal langsung)</span><b>${pola(r.Vdir)} V</b></div>
      <div class="kv"><span>Selisih |Δ|</span><b>${r.selisih.toExponential(2)} V (toleransi ${r.tol.toExponential(1)})</b></div>
      <div class="status ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✔ Sesuai — superposisi fasor sama dengan analisis langsung' : '✖ Tidak Sesuai — selisih di luar toleransi'}</div>
      <p class="catatan"><b>Peringatan:</b> menjumlahkan besar saja memberi |Vout1| + |Vout2| = ${fn(mag, 4)} V, padahal besar fasor total = ${fn(Z.abs(r.Vsum), 4)} V. Selisihnya karena sudut fase berbeda.</p>
      <p class="catatan"><b>Daya tidak superposisi:</b> P beban (kedua sumber) = ${fn(Pd, 4)} W, sedangkan P₁ + P₂ = ${fn(P1 + P2, 4)} W (P₁ = ${fn(P1, 4)} W, P₂ = ${fn(P2, 4)} W). Daya bersifat kuadratik sehingga tidak boleh dijumlahkan langsung.</p>`;
  }

  function renderTeori() {
    const p = P, r = R, w = r.w;
    const T = (j, h) => `<details ${j < 3 ? 'open' : ''}><summary>${j}. ${h[0]}</summary><div>${h[1]}</div></details>`;
    const isi = [
      ['Pengertian Teorema Superposisi', 'Pada rangkaian <b>linear</b> dengan banyak sumber independen, tegangan atau arus di suatu elemen sama dengan <b>jumlah</b> respons akibat tiap sumber yang bekerja sendiri, sementara sumber lain dinonaktifkan.'],
      ['Syarat penggunaan', 'Rangkaian harus linear (R, L, C konstan, sumber independen) dan semua sumber berfrekuensi <b>sama</b> bila dianalisis dengan fasor. Hanya berlaku untuk tegangan dan arus, <b>bukan daya</b>.'],
      ['Fasor dan bilangan kompleks', `Gelombang v(t) = √2·Vrms·cos(2πft + φ) diwakili fasor V = Vrms∠φ = a + jb, dengan a = Vrms·cos φ dan b = Vrms·sin φ.<br>V₁ = ${num(p.v1)}∠${num(p.a1)}° = ${rect(r.V1)} V<br>V₂ = ${num(p.v2)}∠${num(p.a2)}° = ${rect(r.V2)} V`],
      ['Impedansi resistor dan induktor', 'Z<sub>R</sub> = R (nyata), Z<sub>L</sub> = jωL (imajiner positif, arus tertinggal 90° dari tegangan). Beban seri: Zb = Rb + jωL.'],
      ['Frekuensi, ω, dan impedansi induktor', `Rumus: ω = 2πf, Z<sub>L</sub> = jωL.<br>Substitusi: ω = 2π·${num(p.f)} = ${fn(w, 3)} rad/s; Z<sub>L</sub> = j·${fn(w, 3)}·${num(p.L / 1000)} = j${fn(w * p.L / 1000, 4)} Ω.<br>Hasil: Zb = ${rect(r.Zb)} Ω = ${pola(r.Zb)} Ω.`],
      ['Menonaktifkan sumber tegangan ideal', 'Sumber tegangan ideal yang dinonaktifkan diganti <b>hubung singkat</b> (0 V, kawat), bukan rangkaian terbuka. (Sumber arus yang dinonaktifkan baru diganti rangkaian terbuka.) Resistor seri sumber tetap berada di rangkaian.'],
      ['Sumber 1 saja aktif (V₂ → hubung singkat)', `Rumus: Vout1 = (V₁/R₁) / (1/R₁ + 1/R₂ + 1/Zb).<br>Y = 1/R₁ + 1/R₂ + 1/Zb = ${rect(r.Y)} S.<br>V₁/R₁ = ${rect(Z.k(r.V1, 1 / p.r1))} A.<br><b>Vout1 = ${rect(r.Vo1)} V = ${pola(r.Vo1)} V</b>`],
      ['Sumber 2 saja aktif (V₁ → hubung singkat)', `Rumus: Vout2 = (V₂/R₂) / (1/R₁ + 1/R₂ + 1/Zb).<br>V₂/R₂ = ${rect(Z.k(r.V2, 1 / p.r2))} A.<br><b>Vout2 = ${rect(r.Vo2)} V = ${pola(r.Vo2)} V</b>`],
      ['Menjumlahkan hasil dalam fasor', `Vout_total = Vout1 + Vout2 (bagian real dijumlah dengan real, imajiner dengan imajiner).<br>(${rect(r.Vo1)}) + (${rect(r.Vo2)}) = <b>${rect(r.Vsum)} V = ${pola(r.Vsum)} V</b>`],
      ['Perbandingan dengan kedua sumber aktif', `Rumus: Vout = (V₁/R₁ + V₂/R₂) / Y.<br>Hasil langsung: <b>${pola(r.Vdir)} V</b>. Selisih terhadap superposisi: ${r.selisih.toExponential(2)} V → <b class="${r.ok ? 'ok' : 'bad'}">${r.ok ? 'Sesuai' : 'Tidak Sesuai'}</b>.<br>Arus beban: Ib = Vout/Zb = ${pola(r.IbDir)} A.`],
      ['Kesimpulan', r.ok ? 'Hasil superposisi (Vout1 + Vout2) sama dengan analisis nodal saat kedua sumber aktif, dalam toleransi numerik. Ini mendukung teorema pada rangkaian linear ini, asalkan penjumlahan dilakukan secara fasor (besar dan sudut), bukan besar saja.' : 'Hasil tidak cocok dalam toleransi — periksa masukan atau perhitungan. Teorema tidak boleh dinyatakan terverifikasi.']
    ];
    $('#teoriIsi').innerHTML = isi.map((h, i) => T(i + 1, h)).join('');
  }

  /* ----- Gambar kanvas ----- */
  function siapkan(cv, tinggi) {
    const d = window.devicePixelRatio || 1, W = cv.clientWidth, H = tinggi;
    cv.width = W * d; cv.height = H * d; cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H); return [g, W, H];
  }
  const WARNA = { c1: '#e8590c', c2: '#1c7ed6', ct: '#2f9e44', sb: '#868e96' };
  function panah(g, x0, y0, x1, y1, col, lw, dash) {
    g.strokeStyle = g.fillStyle = col; g.lineWidth = lw; g.setLineDash(dash || []);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    const a = Math.atan2(y1 - y0, x1 - x0), h = 9;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - h * Math.cos(a - .4), y1 - h * Math.sin(a - .4)); g.lineTo(x1 - h * Math.cos(a + .4), y1 - h * Math.sin(a + .4)); g.closePath(); g.fill();
  }
  function gambarFasor(rot) {
    const [g, W, H] = siapkan($('#fasor'), Math.min(380, Math.max(280, $('#fasor').clientWidth * 0.85)));
    const cx = W / 2, cy = H / 2, e = Z.pol(1, rot * 180 / Math.PI), rot_ = z => Z.mul(z, e);
    const a = R.s1 ? R.Vo1 : NOL, b = R.s2 ? R.Vo2 : NOL, t = R.Vtot;
    const mx = Math.max(Z.abs(a), Z.abs(b), Z.abs(t), Z.abs(Z.add(a, b)), 1e-9), Rad = Math.min(W, H) / 2 - 34, s = Rad / mx;
    g.strokeStyle = '#dee2e6'; g.lineWidth = 1; g.font = '12px system-ui'; g.fillStyle = '#868e96';
    [0.5, 1].forEach(k => { g.beginPath(); g.arc(cx, cy, Rad * k, 0, 7); g.stroke(); });
    g.strokeStyle = '#adb5bd'; g.beginPath(); g.moveTo(8, cy); g.lineTo(W - 8, cy); g.moveTo(cx, 8); g.lineTo(cx, H - 8); g.stroke();
    g.fillText('Real', W - 36, cy - 6); g.fillText('Imajiner', cx + 6, 16); g.fillText(fn(mx, 2) + ' V', cx + Rad * 0.72 + 2, cy + 14);
    const P2 = z => { const q = rot_(z); return [cx + q.re * s, cy - q.im * s]; };
    const [ax, ay] = P2(a), [tx, ty] = P2(t), [bx, by] = P2(NOL), tip = P2(Z.add(a, b));
    panah(g, cx, cy, ax, ay, WARNA.c1, 3);
    const bo = P2(b); panah(g, cx, cy, bo[0], bo[1], WARNA.c2, 1.5, [4, 4]);
    panah(g, ax, ay, tip[0], tip[1], WARNA.c2, 3);
    panah(g, cx, cy, tx, ty, WARNA.ct, 4);
    g.font = 'bold 12px system-ui';
    const lab = (txt, x, y, c) => { g.fillStyle = c; g.fillText(txt, Math.min(W - 118, Math.max(4, x + 6)), Math.min(H - 6, Math.max(14, y - 6))); };
    if (R.s1) lab(`Vout1 ${fn(Z.abs(R.Vo1), 2)}∠${fn(Z.arg(R.Vo1), 1)}°`, ax, ay, WARNA.c1);
    if (R.s2) lab(`Vout2 ${fn(Z.abs(R.Vo2), 2)}∠${fn(Z.arg(R.Vo2), 1)}°`, tip[0], tip[1], WARNA.c2);
    lab(`Total ${fn(Z.abs(t), 2)}∠${fn(Z.arg(t), 1)}°`, tx, ty + 18, WARNA.ct);
  }
  function gambarGelombang() {
    const [g, W, H] = siapkan($('#gelombang'), Math.min(320, Math.max(240, $('#gelombang').clientWidth * 0.6)));
    const T = win(), w = R.w, m = 38, pw = W - m - 8, ph = H - 28, n = 400;
    const f1 = t => R.s1 ? Math.SQRT2 * P.v1 * Math.cos(w * t + P.a1 * Math.PI / 180) : 0;
    const f2 = t => R.s2 ? Math.SQRT2 * P.v2 * Math.cos(w * t + P.a2 * Math.PI / 180) : 0;
    const fo = t => Math.SQRT2 * Z.abs(R.Vout) * Math.cos(w * t + Z.arg(R.Vout) * Math.PI / 180);
    const ym = Math.max(Math.SQRT2 * Math.max(R.s1 ? P.v1 : 0, R.s2 ? P.v2 : 0, Z.abs(R.Vout)), 1e-6) * 1.1;
    const X = t => m + t / T * pw, Y = v => 10 + ph / 2 - v / ym * ph / 2;
    g.strokeStyle = '#ced4da'; g.fillStyle = '#868e96'; g.font = '11px system-ui'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(m, Y(0)); g.lineTo(W - 8, Y(0)); g.moveTo(m, 10); g.lineTo(m, 10 + ph); g.stroke();
    g.fillText(fn(ym, 1) + ' V', 2, 18); g.fillText('−' + fn(ym, 1), 2, 10 + ph); g.fillText('0', 26, Y(0) + 4);
    g.fillText(P.f > 0 ? `t (0 – ${fn(T * 1000, 1)} ms, 3 periode)` : 't (0 – 20 ms, f = 0: DC)', m, H - 6);
    [['w1', f1, WARNA.c1], ['w2', f2, WARNA.c2], ['wo', fo, WARNA.ct]].forEach(([id, f, c]) => {
      if (!$('#' + id).checked) return;
      g.strokeStyle = c; g.lineWidth = id === 'wo' ? 3 : 2; g.beginPath();
      for (let i = 0; i <= n; i++) { const t = T * i / n; i ? g.lineTo(X(t), Y(f(t))) : g.moveTo(X(t), Y(f(t))); } g.stroke();
    });
    const tm = tReal(); g.strokeStyle = '#495057'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(tm), 10); g.lineTo(X(tm), 10 + ph); g.stroke(); g.setLineDash([]);
  }
  /* animasi titik arus: simpangan ∝ sin(ωt+θ) sehingga arah bolak-balik, bukan searah */
  function gambarArus() {
    const tm = tReal(), maks = Math.max(Z.abs(R.I1), Z.abs(R.I2), Z.abs(R.Ib), 1e-12);
    [['d1', R.I1], ['d2', R.I2], ['db', R.Ib]].forEach(([id, I]) => {
      const el = $('#' + id), k = Z.abs(I) / maks, ph = R.w * tm + Z.arg(I) * Math.PI / 180;
      el.style.opacity = k < 1e-6 ? 0 : 0.35 + 0.65 * k;
      el.style.strokeDashoffset = -(16 * Math.sin(ph)) * (0.3 + 0.7 * k);
    });
    set('waktu', P.f > 0 ? `t = ${fn(tm * 1000, 2)} ms` : 'DC (f = 0)');
  }
  function gambar() {
    if (!R) return;
    const rot = $('#putar').checked ? R.w * tReal() : 0;
    gambarFasor(rot); gambarGelombang(); gambarArus();
  }
  function loop(ts) {
    if (!jalan) return;
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts; tvis += dt; gambar(); requestAnimationFrame(loop);
  }
  const mulai = () => { if (jalan) return; jalan = true; last = performance.now(); requestAnimationFrame(loop); setBtn(); };
  const jeda = () => { jalan = false; setBtn(); };
  function setBtn() { $('#bMulai').setAttribute('aria-pressed', jalan); $('#bJeda').setAttribute('aria-pressed', !jalan); }
  function setMode(m) {
    mode = m;
    [['bS1', 's1'], ['bS2', 's2'], ['bBoth', 'both']].forEach(([i, k]) => $('#' + i).setAttribute('aria-pressed', mode === k));
    update();
  }

  $('#bMulai').onclick = mulai; $('#bJeda').onclick = jeda;
  $('#bReset').onclick = () => { CT.forEach(c => { $('#n_' + c[0]).value = c[6]; $('#r_' + c[0]).value = c[6]; }); jeda(); tvis = 0; $('#putar').checked = false; ['w1', 'w2', 'wo'].forEach(i => $('#' + i).checked = true); setMode('both'); };
  $('#bS1').onclick = () => setMode('s1'); $('#bS2').onclick = () => setMode('s2'); $('#bBoth').onclick = () => setMode('both');
  $('#bBand').onclick = () => { setMode('both'); const el = $('#bandingkan'); el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1500); };
  ['putar', 'w1', 'w2', 'wo'].forEach(i => $('#' + i).addEventListener('change', gambar));
  $('#bTeori').onclick = () => $('#teori').scrollIntoView({ behavior: 'smooth' });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(gambar, 120); });
  setBtn(); setMode('both');
});
