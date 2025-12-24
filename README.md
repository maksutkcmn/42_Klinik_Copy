# 42 Klinik - Hastane Yönetim Sistemi

Bilişim Vadisi "Vadi Hackathon Series" de geliştirdiğimiz projenin remake'i.

Modern, full-stack hastane yönetim ve randevu sistemi.

## 🏗️ Teknoloji Stack

- **Frontend**: Vite + TypeScript + Vanilla JS
- **Backend**: .NET 9.0 + Entity Framework Core
- **Chatbot**: Spring Boot + OpenAI API
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Deployment**: Docker + Docker Compose

## 📋 Gereksinimler

- Docker & Docker Compose
- OpenAI API Key (chatbot için)

## 🚀 Kurulum ve Çalıştırma

### 1. Environment Variables'ı Ayarlayın

Root dizinde `.env` dosyası oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve OpenAI API anahtarınızı ekleyin:

```env
OPENAI_API_KEY=your-actual-openai-api-key-here
```

### 2. Docker Compose ile Tüm Servisleri Başlatın

```bash
docker-compose up --build
```

Bu komut şunları yapacak:
- MySQL veritabanını oluşturacak
- Redis cache'i başlatacak
- Backend API'yi ayağa kaldıracak (port 5084)
- Chatbot servisini başlatacak (port 8080)
- Frontend'i build edip serve edecek (port 80)

### 3. Uygulamaya Erişin

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5084
- **Chatbot API**: http://localhost:8080

## 🛠️ Development Mode

### Backend (.NET)

```bash
cd backend
dotnet restore
dotnet run
```

### Chatbot (Spring Boot)

```bash
cd chatbot
./gradlew bootRun
```

### Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

## 📦 Servisler

### Backend API Endpoints

- `POST /api/Login` - Kullanıcı girişi
- `POST /api/Register` - Kullanıcı kaydı
- `GET /api/get/appointments` - Randevuları listele
- `GET /api/get/doctor` - Doktorları listele
- `GET /api/get/doctors/expertise` - Uzmanlık alanlarını listele
- `POST /api/add/appointment` - Yeni randevu oluştur

### Chatbot API

- `POST /api/input` - Chatbot'a mesaj gönder

## 🔧 Konfigürasyon

### Backend (.env)

```env
DB_SERVER=mysql
DB_NAME=klinik
DB_USER=root
DB_PASSWORD=1234
JWT_SECRET_KEY=your-jwt-secret-key
REDIS_CONNECTION_STRING=redis:6379
```

### Chatbot (.env)

```env
OPENAI_API_KEY=your-openai-api-key
```

## 🗄️ Database Migration

Backend ilk başlatıldığında otomatik olarak migration'ları uygular.

## 🧹 Temizleme

Tüm servisleri durdurup temizlemek için:

```bash
docker-compose down -v
```

`-v` bayrağı volume'ları da siler (veritabanı verileri dahil).

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
