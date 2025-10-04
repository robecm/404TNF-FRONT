import { FC } from 'react';
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

const EXAMPLES: Exoplanet[] = [
  {
    pl_name: 'TOI-5726.01',
    hostname: 'TOI-5726',
    discoverymethod: 'Transit',
    disc_year: 2024,
    pl_rade: 2.55400000,
    pl_bmasse: 7.05000000,
    sy_dist: 108.84800000,
  },
  {
    pl_name: 'Kepler-22b',
    hostname: 'Kepler-22',
    discoverymethod: 'Transit',
    disc_year: 2011,
    pl_rade: 2.4,
    pl_bmasse: null,
    sy_dist: 600,
  },
  {
    pl_name: 'Proxima Centauri b',
    hostname: 'Proxima Centauri',
    discoverymethod: 'Radial Velocity',
    disc_year: 2016,
    pl_rade: null,
    pl_bmasse: 1.27,
    sy_dist: 4.24,
  },
];

const ExoplanetExamples: FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-semibold text-white/90 mb-6 text-center">Ejemplos confirmados</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EXAMPLES.map((e, idx) => (
          <div
            key={e.pl_name}
            data-index={idx}
            className="scroll-card from-left bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-md rounded-xl p-6 border border-slate-600/30"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Globe className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{e.pl_name}</h4>
                <div className="text-sm text-slate-300">{e.hostname} • {e.sy_dist ?? '—'}</div>
              </div>
            </div>

            <p className="text-slate-200/80 mb-4 text-sm leading-relaxed">
              <strong className="text-white">Método:</strong> {e.discoverymethod} • <strong className="text-white">Año:</strong> {e.disc_year}
              <br />
              <strong className="text-white">Radio (R⊕):</strong> {e.pl_rade ?? '—'} • <strong className="text-white">Masa (M⊕):</strong> {e.pl_bmasse ?? '—'}
            </p>

            <div className="mt-auto">
              <button
                onClick={() => window.alert(`Explorar: ${e.pl_name}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md shadow-md hover:scale-105 transition-transform duration-200"
              >
                <Star className="w-4 h-4" />
                Explorar el exoplaneta
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExoplanetExamples;
