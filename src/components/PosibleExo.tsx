import { FC, useEffect, useRef, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: Store your API key in a .env.local file at the project root
// VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

const PosibleExo: FC<{ name:string }> = ({ name }) => {
  const [data, setData] = useState<Payload | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [prediction, setPrediction] = useState<{ verdict: string; confidence: number } | null>(null);
  const [geminiSummary, setGeminiSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const isInitialLoad = useRef(true);

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
    const cdn = 'https://cdn.pixabay.com/photo/2024/09/23/08/48/planet-9068292_960_720.png';
    setImgSrc(cdn);
    isInitialLoad.current = true; // Reset on name change
  }, [name]);

  useEffect(() => {
    const run = async () => {
      if (!data) {
        setPrediction(null);
        return;
      }
      try {
        const res = await fetch('https://back-557899680969.us-south1.run.app/predict', {
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
          let bodyText = '';
          try {
            bodyText = await res.text();
          } catch {
            bodyText = '<unable to read body>';
          }
          console.error('Predict upstream error', res.status, bodyText);
          setPrediction({ verdict: 'ERROR', confidence: 0 });
        } else {
          const json = await res.json();
          const verdict = String(json.verdict ?? json.veredicto ?? 'UNKNOWN');
          const confidence = Number(json.confidence ?? json.confianza ?? 0) || 0;
          setPrediction({ verdict, confidence });
        }
      } catch (e) {
        console.error('Predict fetch error', e);
        setPrediction({ verdict: 'ERROR', confidence: 0 });
      }
    };
    void run();
  }, [data]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!data || !prediction || prediction.verdict === 'ERROR' || !isInitialLoad.current) return;

      isInitialLoad.current = false; // Mark as loaded
      setSummaryLoading(true);
      setGeminiSummary('');

      const combinedData = {
        candidate_name: decodeURIComponent(name),
        planetary_data: data,
        model_prediction: prediction,
      };
      const jsonDataString = JSON.stringify(combinedData, null, 2);

      const prompt = `
Por favor analiza la siguiente informacion JSON. Contiene datos planetarios (como koi_prad, koi_teq, etc.) sobre un candidato a exoplaneta y la predicción de un modelo sobre si es un exoplaneta real.
Tu tarea es traducir estos datos tecnicos en un resumen simple y facil de entender para una persona sin conocimientos tecnicos.
Considera todos los datos planetarios proporcionados y el veredicto del modelo para explicar los hallazgos clave.
Sé conciso y claro, explicando los hallazgos de manera atractiva en un sólo párrafo. Incluye únicamente el párrafo que me darás de respuesta, ningún texto más.

Aquí están los datos:
${jsonDataString}
`;

      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        setGeminiSummary(text);
      } catch (error) {
        console.error('Error fetching summary from Gemini:', error);
        setGeminiSummary('Error al generar el resumen desde la API de Gemini.');
      } finally {
        setSummaryLoading(false);
      }
    };

    void fetchSummary();
  }, [data, prediction, name]);

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
                  <div className="text-sm">Resultado del servidor</div>
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

      {/* Gemini Summary Card */}
      {(summaryLoading || geminiSummary) && (
        <div className="max-w-4xl mx-auto mt-6">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-semibold mb-2 text-cyan-300">Resumen de Gemini</h4>
            {summaryLoading && <div className="text-sm text-slate-400">Generando resumen...</div>}
            {geminiSummary && <p className="text-sm text-slate-200 leading-relaxed">{geminiSummary}</p>}
          </div>
        </div>
      )}

    </div>
  );
};

export default PosibleExo;