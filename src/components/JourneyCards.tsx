import { FC } from 'react';
import { Globe, Telescope, Orbit, Satellite } from 'lucide-react';

const JourneyCards: FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
      {/* Card 1 */}
      <div data-index={0} className="scroll-card from-left bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
        <div className="flex items-center gap-4 mb-4">
          <Globe className="w-12 h-12 text-cyan-400" />
          <h3 className="text-2xl font-bold text-cyan-100">¿Qué son?</h3>
        </div>
        <p className="text-cyan-50/80 leading-relaxed">
          Los exoplanetas son planetas que orbitan estrellas fuera de nuestro sistema solar. Desde el primer descubrimiento en 1995, hemos encontrado miles de estos mundos distantes.
        </p>
      </div>

      {/* Card 2 */}
      <div data-index={1} className="scroll-card from-right bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-md rounded-2xl p-8 border border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
        <div className="flex items-center gap-4 mb-4">
          <Telescope className="w-12 h-12 text-blue-400" />
          <h3 className="text-2xl font-bold text-blue-100">Detección</h3>
        </div>
        <p className="text-blue-50/80 leading-relaxed">
          Se detectan mediante métodos como el tránsito (cuando pasan frente a su estrella) y la velocidad radial (por el bamboleo de la estrella debido a la gravedad del planeta).
        </p>
      </div>

      {/* Card 3 */}
      <div data-index={2} className="scroll-card from-left bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
        <div className="flex items-center gap-4 mb-4">
          <Orbit className="w-12 h-12 text-purple-400" />
          <h3 className="text-2xl font-bold text-purple-100">Tipos</h3>
        </div>
        <p className="text-purple-50/80 leading-relaxed">
          Existen diversos tipos: desde gigantes gaseosos más grandes que Júpiter hasta planetas rocosos similares a la Tierra. Algunos están en la "zona habitable" de su estrella.
        </p>
      </div>

      {/* Card 4 */}
      <div data-index={3} className="scroll-card from-right bg-gradient-to-br from-pink-900/40 to-cyan-900/40 backdrop-blur-md rounded-2xl p-8 border border-pink-500/30 hover:border-pink-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
        <div className="flex items-center gap-4 mb-4">
          <Satellite className="w-12 h-12 text-pink-400" />
          <h3 className="text-2xl font-bold text-pink-100">Importancia</h3>
        </div>
        <p className="text-pink-50/80 leading-relaxed">
          El estudio de exoplanetas nos ayuda a entender la formación de sistemas planetarios y buscar condiciones para la vida más allá de la Tierra.
        </p>
      </div>
    </div>
  );
};

export default JourneyCards;
