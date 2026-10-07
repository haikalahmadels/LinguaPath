# LinguaPath

Landing page untuk LinguaPath, aplikasi belajar bahasa yang dimulai dari level pengguna. Tes singkat menunjukkan level, lalu setiap sesi 10 menit memberi satu langkah berikutnya yang jelas.

## Fitur halaman

- Tes level interaktif langsung di halaman
- Bagian cara kerja, fitur, pilihan bahasa (Jepang, Inggris, Korea), dan FAQ
- Dua bahasa antarmuka: Indonesia dan Inggris
- Mode terang dan gelap, mengikuti pengaturan sistem atau pilihan pengguna
- Responsif dari ponsel sampai desktop

## Struktur

```
LinguaPath/
├── index.html      # Halaman utama
├── css/
│   └── style.css   # Semua gaya dan token warna (terang/gelap)
└── js/
    ├── i18n.js     # Teks antarmuka bahasa Indonesia dan Inggris
    ├── mascot.js   # Maskot SVG dan animasinya
    └── main.js     # Interaksi: tema, bahasa, menu, tes level, animasi scroll
```

## Menjalankan

Tidak perlu build atau instalasi. Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npx serve .
# atau
python -m http.server 8000
```

Koneksi internet diperlukan untuk memuat font Plus Jakarta Sans (Google Fonts) dan GSAP (cdnjs).

## Teknologi

- HTML, CSS, dan JavaScript tanpa framework
- Font [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
