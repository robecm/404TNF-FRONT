import { FC, useEffect, useState } from 'react';

type Payload = {
  koi_prad: number;
  koi_model_snr: number;
  koi_depth: number;
  koi_impact: number;
  koi_duration: number;
  koi_period?: number;
  koi_time0bk?: number;
  koi_teq?: number;
  koi_insol?: number;
  koi_steff?: number;
  koi_slogg?: number;
  koi_srad?: number;
};

const PosibleExo: FC<{ name: string }> = ({ name }) => {
  const [data, setData] = useState<Payload | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  // el chat local se muestra siempre en esta página (sin botón flotante)
  // inline chat at bottom of PosibleExo
  const [inlineMessages, setInlineMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [inlineInput, setInlineInput] = useState('');
  const [inlineLoading, setInlineLoading] = useState(false);

  const sendInline = async () => {
    const text = inlineInput.trim();
    if (!text) return;
    const user = { id: 'u' + Date.now(), role: 'user' as const, text };
    setInlineMessages((s) => [...s, user]);
    setInlineInput('');
    setInlineLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      if (!res.ok) {
        setInlineMessages((s) => [...s, { id: 'a' + Date.now(), role: 'assistant', text: 'No se pudo contactar al proxy de Gemini. Respuesta simulada.' }]);
      } else {
        const json = await res.json();
        setInlineMessages((s) => [...s, { id: 'a' + Date.now(), role: 'assistant', text: json.reply ?? 'Respuesta inesperada del proxy.' }]);
      }
    } catch {
      setInlineMessages((s) => [...s, { id: 'a' + Date.now(), role: 'assistant', text: 'Error de red al contactar al proxy. Configure un endpoint /api/gemini en su servidor.' }]);
    } finally {
      setInlineLoading(false);
    }
  };
  const [classification, setClassification] = useState<'candidato' | 'falso' | null>('candidato');
  const [displayProbs, setDisplayProbs] = useState<{ exoplanet: number; falsePositive: number }>({ exoplanet: 0, falsePositive: 0 });
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{ veredicto: string; confianza: number } | null>(null);

  // componente LocalGeminiChat eliminado: el chat fijo modal se ha quitado por petición del usuario

  useEffect(() => {
    const slug = encodeURIComponent(name);
    const storageKey = `possibleExo::${slug}`;
    let parsed: Payload | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey) || sessionStorage.getItem('possibleExo');
      if (raw) parsed = JSON.parse(raw) as Payload;
    } catch {
      // ignore
    }
    setData(parsed);
    // usar CDN público por default
    const cdn = 'https://cdn.pixabay.com/photo/2024/09/23/08/48/planet-9068292_960_720.png';
    setImgSrc(cdn);
  }, [name]);

  // cuando haya data (payload) pedir la prediccion al backend proxy
  useEffect(() => {
    const run = async () => {
      if (!data) return;
      setPrediction(null);
      setPredicting(true);
      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            koi_period: data.koi_period ?? 0,
            koi_time0bk: data.koi_time0bk ?? 0,
            koi_impact: data.koi_impact ?? 0,
            koi_duration: data.koi_duration ?? 0,
            koi_depth: data.koi_depth ?? 0,
            koi_prad: data.koi_prad ?? 0,
            koi_teq: data.koi_teq ?? 0,
            koi_insol: data.koi_insol ?? 0,
            koi_model_snr: data.koi_model_snr ?? 0,
            koi_steff: data.koi_steff ?? 0,
            koi_slogg: data.koi_slogg ?? 0,
            koi_srad: data.koi_srad ?? 0,
          }),
        });
        if (!res.ok) {
          // attempt to read response body for diagnostics
          let bodyText = '';
          try {
            bodyText = await res.text();
          } catch {
            bodyText = '<unable to read body>';
          }
          console.error('Predict upstream error', res.status, bodyText);
          // store a minimal marker in the UI but keep detailed info in console
          setPrediction({ veredicto: 'ERROR', confianza: 0 });
        } else {
          const json = await res.json();
          // expect { veredicto: string, confianza: number }
          setPrediction({ veredicto: String(json.veredicto ?? 'UNKNOWN'), confianza: Number(json.confianza ?? 0) });
        }
      } catch (e) {
        console.error('Predict fetch error', e);
        setPrediction({ veredicto: 'ERROR', confianza: 0 });
      } finally {
        setPredicting(false);
      }
    };
    void run();
  }, [data]);

  // calcula probabilidades simples (heurística ligera) a partir de los campos disponibles
  const computeProbabilities = (p: Payload | null) => {
    if (!p) return { exoplanet: 50, falsePositive: 50 };
    const snr = typeof p.koi_model_snr === 'number' ? p.koi_model_snr : 7;
    const prad = typeof p.koi_prad === 'number' ? p.koi_prad : 1.5;
    // transformar SNR a [0,1] con una logística centrada en 7
    const s = 1 / (1 + Math.exp(-(snr - 7) / 3));
    // tamaño "ideal" cerca de 1.5 R⊕ aumenta probabilidad
    const sizeScore = Math.exp(-Math.abs((prad - 1.5) / 1.5));
    let exo = s * 0.7 + sizeScore * 0.3;
    exo = Math.max(0, Math.min(1, exo));
    const exPct = Math.round(exo * 100);
    return { exoplanet: exPct, falsePositive: 100 - exPct };
  };

  // actualizar probabilidades cuando cambian los datos
  useEffect(() => {
    const newProbs = computeProbabilities(data);
    // animación: reiniciar a 0 y después establecer el valor real para que la barra haga la transición
    setDisplayProbs({ exoplanet: 0, falsePositive: 0 });
    const t = setTimeout(() => setDisplayProbs(newProbs), 80);
    return () => clearTimeout(t);
  }, [data]);

  // (Se eliminó la puntuación heurística por decisión del usuario)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-indigo-950 to-purple-950 text-white p-8">
      <div className="max-w-4xl mx-auto bg-slate-900/40 p-6 rounded-lg border border-slate-700">
        <h2 className="text-3xl font-bold mb-4">Posible Exoplaneta: {decodeURIComponent(name)}</h2>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex justify-center">
            <img src={imgSrc} alt="Exoplaneta" className="w-48 h-48 object-contain rounded-lg shadow-xl" />
          </div>
          <div className="w-full md:w-2/3">
            {data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><strong>koi_prad:</strong> {data.koi_prad} <span className="text-slate-400">R⊕</span></p>
                  <p><strong>koi_model_snr:</strong> {data.koi_model_snr} <span className="text-slate-400">(SNR)</span></p>
                  <p><strong>koi_depth:</strong> {data.koi_depth} <span className="text-slate-400">ppm</span></p>
                  <p><strong>koi_impact:</strong> {data.koi_impact} <span className="text-slate-400">(0–1)</span></p>
                  <p><strong>koi_duration:</strong> {data.koi_duration} <span className="text-slate-400">horas</span></p>
                  {data.koi_period !== undefined && <p><strong>koi_period:</strong> {data.koi_period} <span className="text-slate-400">días</span></p>}
                </div>

                <div className="space-y-2">
                  {data.koi_time0bk !== undefined && <p><strong>koi_time0bk:</strong> {data.koi_time0bk} <span className="text-slate-400">(BKJD)</span></p>}
                  {data.koi_teq !== undefined && <p><strong>koi_teq:</strong> {data.koi_teq} <span className="text-slate-400">K</span></p>}
                  {data.koi_insol !== undefined && <p><strong>koi_insol:</strong> {data.koi_insol} <span className="text-slate-400">× Tierra</span></p>}
                  {data.koi_steff !== undefined && <p><strong>koi_steff:</strong> {data.koi_steff} <span className="text-slate-400">K</span></p>}
                  {data.koi_slogg !== undefined && <p><strong>koi_slogg:</strong> {data.koi_slogg} <span className="text-slate-400">(log g, cm/s²)</span></p>}
                  {data.koi_srad !== undefined && <p><strong>koi_srad:</strong> {data.koi_srad} <span className="text-slate-400">R☉</span></p>}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300">No se encontraron datos del formulario para este objeto. Tal vez la sesión expiró o el envío fue en otra sesión.</div>
            )}
          </div>
        </div>
      </div>
        {/* Prediction cards: clasificación y gráfica */}
        <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2">Opciones</h3>
            <p className="text-sm text-slate-300 mb-3">Marca si crees que este objeto es un candidato o un falso positivo.</p>
            <div className="flex items-center gap-3">
              <label className={`px-3 py-2 rounded cursor-pointer ${classification === 'candidato' ? 'bg-cyan-600 text-black' : 'bg-slate-800 text-slate-200'}`}>
                <input className="hidden" type="radio" name="classification" value="candidato" checked={classification === 'candidato'} onChange={() => setClassification('candidato')} />
                Candidato
              </label>
              <label className={`px-3 py-2 rounded cursor-pointer ${classification === 'falso' ? 'bg-rose-600 text-black' : 'bg-slate-800 text-slate-200'}`}>
                <input className="hidden" type="radio" name="classification" value="falso" checked={classification === 'falso'} onChange={() => setClassification('falso')} />
                Falso positivo
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Esto no cambia los datos del servidor; solo es una etiqueta local para tu revisión.</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2">Probabilidad del Modelo</h3>
            <p className="text-sm text-slate-300 mb-3">Estimación local (heurística) de la probabilidad de que sea un exoplaneta vs falso positivo.</p>

            <div className="flex items-center gap-4">
              {/* Pie / donut chart */}
              <div className="flex-shrink-0">
                {(() => {
                  const pct = classification === 'falso' ? displayProbs.falsePositive : displayProbs.exoplanet;
                  const size = 96;
                  const stroke = 12;
                  const radius = (size - stroke) / 2;
                  const cx = size / 2;
                  const cy = size / 2;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference * (1 - (pct / 100));
                  const color = classification === 'falso' ? '#fb7185' : '#06b6d4'; // rose-400 or cyan-400
                  return (
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="false" role="img">
                      <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
                        </filter>
                      </defs>
                      {/* background circle */}
                      <circle cx={cx} cy={cy} r={radius} stroke="#0f172a" strokeWidth={stroke} fill="none" />
                      {/* progress arc */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 800ms ease' }}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        filter="url(#shadow)"
                      />
                      {/* inner circle to create donut */}
                      <circle cx={cx} cy={cy} r={radius - stroke / 2} fill="rgba(2,6,23,0.6)" />
                      {/* center text */}
                      <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="#ffffff" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>
                        {pct}%
                      </text>
                      <text x="50%" y="66%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fill="#ffffff" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system' }}>
                        {classification === 'falso' ? 'Falso positivo' : 'Exoplaneta'}
                      </text>
                    </svg>
                  );
                })()}
              </div>

              <div className="flex-1">
                <div className="text-sm mb-1">Porcentaje mostrado para la clase seleccionada:</div>
                <div className="text-xs text-slate-400">Actualizado localmente cuando se carga la página. Cambia la opción para ver la clase correspondiente.</div>
              </div>
            </div>
            {/* Prediction result from model backend */}
            <div className="mt-4">
              {predicting && <div className="text-sm text-slate-400">Obteniendo predicción del modelo...</div>}
              {prediction && (
                <div className="mt-2 p-3 bg-slate-800/60 rounded">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Veredicto del modelo</div>
                    <div className={`font-semibold ${prediction.veredicto.toLowerCase().includes('false') ? 'text-rose-400' : 'text-cyan-300'}`}>{prediction.veredicto}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="text-xs text-slate-400">Confianza</div>
                    <div className="font-mono">{Math.round(prediction.confianza * 100)}%</div>
                    <div className="flex-1 bg-slate-700 rounded h-2 overflow-hidden">
                      <div className="h-2 bg-cyan-500" style={{ width: `${Math.round(prediction.confianza * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
  {/* Chat local fijo eliminado */}

      {/* Inline prompt similar a ChatGPT al final de la página */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-700">
          <h4 className="text-sm font-semibold mb-2">Preguntar sobre este objeto</h4>
          <div className="mb-3 max-h-40 overflow-y-auto space-y-2" aria-live="polite">
            {inlineMessages.length === 0 && <div className="text-xs text-slate-400">Haz una pregunta y Gemini responderá aquí.</div>}
            {inlineMessages.map((m) => (
              <div key={m.id} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`${m.role === 'user' ? 'bg-cyan-600 text-black inline-block' : 'bg-slate-700 text-slate-100 inline-block'} px-3 py-2 rounded`}>{m.text}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={inlineInput}
              onChange={(e) => setInlineInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendInline(); }}
              className="flex-1 px-3 py-2 rounded bg-slate-900 text-white text-sm"
              placeholder="Escribe tu pregunta (ej. ¿Qué significa koi_teq?)"
              aria-label="Pregunta a Gemini"
            />
            <button onClick={() => sendInline()} disabled={inlineLoading || !inlineInput.trim()} className="px-3 py-2 bg-cyan-600 rounded text-black text-sm">
              {inlineLoading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosibleExo;
