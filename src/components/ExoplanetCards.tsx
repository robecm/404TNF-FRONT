import { useEffect, useState, useRef, FC } from "react";
import { Globe, Star } from "lucide-react";
import ExoplanetSearchForm from './ExoplanetSearchForm';
import ExoplanetIdForm from './ExoplanetIdForm';

type Exoplanet = {
  pl_name: string;
  hostname: string;
  discoverymethod: string;
  disc_year: number;
  pl_rade: number | null;
  pl_bmasse: number | null;
  sy_dist: number | null;
  image_url?: string;
};

// Construye la URL del API usando VITE_API_BASE si está definida en producción.
// En desarrollo Vite normalmente usa un proxy en /api; en producción debes
// apuntar VITE_API_BASE a tu backend (por ejemplo https://api.exoptolemy.study)
const API_QUERY =
  'select top 120 pl_name,hostname,discoverymethod,disc_year,pl_rade,pl_bmasse,sy_dist from pscomppars order by disc_year desc';

// Llamamos directamente al upstream oficial

function buildApiUrl(query: string) {
  const q = encodeURIComponent(query);
  // Llamar a la ruta relativa /api/exoplanets; en desarrollo Vite la proxeará,
  // en producción Vercel aplicará la rewrite definida en vercel.json.
  return `/api/exoplanets?query=${q}&format=json`;
}

// Base de imágenes NASA
const NASA_IMG_BASE =
  "https://assets.science.nasa.gov/dynamicimage/assets/science/astro/exo-explore/assets/content/planets";
// Imagen genérica de respaldo si no se encuentra la original
const BACKUP_IMG =
  "https://assets.science.nasa.gov/dynamicimage/assets/science/astro/exo-explore/assets/content/planets/neptunelike-8.jpg?fit=clip&crop=faces%2Cfocalpoint&w=300";

/** Clasifica tipo de planeta por radio o masa (muy general) */
function classifyPlanetType(rade: number | null, bmasse: number | null): string {
  if (typeof rade === "number" && !Number.isNaN(rade)) {
    if (rade >= 8) return "jupiterlike";
    if (rade >= 3) return "neptunelike";
    if (rade >= 1.5) return "superearth";
    return "terrestrial";
  }
  if (typeof bmasse === "number" && !Number.isNaN(bmasse)) {
    if (bmasse >= 100) return "jupiterlike";
    if (bmasse >= 17) return "neptunelike";
    if (bmasse >= 2) return "superearth";
    return "terrestrial";
  }
  return "neptunelike";
}

/** Crea índice estable para distribuir imágenes */
// Reducimos el rango a 8 para disminuir peticiones a archivos que no existen en el CDN
const MAX_NASA_INDEX = 8;
function indexFromName(name: string, max = MAX_NASA_INDEX): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return (h % max) + 1;
}

/** Construye URL dinámica desde NASA assets */
function buildNasaImageUrl(
  plName: string,
  rade: number | null,
  bmasse: number | null,
  idxOverride?: number
): string {
  const type = classifyPlanetType(rade, bmasse);
  const idx = idxOverride ?? indexFromName(plName);
  const params = "fit=clip&crop=faces%2Cfocalpoint&w=300";
  return `${NASA_IMG_BASE}/${type}-${idx}.jpg?${params}`;
}

// Cache en memoria de URLs que dieron 404 para no reintentarlas en la misma sesión
const failedImageUrls = new Set<string>();

