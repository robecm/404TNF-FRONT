import { FC } from 'react';
import { Globe, Star } from 'lucide-react';

type Exoplanet = {
  id: string;
  name: string;
  host: string;
  distance: string;
  description: string;
};

const EXAMPLES: Exoplanet[] = [
];

const ExoplanetExamples: FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EXAMPLES.map((e, idx) => (
          <div
            key={e.id}
            data-index={idx}
            className="scroll-card from-left bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-md rounded-xl p-6 border border-slate-600/30"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Globe className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{e.name}</h4>
                <div className="text-sm text-slate-300">{e.host} • {e.distance}</div>
              </div>
            </div>

            <p className="text-slate-200/80 mb-4 text-sm leading-relaxed">{e.description}</p>

            <div className="mt-auto">
              <button
                onClick={() => window.alert(`Explorar: ${e.name}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md shadow-md hover:scale-105 transition-transform duration-200"
              >
                <Star className="w-4 h-4" />
                Empieza a explorar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExoplanetExamples;
