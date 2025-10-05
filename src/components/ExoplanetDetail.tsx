import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Globe, ExternalLink } from "lucide-react";

type Exoplanet = {
  pl_name: string;
  hostname: string;
  discoverymethod: string;
  disc_year: number;
  pl_rade: number | null;
  pl_bmasse: number | null;
  sy_dist: number | null;
};

const BACKUP_IMG =
  "https://assets.science.nasa.gov/dynamicimage/assets/science/astro/exo-explore/assets/content/planets/neptunelike-8.jpg?fit=clip&crop=faces%2Cfocalpoint&w=600";

const EYES_BASE = "https://eyes.nasa.gov/apps/exo/";

/** Convierte el nombre del exoplaneta a slug compatible con NASA Eyes.
 *  Ejemplos:
 *   "TOI-5799 b"     -> "TOI-5799_b"
 *   "Kepler-22 b"    -> "Kepler-22_b"
 *   "TRAPPIST-1 e"   -> "TRAPPIST-1_e"
 */
function toEyesSlug(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "_") // espacios -> guión bajo
      .replace(/[^\w-]/g, ""); // deja letras/números/_ y - (quita otros símbolos)
}

const ExoplanetDetail: FC<{ plName?: string; onClose?: () => void }> = ({
  plName,
  onClose,
}) => {
  const [planet, setPlanet] = useState<Exoplanet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // manejo del iframe
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [frameTimeout, setFrameTimeout] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const name =
      plName ??
      decodeURIComponent(
        window.location.pathname.replace("/exoplaneta/", "")
      );
    if (!name) return;
    setLoading(true);
    setError(null);

    const sql = `select pl_name,hostname,discoverymethod,disc_year,pl_rade,pl_bmasse,sy_dist from pscomppars where pl_name='${name}'`;
    const buildApiUrl = (query: string) => {
      const q = encodeURIComponent(query);
      // Preferir proxy serverless en /api/exoplanets. Si VITE_API_BASE está configurado, usarla.
      const meta = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
      const base = meta?.VITE_API_BASE || '';
      if (base) return `${base}/api/exoplanets?query=${q}&format=json`;
      return `/api/exoplanets?query=${q}&format=json`;
    };

    const url = buildApiUrl(sql);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Exoplanet[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          setPlanet(null);
          setError("No se encontró el exoplaneta");
        } else {
          setPlanet(data[0]);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [plName]);

  const eyesUrl = useMemo(() => {
    const name = planet?.pl_name ?? plName;
    if (!name) return "";
    const slug = toEyesSlug(name);
    // Hash route de NASA Eyes: #/planet/<slug>
    // encodeURIComponent por seguridad extra en el fragment
    return `${EYES_BASE}#/planet/${encodeURIComponent(slug)}`;
  }, [planet?.pl_name, plName]);

  // Timeout de seguridad por si el iframe no llega a disparar onLoad (bloqueo de embedding)
  useEffect(() => {
    setFrameLoaded(false);
    setFrameTimeout(false);
    if (!eyesUrl) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setFrameTimeout(true), 6000);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [eyesUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Detalle del Exoplaneta</h1>
          <div>
            <button
              onClick={() => {
                if (onClose) onClose();
                else history.back();
              }}
              className="px-4 py-2 bg-slate-800/60 rounded-md"
            >
              Volver
            </button>
          </div>
        </div>

        {loading && <p className="text-slate-300">Cargando...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}

        {planet && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna izquierda: info breve + imagen */}
            <div className="col-span-1">
              <img
                src={BACKUP_IMG}
                alt={planet.pl_name}
                className="w-full h-64 object-cover rounded-lg mb-4"
                loading="lazy"
              />
              <div className="flex gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <Globe className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h4 className="font-bold text-xl">{planet.pl_name}</h4>
                  <div className="text-sm text-slate-400">{planet.hostname}</div>
                </div>
              </div>

              <div className="mt-4 bg-slate-800/40 p-4 rounded-md text-sm text-slate-200/90">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Método</span>
                  <span className="text-white">{planet.discoverymethod}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Año</span>
                  <span className="text-white">{planet.disc_year}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Radio (R⊕)</span>
                  <span className="text-white">{planet.pl_rade ?? "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Masa (M⊕)</span>
                  <span className="text-white">{planet.pl_bmasse ?? "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Distancia (pc)</span>
                  <span className="text-white">{planet.sy_dist ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Columna derecha: IFRAME NASA EYES */}
            <div className="col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xl font-semibold">NASA Eyes — Vista interactiva</h2>
                {eyesUrl && (
                  <a
                    href={eyesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                  >
                    Abrir en pestaña nueva <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="relative w-full overflow-hidden rounded-lg border border-slate-700/50 bg-black/40">
                {/* Loader */}
                {!frameLoaded && !frameTimeout && (
                  <div className="absolute inset-0 grid place-items-center text-slate-300 text-sm">
                    Cargando simulación…
                  </div>
                )}

                {/* Fallback si el iframe está bloqueado o tarda demasiado */}
                {frameTimeout && !frameLoaded && (
                  <div className="p-4 text-sm text-slate-200">
                    No se pudo cargar el visor embebido.{" "}
                    {eyesUrl ? (
                      <>
                        Abre la vista directamente en{" "}
                        <a
                          href={eyesUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 underline underline-offset-4"
                        >
                          NASA Eyes
                        </a>
                        .
                      </>
                    ) : (
                      "URL no disponible."
                    )}
                  </div>
                )}

                {/* Iframe */}
                {eyesUrl && (
                  <iframe
                    title={`NASA Eyes — ${planet.pl_name}`}
                    src={eyesUrl}
                    // alto fijo cómodo; puedes cambiar por aspect-video si prefieres
                    className="w-full h-[520px]"
                    allow="fullscreen; autoplay; clipboard-read; clipboard-write"
                    // when load succeeds
                    onLoad={() => setFrameLoaded(true)}
                  />
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Nota: Algunos navegadores o políticas de sitio pueden bloquear el embebido.
                En ese caso, usa el enlace “Abrir en pestaña nueva”.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExoplanetDetail;
