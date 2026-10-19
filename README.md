# Simulasi Teorema Superposisi – Rangkaian Listrik AC

Simulasi web (HTML + CSS + JavaScript murni, tanpa backend/framework). Folder:

```
superposisi-ac/
├── index.html   (struktur + gambar rangkaian SVG)
├── style.css    (tampilan responsif)
├── script.js    (perhitungan fasor + interaksi)
└── README.md
```

## Rangkaian & rumus
V1 –R1– node ← R2 –V2; dari node: Rb seri L ke ground. Zb = Rb + jωL, ω = 2πf, Y = 1/R1 + 1/R2 + 1/Zb.
- Vout1 = (V1/R1)/Y (V2 dihubung singkat) — Vout2 = (V2/R2)/Y (V1 dihubung singkat)
- Vout = (V1/R1 + V2/R2)/Y — Ib = Vout/Zb — I1 = (V1−Vout)/R1 — I2 = (V2−Vout)/R2

## Contoh hasil parameter awal (dihitung oleh kode, diuji dengan Node.js)
ω = 314,159 rad/s; ZL = j31,4159 Ω; **Zb = 100 + j31,4159 = 104,819∠17,441° Ω**
- **Vout1** = 3,8335 + j0,4254 V = 3,857∠6,332° V
- **Vout2** = 1,2429 + j0,9141 V = 1,543∠36,332° V
- **Vout1 + Vout2** = 5,0764 + j1,3394 V = **5,250∠14,781° V**
- Vout langsung (kedua aktif) = 5,0764 + j1,3394 V → selisih ≈ 2×10⁻¹⁶ V → **Sesuai**
- Ib = 0,0501∠−2,660° A; I1 = 0,0510∠−15,219° A; I2 = 0,0111∠85,876° A (KCL: I1 + I2 − Ib ≈ 10⁻¹⁷)
- Catatan: |Vout1| + |Vout2| = 5,400 V ≠ 5,250 V → sudut fase harus diperhitungkan.

## Menjalankan lokal
Buka `index.html` dengan dobel-klik di browser (Chrome/Edge/Firefox). Tidak perlu instalasi.
Opsional: `python -m http.server` lalu buka `http://localhost:8000` (hanya untuk uji lokal).

## Publikasi GitHub Pages
1. Login github.com → **New repository**.
2. Nama contoh: `simulasi-superposisi-ac` (huruf kecil, tanpa spasi), pilih **Public**, Create.
3. **Add file → Upload files**: unggah `index.html`, `style.css`, `script.js`, `README.md` (langsung di root, bukan di dalam subfolder), lalu **Commit changes**.
4. **Settings → Pages**. Pada *Build and deployment* pilih **Deploy from a branch**.
5. Branch: **main**, folder: **/ (root)** → **Save**.
6. Tunggu 1–3 menit; URL muncul di halaman itu: `https://USERNAME.github.io/simulasi-superposisi-ac/`.
7. Buka URL di laptop dan HP (sebaiknya juga tab penyamaran/incognito).
8. Memperbarui: buka file di repo → ikon pensil (Edit) atau **Upload files** dengan nama sama → Commit. Tunggu beberapa menit, lalu refresh keras (Ctrl+F5).

Semua path bersifat relatif (`style.css`, `script.js`); tidak ada dependensi eksternal.

## Checklist uji manual (belum diuji di browser sungguhan oleh pembuat)
- [ ] Halaman terbuka tanpa error (F12 → Console kosong); rangkaian, fasor, dan gelombang tampil.
- [ ] Nilai awal: Vout total = 5,250∠14,781° V, status "Sesuai".
- [ ] Tombol Sumber 1/Sumber 2/Kedua: sumber nonaktif tampil sebagai kawat tebal dan label "hubung singkat"; Vout berubah (3,857 / 1,543 / 5,250 V).
- [ ] Mulai/Jeda/Reset berfungsi; titik arus bolak-balik; penanda waktu di grafik bergerak.
- [ ] Ubah tiap parameter → angka, gambar, fasor, gelombang, teori ikut berubah.
- [ ] Masukan uji: R1 = 0, kolom kosong, Rb = 0 & L = 0 → muncul pesan merah; f = 0, sudut −45°, L = 0 → tidak ada NaN/Infinity.
- [ ] HP (lebar ≤ 400 px): satu kolom, tidak ada scroll horizontal pada halaman, tombol mudah ditekan, tabel bisa digeser.
- [ ] Pengaturan "kurangi gerakan" aktif: tidak ada animasi dekoratif.

## Kemungkinan masalah
| Masalah | Solusi |
|---|---|
| Halaman GitHub Pages 404 | File harus di root repo, branch `main`, folder `/ (root)`; tunggu beberapa menit |
| Tampilan polos tanpa gaya | Nama file harus persis `style.css` (huruf kecil) |
| Tidak ada hasil/angka | Periksa Console (F12); pastikan `script.js` terunggah |
| Perubahan tidak muncul | Ctrl+F5 / hapus cache |
| Pesan "masukan tidak valid" | Baca pesan; R1, R2 harus > 0, Zb tidak boleh 0 |

## Bahan presentasi singkat
"Rangkaian linear dengan dua sumber AC ini saya analisis dengan fasor. Saya hitung Vout akibat sumber 1 saja (sumber 2 dihubung singkat) dan sumber 2 saja, lalu menjumlahkannya sebagai bilangan kompleks. Hasilnya, 5,250∠14,78° V, sama dengan analisis nodal kedua sumber aktif, dengan selisih numerik ~10⁻¹⁶ V. Simulasi juga menunjukkan bahwa menjumlahkan besar tegangan saja salah (5,400 V), dan bahwa daya tidak dapat disuperposisikan."
