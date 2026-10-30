# Ruang Rasa — Backend API

Express + MongoDB + JWT untuk aplikasi **Ruang Rasa** (F&B dine-in). Frontend React ada di folder saudara `../ruang-rasa`.

## Frontend pelanggan vs panel admin (CMS)

| | **Web `ruang-rasa` (sekarang)** | **Backend API (sudah ada)** |
|--|----------------------------------|-----------------------------|
| Siapa | Pelanggan / tamu | Admin + integrasi web/mobile |
| Fitur | Beranda, menu, keranjang, checkout | CRUD menu, kelola user, lihat & update status pesanan |
| Login | Belum di UI (mock lokal) | JWT (`/api/auth/login`) |

**Benar:** UI saat ini hanya alur **customer**. Untuk **admin** (kelola user & order, edit menu), idealnya tim frontend menambah halaman terpisah (mis. `/admin`) **atau** app admin sendiri — backend sudah menyiapkan endpoint dengan role `admin`. Sementara CMS belum ada, admin bisa tes lewat **Postman / Thunder Client** (langkah di bawah).

---

## Panduan step-by-step (Windows, untuk tim)

### 0. Yang harus terinstall

- **Node.js** 18+ ([nodejs.org](https://nodejs.org)) — cek: `node -v`
- **MongoDB** — pilih salah satu:
  - **Lokal:** [MongoDB Community](https://www.mongodb.com/try/download/community) — service harus jalan (port 27017), **atau**
  - **Cloud:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — buat cluster gratis, copy connection string ke `.env`

### 1. Masuk folder backend

```powershell
cd "...\Final-TA\ruang-rasa-backend"
```

(Ganti `...` dengan path OneDrive/laptop masing-masing.)

### 2. File environment

```powershell
copy .env.example .env
```

Isi `.env` (minimal):

| Variabel | Contoh | Keterangan |
|----------|--------|------------|
| `PORT` | `5000` | Port API |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/ruang_rasa` | Lokal, atau string Atlas |
| `JWT_SECRET` | string panjang acak | Wajib untuk login |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend Vite |
| `SEED_ADMIN_EMAIL` | email buatan tim | Wajib untuk `npm run seed` |
| `SEED_ADMIN_PASSWORD` | password min. 6 karakter | Wajib untuk `npm run seed`; **hanya di `.env`**, tidak di git |

### 3. Install dependency (sekali)

```powershell
npm install
```

### 4. Isi database (menu + akun admin)

```powershell
npm run seed
```

Harus muncul kira-kira: `Seed 11 produk` dan `Admin dibuat untuk email: ...`.  
Email/password admin = nilai **`SEED_ADMIN_*`** di `.env` masing-masing (bagikan ke tim secara privat, bukan lewat git).  
Jalankan lagi **`npm run seed`** hanya jika ingin **reset menu** (data produk dihapus & diisi ulang). Admin yang sudah ada tidak diduplikasi.

### 5. Jalankan server development

```powershell
npm run dev
```

Berhasil jika terminal menampilkan:

- `MongoDB connected`
- `API Ruang Rasa berjalan di http://localhost:5000`

Biarkan terminal ini **tetap terbuka** selama coding/testing.

### 6. Cek API hidup

Browser atau PowerShell:

```powershell
curl.exe http://localhost:5000/api/health
```

Respons OK: `"success":true`, `"status":"ok"`.

Daftar menu:

```powershell
curl.exe http://localhost:5000/api/products
```

### 7. (Opsional) Login admin via PowerShell

```powershell
# Pakai email/password yang sama dengan SEED_ADMIN_* di .env
$body = @{ email = "admin@example.com"; password = "password-dari-env" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
```

Simpan **`token`** dari respons untuk request admin (header `Authorization: Bearer <token>`).

### 8. Jalankan frontend (teman frontend — folder terpisah)

```powershell
cd "...\Final-TA\ruang-rasa"
npm install
npm run dev
```

Frontend biasanya `http://localhost:5173`. Hubungkan ke API dengan env `VITE_API_URL=http://localhost:5000` (saat tim sudah wiring fetch/axios).

---

## Troubleshooting

### `EADDRINUSE` port 5000

Port masih dipakai proses Node lama:

```powershell
netstat -ano | findstr :5000
taskkill /PID <nomor_PID> /F
```

Lalu `npm run dev` lagi. Alternatif: ganti `PORT=5001` di `.env`.

### MongoDB connection error

- Lokal: pastikan service MongoDB running.
- Atlas: IP whitelist (0.0.0.0/0 untuk dev), user/password benar di URI.

### `JWT_SECRET wajib di-set`

Isi `JWT_SECRET` di file `.env`, simpan, restart `npm run dev`.

---

## Admin tanpa CMS (Postman / Thunder Client)

1. `POST http://localhost:5000/api/auth/login` — body JSON: `{ "email": "<SEED_ADMIN_EMAIL>", "password": "<SEED_ADMIN_PASSWORD>" }` dari `.env` tim
2. Copy `data.token`
3. Tab Authorization → Bearer Token, tempel token
4. Contoh:
   - `GET /api/orders` — semua pesanan
   - `PATCH /api/orders/<id>/status` — body: `{ "status": "confirmed" }`
   - `POST /api/products` — tambah menu (admin)
   - `GET /api/users` — daftar user

---

## Setup singkat (sudah pernah install)

```powershell
npm run dev
```

(API default: `http://localhost:5000` — asumsi `.env` dan `npm run seed` sudah pernah dijalankan.)

## Akun seed (admin)

Tidak ada password bawaan di kode. Tim **menentukan sendiri** di file **`.env`** ( tidak di-push ke git ):

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Setelah `npm run seed`, login admin memakai pasangan email/password itu di `/api/auth/login`.

## Format response

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "errors": [ ... ] }
```

Header auth: `Authorization: Bearer <token>`

---