const ExoplanetCards: FC = () => {
  const [planets, setPlanets] = useState<Exoplanet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSrcs, setImageSrcs] = useState<(string | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const attemptFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = buildApiUrl(API_QUERY);
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const data: Exoplanet[] = await res.json();
        const withImgs = data.map((p) => ({
          ...p,
          image_url: buildNasaImageUrl(p.pl_name, p.pl_rade, p.pl_bmasse),
        }));
        setPlanets(withImgs);

        // Si estamos en producción (no localhost) usamos las URLs directas de la CDN/NASA
        // para cada planeta y dejamos que el <img> gestione el fallback si la URL falla.
        // En desarrollo seguimos prefetching a blobs para tener control sobre las imágenes.
        const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isProd) {
          setImageSrcs(withImgs.map((p) => p.image_url ?? BACKUP_IMG));
          return;
        }

        // Desarrollo: preparar array de imageSrcs con nulls; las cargaremos por página
        setImageSrcs(new Array(withImgs.length).fill(null));
        // almacenaremos blobs creados para revocarlos al desmontar
        // (no usar createdBlobs local aquí porque necesitamos revocarlos fuera)
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    attemptFetch();
  }, []);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(planets.length / PAGE_SIZE));
  // asegurar que la página actual sea válida si cambian los planets
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [planets.length, totalPages, currentPage]);

  // ref para blobs creados y evitar fugas de memoria
  const createdBlobsRef = useRef<string[]>([]);

  // helper: cargar imágenes para una página concreta (solo en dev)
  useEffect(() => {
    if (planets.length === 0) return;
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProd) return;

    let mounted = true;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(planets.length, start + PAGE_SIZE);

    const fetchImageFor = async (p: Exoplanet): Promise<string | null> => {
      const attempts = 3;
      const baseIdx = indexFromName(p.pl_name);
      for (let t = 0; t < attempts; t++) {
        const nextIdx = ((baseIdx + t) % MAX_NASA_INDEX) + 1;
        const candidate = buildNasaImageUrl(p.pl_name, p.pl_rade, p.pl_bmasse, nextIdx);
        if (failedImageUrls.has(candidate)) continue;
        try {
          const res = await fetch(candidate);
          if (!res.ok) {
            failedImageUrls.add(candidate);
            continue;
          }
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          createdBlobsRef.current.push(blobUrl);
          return blobUrl;
        } catch {
          failedImageUrls.add(candidate);
          continue;
        }
      }
      return BACKUP_IMG;
    };

    (async () => {
      const promises: Promise<void>[] = [];
      for (let i = start; i < end; i++) {
        if (imageSrcs[i]) continue; // ya cargada
        const idx = i;
        const p = planets[idx];
        const promise = fetchImageFor(p).then((src) => {
          if (!mounted) return;
          setImageSrcs((prev) => {
            const copy = prev.slice();
            copy[idx] = src ?? BACKUP_IMG;
            return copy;
          });
        });
        promises.push(promise);
      }
      await Promise.all(promises);
    })();

    return () => {
      mounted = false;
    };
  }, [currentPage, planets, imageSrcs]);

  // cleanup blobs al desmontar
  useEffect(() => {
    return () => {
      createdBlobsRef.current.forEach((b) => URL.revokeObjectURL(b));
      createdBlobsRef.current = [];
    };
  }, []);

  if (loading)
    return <p className="text-center text-slate-300">Cargando exoplanetas...</p>;
  if (error)
    return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-semibold text-white/90 mb-6 text-center">
        Exoplanetas recientes
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planets.slice((currentPage - 1) * PAGE_SIZE, (currentPage - 1) * PAGE_SIZE + PAGE_SIZE).map((e, idxRel) => {
          const idx = (currentPage - 1) * PAGE_SIZE + idxRel;
          return (
          <div
            key={e.pl_name}
            data-index={idx}
            className="bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-md rounded-xl p-6 border border-slate-600/30 hover:scale-[1.02] transition-transform"
          >
            {/* Imagen NASA dinámica (prefetched blob o fallback) */}
            <img
              src={imageSrcs[idx] || BACKUP_IMG}
              alt={e.pl_name}
              className="w-full h-40 object-cover rounded-lg mb-4 border border-slate-700/40"
              loading="lazy"
              data-plname={e.pl_name}
              data-plrade={String(e.pl_rade ?? '')}
              data-plbmasse={String(e.pl_bmasse ?? '')}
              data-trycount="0"
              onError={(ev) => {
                const img = ev.currentTarget as HTMLImageElement;
                // si ya es el BACKUP, no reintentar
                if (img.src === BACKUP_IMG) return;

                // intentar hasta 3 variantes (cambiar índice) antes de usar BACKUP
                const tryCount = Number(img.dataset.trycount || '0');
                const maxAttempts = 3;
                const plName = img.dataset.plname || '';
                const rade = img.dataset.plrade ? Number(img.dataset.plrade) : null;
                const bmasse = img.dataset.plbmasse ? Number(img.dataset.plbmasse) : null;

                if (tryCount >= maxAttempts) {
                  img.dataset.trycount = String(tryCount + 1);
                  img.src = BACKUP_IMG;
                  return;
                }

                const baseIdx = indexFromName(plName);
                const nextIdx = ((baseIdx + tryCount) % MAX_NASA_INDEX) + 1;
                const candidate = buildNasaImageUrl(plName, rade, bmasse, nextIdx);
                img.dataset.trycount = String(tryCount + 1);
                // asignar la nueva URL; onError será llamado de nuevo si falla
                img.src = candidate;
              }}
            />

            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Globe className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{e.pl_name}</h4>
                <div className="text-sm text-slate-300">
                  {e.hostname} • {e.sy_dist ?? "—"} ly
                </div>
              </div>
            </div>

            <p className="text-slate-200/80 mb-4 text-sm leading-relaxed">
              <strong className="text-white">Método:</strong> {e.discoverymethod} •{" "}
              <strong className="text-white">Año:</strong> {e.disc_year}
              <br />
              <strong className="text-white">Radio (R⊕):</strong>{" "}
              {e.pl_rade ?? "—"} •{" "}
              <strong className="text-white">Masa (M⊕):</strong>{" "}
              {e.pl_bmasse ?? "—"}
            </p>

            <button
              onClick={() => {
                const path = `/exoplaneta/${encodeURIComponent(e.pl_name)}`;
                history.pushState({ pl_name: e.pl_name }, '', path);
                // dispatch popstate so app-level listener can react
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md shadow-md hover:scale-105 transition-transform duration-200"
            >
              <Star className="w-4 h-4" />
              Explorar el exoplaneta
            </button>
          </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-slate-800 text-slate-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={`pg-${i+1}`}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-slate-800 text-slate-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      {/* Formulario para buscar/registrar tu propio exoplaneta */}
      <div className="mt-8">
        <ExoplanetSearchForm />
      </div>
      <div className="mt-4">
        <ExoplanetIdForm />
      </div>
    </div>
  );
};

export default ExoplanetCards;
