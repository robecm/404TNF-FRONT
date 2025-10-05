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
  // classification state removed (UI simplified)
  // displayProbs and heuristic removed — we rely on server prediction only
  // prediction: normalized to { verdict, confidence }
  const [prediction, setPrediction] = useState<{ verdict: string; confidence: number } | null>(null);

  // componente LocalGeminiChat eliminado: el chat fijo modal se ha quitado por petición del usuario

  useEffect(() => {
    const storageKey = `possibleExo::${name}`;
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
          setPrediction({ verdict: 'ERROR', confidence: 0 });
        } else {
          const json = await res.json();
          // accept both {verdict,confidence} and legacy {veredicto,confianza}
          const verdict = String(json.verdict ?? json.veredicto ?? 'UNKNOWN');
          const confidence = Number(json.confidence ?? json.confianza ?? 0) || 0;
          setPrediction({ verdict, confidence });
        }
      } catch (e) {
        console.error('Predict fetch error', e);
        setPrediction({ verdict: 'ERROR', confidence: 0 });
      } finally {
        // finished
      }
    };
    void run();
  }, [data]);

  // (Se eliminó la puntuación heurística y la visualización local por petición del usuario)

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

      {/* Prediction card (server result) */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          {prediction && (
            <div className="mt-0 p-0">
              <div className="mt-0 p-3 bg-slate-800/60 rounded border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Resultado del modelo</div>
                  <div className={`font-semibold ${(() => { const v = prediction.verdict.toLowerCase(); return v.includes('false') || v.includes('false positive') ? 'text-rose-400' : 'text-cyan-300'; })()}`}>{prediction.verdict}</div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-xs text-slate-400">Confianza</div>
                  <div className="font-mono">{Math.round((prediction.confidence || 0) * 100)}%</div>
                  <div className="flex-1 bg-slate-700 rounded h-2 overflow-hidden">
                    <div className="h-2 bg-cyan-500" style={{ width: `${Math.max(0, Math.min(100, (prediction.confidence || 0) * 100))}%`, transition: 'width 600ms ease' }} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">Etiqueta sugerida: <span className="font-medium">{prediction.verdict.toLowerCase().includes('false') ? 'Falso positivo' : 'Exoplaneta'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

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
