# Arcoiris's - Joyería a tu alcance

Monorepo para la aplicación web de Arcoiris Joyería.

## Estructura

```
Arcoiris/
├── backend/     → API Node.js + Express + MongoDB
├── frontend/    → React + Vite + TypeScript
└── .gitignore
```

## Setup local

### Backend
```bash
cd backend
npm install
cp .env.example .env   # configurar variables
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deploy

### Build del frontend
```bash
cd frontend
npm run build
cp -r dist/ ../backend/distFront/
```

### En el VPS
```bash
cd backend
npm install
npm start
```
