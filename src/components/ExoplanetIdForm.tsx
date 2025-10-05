import { FC, useState, useEffect } from 'react';

type Source = 'kepler' | 'tess';

type Props = {
  onSubmit?: (payload: { id: string; source: Source }) => void;
};

const ExoplanetIdForm: FC<Props> = ({ onSubmit }) => {
  const [id, setId] = useState('');
  const [source, setSource] = useState<Source | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [plotUrl, setPlotUrl] = useState<string | null>(null);
  const [loadingPlot, setLoadingPlot] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);

  const validate = () => {
    const digits = id.replace(/\D/g, '');
    if (!digits) return 'Ingresa un identificador numérico (solo dígitos).';
    if (digits.length < 7 || digits.length > 15) return 'El ID debe tener entre 7 y 15 dígitos.';
    if (!source) return 'Selecciona la misión (Kepler o TESS).';
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    setSubmitting(true);
    setPlotError(null);
    const digits = id.replace(/\D/g, '');
    const payload = { id: digits, source: source as Source };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        // por defecto: llamar la API que devuelve la imagen del lightcurve y mostrarla
        setLoadingPlot(true);
        // construir URL: el backend espera MISSION en mayúsculas según el ejemplo
        const mission = String(payload.source).toUpperCase();
        const endpoint = `https://back-557899680969.us-south1.run.app/lightcurve/${encodeURIComponent(mission)}/${encodeURIComponent(payload.id)}`;
        const res = await fetch(endpoint, { method: 'GET', headers: { accept: 'application/json' } });
        if (!res.ok) {
          // manejar 404 de forma amigable para el usuario
          if (res.status === 404) {
            // intentar leer detalle para log, pero mostrar mensaje amigable al usuario
            res.json().then((j) => console.debug('Lightcurve 404 detail:', j)).catch(() => {});
            setPlotUrl(null);
            const missionDisplay = payload.source === 'kepler' ? 'Kepler' : 'TESS';
            setPlotError(`No se encontraron datos para el ID ${payload.id} en la misión ${missionDisplay}. Verifica el número e inténtalo de nuevo o prueba otro ID.`);
            setLoadingPlot(false);
            setSubmitting(false);
            return;
          }
          const txt = await res.text().catch(() => res.statusText || 'Error');
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        const blob = await res.blob();
        // crear URL para mostrar la imagen
        const url = URL.createObjectURL(blob);
        // revocar la anterior si existía
        if (plotUrl) URL.revokeObjectURL(plotUrl);
        setPlotUrl(url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Error al procesar.');
      setPlotError(msg || 'Error al recuperar el gráfico.');
    } finally {
      setSubmitting(false);
      setLoadingPlot(false);
    }
  };

  // cleanup: revocar blob URL cuando el componente se desmonte o cambie
  useEffect(() => {
    return () => {
      if (plotUrl) URL.revokeObjectURL(plotUrl);
    };
  }, [plotUrl]);

  return (
    <div className="mt-10 bg-gradient-to-br from-black/30 to-slate-900/40 p-6 rounded-xl border border-slate-700/30">
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Buscar por ID de misión</h3>
      <p className="text-sm text-slate-400 mb-4">Introduce un identificador y selecciona la misión para ir al detalle del objeto.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
        <div>
          <div className="text-sm text-slate-300 mb-1">ID del objeto</div>
          <input
            value={id}
            onChange={(e) => {
              // aceptar solo dígitos y limitar la longitud a 15
              const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 15);
              setId(onlyDigits);
            }}
            placeholder="ej. 1234567"
            inputMode="numeric"
            pattern="\d{7,15}"
            aria-describedby="id-help"
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white placeholder:text-slate-400 border border-slate-700/30"
          />
          <p id="id-help" className="text-xs text-slate-500 mt-1">Solo dígitos. Longitud requerida: 7–15 caracteres.</p>
        </div>

        <div>
          <div className="text-sm text-slate-300 mb-1">Misión</div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
            className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700/30"
          >
            <option value="">Seleccionar...</option>
            <option value="kepler">Kepler</option>
            <option value="tess">TESS</option>
          </select>
        </div>

        <div className="md:col-span-2">
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>

        <div className="md:col-span-2 flex items-center">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md shadow disabled:opacity-60"
          >
            {submitting ? 'Procesando...' : 'Buscar'}
          </button>
        </div>
      </form>
      <div className="mt-4">
        {loadingPlot && <div className="text-sm text-slate-300">Cargando gráfico...</div>}
        {plotError && <div className="text-sm text-red-400 mt-2">{plotError}</div>}
        {plotUrl && (
          <div className="mt-3">
            <img src={plotUrl} alt={`Lightcurve ${source} ${id}`} className="w-full h-auto rounded-md border border-slate-700/20" />
          </div>
        )}
      </div>
      <div className="mt-6 bg-slate-900/30 p-4 rounded-md border border-slate-700/20">
        <h4 className="text-lg font-semibold text-white mb-2">¿Qué muestra la gráfica?</h4>
        <p className="text-sm text-slate-300 mb-2">La gráfica muestra el brillo (flujo) de la estrella a lo largo del tiempo.</p>

        <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1 mb-3">
          <li><strong>Eje Y (Flux):</strong> Es el brillo de la estrella. El valor 1.0 representa el brillo normal de la estrella.</li>
          <li><strong>Eje X (Time):</strong> Es el paso del tiempo en días.</li>
          <li><strong>Puntos Grises:</strong> Son las mediciones individuales de brillo tomadas por el telescopio. Su dispersión se conoce como "ruido".</li>
          <li><strong>Línea Azul:</strong> Es un promedio de las mediciones individuales. Esta línea suaviza el ruido y revela la tendencia principal.</li>
          <li><strong>Transito (U):</strong> La característica más importante es la caída en forma de "U" en el centro. Esto es el tránsito: el momento en que un exoplaneta pasó por delante de la estrella, bloqueando una pequeña parte de su luz y causando una disminución temporal en su brillo.</li>
        </ul>

        <div className="text-xs text-slate-400">
          <div className="font-semibold">Referencia:</div>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>
              MAST (Mikulski Archive for Space Telescopes). Accedido a través de la librería lightkurve.{' '}
              <a href="https://archive.stsci.edu/" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">https://archive.stsci.edu/</a>
            </li>
            <li>
              Malik, A., Moster, B. P., & Obermeier, C. (2022). "Exoplanet detection using machine learning". MNRAS, 513(4), 5505–5516.{' '}
              <a href="https://doi.org/10.1093/mnras/stab3692" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">https://doi.org/10.1093/mnras/stab3692</a>
            </li>
            <li>
              Luz, T. S. F., Braga, R. A. S., & Ribeiro, E. R. (2024). "Assessment of Ensemble-Based Machine Learning Algorithms for Exoplanet Identification". Electronics, 13(19), 3950.{" "}
              <a href="https://doi.org/10.3390/electronics13193950" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">https://doi.org/10.3390/electronics13193950</a>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ExoplanetIdForm;
