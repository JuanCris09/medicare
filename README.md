# Medicare Platform

Plataforma inteligente para gestión médica con OCR y notificaciones de Telegram.

## Desarrollo Local

Para que las funciones del backend (`api/`) funcionen correctamente junto con el frontend de Vite, debes usar Vercel CLI:

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Iniciar el entorno de desarrollo completo
vercel dev
```

Si usas `npm run dev`, las notificaciones de Telegram **no funcionarán** porque Vite no reconoce la carpeta `api/`.

## Tecnologías
- React + Vite
- Supabase (Base de datos)
- Tesseract.js (OCR)
- Vercel Serverless Functions
- Telegram Bot API
