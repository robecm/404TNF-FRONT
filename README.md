# Exoptolemy (Space App)

Proyecto demo que muestra exoplanetas usando Vite + React + TypeScript y Tailwind CSS.

## Desarrollo

Instala dependencias y arranca el servidor de desarrollo:

```bash
npm install
npm run dev
```

## Variables de entorno

La app puede consultar datos desde la API oficial del Exoplanet Archive o desde un backend propio.

- `VITE_API_BASE` (opcional): URL base de tu backend (sin `/api`). Si lo defines, algunas operaciones de carga/subida usarán esa base.

En este repo las llamadas de lectura de exoplanetas usan directamente la API oficial de
`https://exoplanetarchive.ipac.caltech.edu/TAP/sync` en producción, por lo que no es necesario un proxy para las consultas de solo lectura.

Si necesitas capacidades de escritura (por ejemplo `upload`), configura `VITE_API_BASE` apuntando a tu backend que implemente los endpoints necesarios.

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
