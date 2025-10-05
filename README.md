# Exoptolemy (Space App)

Proyecto demo que muestra exoplanetas usando Vite + React + TypeScript y Tailwind CSS.

## Desarrollo

Instala dependencias y arranca el servidor de desarrollo:

```bash
npm install
npm run dev
```

## Variables de entorno

La app utiliza variables de Vite (deben empezar con `VITE_`) para configurar la URL del backend en build/producción.

Archivo de ejemplo: `.env.example` (incluido en la raíz).

- `VITE_API_BASE`: URL base del API (sin `/api`). Ejemplo:

	VITE_API_BASE=https://api.exoptolemy.study

En desarrollo puedes copiar el archivo de ejemplo:

```bash
cp .env.example .env
# editar .env si necesitas cambiar la URL
```

En tu proveedor de hosting (Vercel, Netlify, etc.) añade `VITE_API_BASE` en las Environment Variables del proyecto antes de construir la app.

Si no se define `VITE_API_BASE`, la app intentará usar la ruta relativa `/api/exoplanets` como fallback.

## Despliegue

Construye y sirve la app:

```bash
npm run build
npm run preview
```

## Notas

- Para evitar 404s ruidosos en la consola por assets externos, la app tiene lógica para usar imágenes de respaldo en producción y para prefetch en desarrollo.
- Si necesitas que reemplace el BACKUP_IMG por una imagen propia (hosteada por ti), dame la URL y lo actualizo.
space-bolt
