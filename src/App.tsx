import { useState, useEffect } from 'react';
import { Rocket, Sparkles, Star, Globe, Telescope, Orbit, Satellite } from 'lucide-react';
import ExoplanetExamples from './components/ExoplanetExamples';
import ExoplanetCards from './components/ExoplanetCards';
import ExoplanetDetail from './components/ExoplanetDetail';

interface StarType {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

function App() {
  const [stars, setStars] = useState<StarType[]>([]);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [routePlanet, setRoutePlanet] = useState<string | null>(null);

  useEffect(() => {
    // Listen for history navigation to show detail pages under /exoplaneta/:name
    const checkRoute = () => {
      const p = window.location.pathname;
      if (p.startsWith('/exoplaneta/')) {
        setRoutePlanet(decodeURIComponent(p.replace('/exoplaneta/', '')));
      } else {
        setRoutePlanet(null);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // NOTE: Do not return early here because hooks below must run in the same order.

  useEffect(() => {
    const generateStars = () => {
      const newStars: StarType[] = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          duration: Math.random() * 3 + 2,
          delay: Math.random() * 2,
        });
      }
      setStars(newStars);
    };

    generateStars();

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Observador para animar las cards al hacer scroll (slide desde laterales)
  useEffect(() => {
    if (!isJourneyStarted) return;

    const cards = document.querySelectorAll<HTMLElement>('.scroll-card');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            // aplicar un pequeño stagger basado en data-index para efecto más natural
            const idx = Number(el.dataset.index ?? 0);
            el.style.animationDelay = `${idx * 120}ms`;
            el.classList.add('in-view');
            // una vez animada, dejamos de observar para mejorar rendimiento
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    cards.forEach((c) => observer.observe(c));

    return () => observer.disconnect();
  }, [isJourneyStarted]);

  // If routePlanet is active, render only the detail page as a standalone route
  if (routePlanet) {
    return (
      <ExoplanetDetail
        plName={routePlanet}
        onClose={() => {
          history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      />
    );
  }

  return (
    <>
    <div className="relative min-h-screen bg-gradient-to-b from-black via-indigo-950 to-purple-950 overflow-hidden">
  {/* Animated Stars */}
  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${isJourneyStarted ? 'opacity-0' : 'opacity-100'}`}>
        {!isJourneyStarted && stars.map((star) => {
          const centerX = 50;
          const centerY = 50;
          const txStart = `${(star.x - centerX) * 10}px`;
          const tyStart = `${(star.y - centerY) * 10}px`;

          const parallaxX = (mousePosition.x - 50) * (star.size / 10) * 0.5;
          const parallaxY = (mousePosition.y - 50) * (star.size / 10) * 0.5;

          return (
            <div
              key={star.id}
              className="absolute rounded-full bg-white star-zoom shadow-lg shadow-white/50 transition-transform duration-300 ease-out"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
                transform: `translate(${parallaxX}px, ${parallaxY}px)`,
                // @ts-expect-error allow custom css variables
                '--tx-start': txStart,
                '--ty-start': tyStart,
              }}
            />
          );
        })}
      </div>

      {/* Content */}
      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-4 transition-all duration-2000 ${isJourneyStarted ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="text-center space-y-8 max-w-4xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8 animate-float">
            <div className="relative">
              <Rocket className="w-24 h-24 text-cyan-400" strokeWidth={1.5} />
              <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-fade-in">
            Space Project
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-cyan-100 animate-fade-in-delay">
            Explore the infinite cosmos and discover the wonders of the universe
          </p>

          {/* Stars decoration */}
          <div className="flex justify-center gap-4 animate-fade-in-delay-2">
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-twinkle" />
            <Star className="w-8 h-8 text-yellow-200 fill-yellow-200 animate-twinkle" style={{ animationDelay: '0.5s' }} />
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-twinkle" style={{ animationDelay: '1s' }} />
          </div>

          {/* CTA Button */}
          <div className="pt-8 animate-fade-in-delay-3">
            <button
              onClick={() => setIsJourneyStarted(true)}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold rounded-full hover:scale-105 transition-transform duration-300 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70"
            >
              Begin Your Journey
            </button>
          </div>
        </div>
      </div>

  {/* Bottom gradient overlay removed as requested */}

      {/* Journey Started Screen */}
      {isJourneyStarted && !routePlanet && (
        <>
          {/* Background stars with mouse movement */}
          <div className="absolute inset-0 z-10">
            {stars.map((star) => {
              const parallaxX = (mousePosition.x - 50) * (star.size / 5) * 1.5;
              const parallaxY = (mousePosition.y - 50) * (star.size / 5) * 1.5;

              return (
                <div
                  key={`welcome-${star.id}`}
                  className="absolute rounded-full bg-white shadow-lg shadow-white/30 transition-transform duration-300 ease-out"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    transform: `translate(${parallaxX}px, ${parallaxY}px)`,
                    opacity: 0.6,
                  }}
                />
              );
            })}
          </div>

          {/* Content Container */}
          <div className="absolute inset-0 z-20 flex flex-col items-center px-4 py-12 overflow-y-auto">
            {/* Title at top */}
            <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-text-zoom mb-6 mt-8">
              Exoplanetas
            </h2>

            {/* Imagen central de exoplaneta */}
            <div className="w-full flex justify-center mb-12">
              <img
                src="/static/exoplanet.png"
                alt="Exoplaneta"
                className="w-40 md:w-56 lg:w-72 rounded-lg shadow-2xl object-contain animate-fade-in"
              />
            </div>

            {/* Cards Grid */}
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

            {/* Dynamic Exoplanet Cards (fetched from remote via proxy) */}
            <div className="w-full max-w-6xl">
              <ExoplanetCards />
            </div>

            {/* Ejemplos de exoplanetas (debajo de las cards) */}
            <div className="w-full max-w-6xl mt-12">
              <ExoplanetExamples />
            </div>
          </div>
        </>
      )}

    </div>
    </>
  );
}

export default App;
