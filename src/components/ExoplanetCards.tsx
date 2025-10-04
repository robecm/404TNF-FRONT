import { useEffect, useState, FC } from "react";
import { Globe, Star } from "lucide-react";

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

const API_URL =
  "/api/exoplanets?query=select+top+12+pl_name,hostname,discoverymethod,disc_year,pl_rade,pl_bmasse,sy_dist+from+pscomppars+order+by+disc_year+desc&format=json";

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
function indexFromName(name: string, max = 12): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return (h % max) + 1;
}

/** Construye URL dinámica desde NASA assets */
function buildNasaImageUrl(
  plName: string,
  rade: number | null,
  bmasse: number | null
): string {
  const type = classifyPlanetType(rade, bmasse);
  const idx = indexFromName(plName, 12);
  const params = "fit=clip&crop=faces%2Cfocalpoint&w=300";
  return `${NASA_IMG_BASE}/${type}-${idx}.jpg?${params}`;
}

const ExoplanetCards: FC = () => {
  const [planets, setPlanets] = useState<Exoplanet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Exoplanet[]) => {
        const withImgs = data.map((p) => ({
          ...p,
          image_url: buildNasaImageUrl(p.pl_name, p.pl_rade, p.pl_bmasse),
        }));
        setPlanets(withImgs);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
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
        {planets.map((e, idx) => (
          <div
            key={e.pl_name}
            data-index={idx}
            className="bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-md rounded-xl p-6 border border-slate-600/30 hover:scale-[1.02] transition-transform"
          >
            {/* Imagen NASA dinámica (con fallback seguro) */}
            <img
              src={e.image_url || BACKUP_IMG}
              alt={e.pl_name}
              onError={(ev) => {
                ev.currentTarget.src = BACKUP_IMG;
              }}
              className="w-full h-40 object-cover rounded-lg mb-4 border border-slate-700/40"
              loading="lazy"
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
              onClick={() => window.alert(`Explorar: ${e.pl_name}`)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md shadow-md hover:scale-105 transition-transform duration-200"
            >
              <Star className="w-4 h-4" />
              Explorar el exoplaneta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExoplanetCards;
