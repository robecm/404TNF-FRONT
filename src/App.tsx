import { useState, useEffect, useRef } from 'react';
import { Rocket, Sparkles, Star } from 'lucide-react';
import ExoplanetExamples from './components/ExoplanetExamples';
import ExoplanetCards from './components/ExoplanetCards';
import JourneyCards from './components/JourneyCards';
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
  const [showJourneyCards, setShowJourneyCards] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [routePlanet, setRoutePlanet] = useState<string | null>(null);
  const hadDetailRef = useRef(false);
  const [exoplanetImgSrc, setExoplanetImgSrc] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const localPath = `${import.meta.env.BASE_URL || '/'}src/static/exoplanet.png`;
    const nasaBackup = 'https://assets.science.nasa.gov/dynamicimage/assets/science/astro/exo-explore/assets/content/planets/neptunelike-8.jpg?fit=clip&crop=faces%2Cfocalpoint&w=300';

    // Bundled asset URL (pacquetizado por Vite). Se usa como último recurso y no genera 404s externos.
    const bundledLocal = new URL('./static/exoplanet.png', import.meta.url).href;

    let createdBlobUrl: string | null = null;
    (async () => {
      try {
        // 1) Intentar cargar la imagen local (posible ruta pública)
        const resLocal = await fetch(localPath);
        if (resLocal.ok) {
          const blob = await resLocal.blob();
          if (!mounted) return;
          createdBlobUrl = URL.createObjectURL(blob);
          setExoplanetImgSrc(createdBlobUrl);
          return;
        }

        // 2) Si falla, intentar obtener la imagen desde la CDN de la NASA mediante fetch.
        // Hacemos fetch explícito para que, si responde 404, lo manejemos sin asignar la URL
        // directamente al <img> (evita que el navegador haga la petición y muestre 404 en consola).
        try {
          const resNasa = await fetch(nasaBackup);
          if (resNasa.ok) {
            const blob = await resNasa.blob();
            if (!mounted) return;
            createdBlobUrl = URL.createObjectURL(blob);
            setExoplanetImgSrc(createdBlobUrl);
            return;
          }
        } catch {
          // ignorar errores de fetch a NASA; caeremos al fallback empaquetado
        }

        // 3) Fallback final: usar la imagen empaquetada (no genera peticiones externas que puedan 404)
        if (!mounted) return;
        setExoplanetImgSrc(bundledLocal);
      } catch {
        if (!mounted) return;
        setExoplanetImgSrc(bundledLocal);
      }
    })();

    return () => {
      mounted = false;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, []);

  useEffect(() => {
    // Listen for history navigation to show detail pages under /exoplaneta/:name
    // We want to distinguish initial load (no popstate event) from user navigation
    const checkRoute = (ev?: PopStateEvent) => {
      const p = window.location.pathname;
  // depuración: checkRoute invoked (silenciado en producción)
      if (p.startsWith('/exoplaneta/')) {
        setRoutePlanet(decodeURIComponent(p.replace('/exoplaneta/', '')));
      } else {
        setRoutePlanet(null);
        // Si viene de una navegación (popstate) o ya visitó un detalle antes,
        // queremos volver a mostrar la pantalla de journey
        if ((ev && ev.type === 'popstate') || hadDetailRef.current) {
          setShowJourneyCards(true);
        }
      }
    };

    // llamada inicial sin evento
    checkRoute();
    // on popstate pasaremos el event para que la función pueda detectar navegación atrás/adelante
    window.addEventListener('popstate', checkRoute as EventListener);
    return () => window.removeEventListener('popstate', checkRoute as EventListener);
  }, []);

  // Listener adicional: si el usuario navega con el botón Atrás del navegador
  // y la ruta resultante es '/', aseguramos que se muestre la pantalla de 'journey'
  useEffect(() => {
    const onPopShowJourney = () => {
      if (window.location.pathname === '/') setShowJourneyCards(true);
    };
    window.addEventListener('popstate', onPopShowJourney);
    return () => window.removeEventListener('popstate', onPopShowJourney);
  }, []);

  // Si el usuario visitó un detalle y luego regresa (routePlanet pasa a null),
  // activamos la pantalla de journey. Evita que esto ocurra en la carga inicial.
  useEffect(() => {
    if (routePlanet) {
      hadDetailRef.current = true;
    } else if (hadDetailRef.current && !routePlanet) {
      setShowJourneyCards(true);
      hadDetailRef.current = false;
    }
  }, [routePlanet]);

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
          // Al cerrar detalle, volvemos a la ruta raíz y mostramos la pantalla de 'journey'
          history.pushState({}, '', '/');
          // mostrar solo las journey cards bajo el hero (no activar la pantalla completa)
          setShowJourneyCards(true);
          // asegurarnos de que la pantalla completa no esté activa
          setIsJourneyStarted(false);
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
            Exoptolemy
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
              Empieza a explorar
            </button>
          </div>
          {/* Journey cards (visible when user returns from detail) */}
          {showJourneyCards && (
            <div className="mt-12">
              <JourneyCards />
            </div>
          )}
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
                src={exoplanetImgSrc || `${import.meta.env.BASE_URL || '/'}src/static/exoplanet.png`}
                alt="Exoplaneta"
                className="w-40 md:w-56 lg:w-72 rounded-lg shadow-2xl object-contain animate-fade-in"
              />
            </div>

            {/* Cards Grid (moved to JourneyCards component) */}
            <JourneyCards />

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
