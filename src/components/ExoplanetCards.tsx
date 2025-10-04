import { useEffect, useState, FC } from 'react';
import { Globe, Star } from 'lucide-react';

type Exoplanet = {
  pl_name: string;
  hostname: string;
  discoverymethod: string;
  disc_year: number;
  pl_rade: number | null;
  pl_bmasse: number | null;
  sy_dist: number | null;
};

const API_URL =
  '/api/exoplanets?query=select+top+12+pl_name,hostname,discoverymethod,disc_year,pl_rade,pl_bmasse,sy_dist+from+pscomppars+order+by+disc_year+desc&format=json';

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
      .then((data) => setPlanets(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-slate-300">Cargando exoplanetas...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

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
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Globe className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{e.pl_name}</h4>
                <div className="text-sm text-slate-300">{e.hostname} • {e.sy_dist ?? '—'} ly</div>
              </div>
            </div>

            <p className="text-slate-200/80 mb-4 text-sm leading-relaxed">
              <strong className="text-white">Método:</strong> {e.discoverymethod} •{' '}
              <strong className="text-white">Año:</strong> {e.disc_year}
              <br />
              <strong className="text-white">Radio (R⊕):</strong> {e.pl_rade ?? '—'} •{' '}
              <strong className="text-white">Masa (M⊕):</strong> {e.pl_bmasse ?? '—'}
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
