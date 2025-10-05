import { FC, useEffect, useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; text: string };

type Payload = {
  koi_prad?: number;
  koi_model_snr?: number;
  koi_depth?: number;
  koi_impact?: number;
  koi_duration?: number;
  koi_time0bk?: number;
  koi_teq?: number;
  koi_insol?: number;
  koi_steff?: number;
  koi_slogg?: number;
  koi_srad?: number;
};

const Chatbot: FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [probability, setProbability] = useState<number | null>(null);
  const [initialSent, setInitialSent] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('openGeminiChat', handler as EventListener);
    return () => window.removeEventListener('openGeminiChat', handler as EventListener);
  }, []);

  // cargar payload desde sessionStorage (si existe) y computar probabilidad simple
  useEffect(() => {
    const load = () => {
      try {
        const raw = sessionStorage.getItem('possibleExo') || (() => { // try to find any possibleExo::<slug>
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i) || '';
            if (k.startsWith('possibleExo::')) return sessionStorage.getItem(k);
          }
          return null;
        })();
        if (!raw) {
          setPayload(null);
          setProbability(null);
          return;
        }
        const parsed = JSON.parse(raw as string);
        setPayload(parsed);
        const prob = computeProbabilities(parsed);
        setProbability(prob.exoplanet);
      } catch {
        setPayload(null);
        setProbability(null);
      }
    };
    load();
    // también recargar cuando se abre el chat
    const onOpen = () => load();
    window.addEventListener('openGeminiChat', onOpen as EventListener);
    return () => window.removeEventListener('openGeminiChat', onOpen as EventListener);
  }, []);

  // cuando el chat se abra y haya payload, enviar un prompt inicial explicando parámetros y resultado
  useEffect(() => {
    if (!open) return;
    if (!payload) return;
    if (initialSent) return;

    const sendInitialAnalysis = async () => {
      const lines: string[] = [];
      lines.push('Actúa como un asistente científico que explica parámetros de exoplanetas de forma breve y clara.');
      lines.push('A continuación tienes los parámetros del objeto:');
      for (const key of Object.keys(payload)) {
        // @ts-expect-error - dynamic key access on payload
        const val = payload[key];
        lines.push(`${key}: ${val}`);
      }
      lines.push(`Probabilidad heurística (modelo): ${probability !== null ? `${probability}%` : 'n/a'}`);
      lines.push('Resume brevemente qué significa cada parámetro y qué implica el resultado. Responde en español.');

      const prompt = lines.join('\n');

      // push user prompt to chat UI
      pushMessage({ id: 'u' + Date.now(), role: 'user', text: prompt });
      setLoading(true);
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) {
          pushMessage({ id: 'a' + Date.now(), role: 'assistant', text: 'No se pudo contactar al proxy de Gemini para el análisis inicial. Intenta preguntar manualmente.' });
        } else {
          const json = await res.json();
          const reply = json.reply ?? 'Respuesta inesperada del proxy.';
          pushMessage({ id: 'a' + Date.now(), role: 'assistant', text: reply });
        }
      } catch {
        pushMessage({ id: 'a' + Date.now(), role: 'assistant', text: 'Error de red al solicitar el análisis inicial a Gemini.' });
      } finally {
        setLoading(false);
        setInitialSent(true);
      }
    };

    void sendInitialAnalysis();
  }, [open, payload, probability, initialSent]);

  const computeProbabilities = (p: Payload | null) => {
    if (!p) return { exoplanet: 50, falsePositive: 50 };
    const snr = typeof p.koi_model_snr === 'number' ? p.koi_model_snr : 7;
    const prad = typeof p.koi_prad === 'number' ? p.koi_prad : 1.5;
    const s = 1 / (1 + Math.exp(-(snr - 7) / 3));
    const sizeScore = Math.exp(-Math.abs((prad - 1.5) / 1.5));
    let exo = s * 0.7 + sizeScore * 0.3;
    exo = Math.max(0, Math.min(1, exo));
    const exPct = Math.round(exo * 100);
    return { exoplanet: exPct, falsePositive: 100 - exPct };
  };

  const pushMessage = (m: Message) => setMessages((s) => [...s, m]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', text };
    pushMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      // Llamar a un endpoint proxy en el servidor que realiza la petición segura
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      if (!res.ok) {
        // fallback: respuesta simulada si no hay backend disponible
        const fallback: Message = { id: 'a' + Date.now(), role: 'assistant', text: 'No hay conexión al servicio Gemini; respuesta simulada.' };
        pushMessage(fallback);
      } else {
        const data = await res.json();
        // esperamos { reply: string }
        const replyText = data?.reply ?? 'Respuesta inesperada del proxy.';
        const assistantMsg: Message = { id: 'a' + Date.now(), role: 'assistant', text: replyText };
        pushMessage(assistantMsg);
      }
    } catch {
      const fallback: Message = { id: 'a' + Date.now(), role: 'assistant', text: 'Error al conectar con el proxy de Gemini. (Usa un servidor con la API key en variables de entorno.)' };
      pushMessage(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-full shadow-lg"
          aria-label="Preguntar a Gemini"
        >
          <img src={new URL('../static/gemini icon.webp', import.meta.url).href} alt="Gemini" width={18} height={18} />
          <span className="text-sm">Preguntar a Gemini</span>
        </button>
      )}

      {open && (
        <div className="w-80 h-96 bg-slate-900/90 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800">
            <div className="flex items-center gap-2">
              <img src={new URL('../static/gemini icon.webp', import.meta.url).href} alt="Gemini" width={20} height={20} />
              <strong>Gemini Chat</strong>
            </div>
            <div>
              <button onClick={() => setOpen(false)} className="px-2 py-1 text-slate-300">Cerrar</button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2" id="chat-body">
            {/* Panel explicativo de parámetros y resultado */}
            <div className="bg-slate-800/60 p-3 rounded text-sm text-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Resumen de parámetros</div>
                <div className="text-xs text-slate-400">Puedes preguntar sobre estos valores a Gemini abajo</div>
              </div>
              {payload ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div><strong>koi_prad:</strong> {payload.koi_prad ?? '-'} <span className="text-slate-400">R⊕ (radio)</span></div>
                    <div><strong>koi_model_snr:</strong> {payload.koi_model_snr ?? '-'} <span className="text-slate-400">SNR (modelo)</span></div>
                    <div><strong>koi_depth:</strong> {payload.koi_depth ?? '-'} <span className="text-slate-400">ppm (profundidad)</span></div>
                    <div><strong>koi_impact:</strong> {payload.koi_impact ?? '-'} <span className="text-slate-400">(0–1)</span></div>
                  </div>
                  <div className="space-y-1">
                    <div><strong>koi_duration:</strong> {payload.koi_duration ?? '-'} <span className="text-slate-400">horas</span></div>
                    <div><strong>koi_time0bk:</strong> {payload.koi_time0bk ?? '-'} <span className="text-slate-400">(BKJD)</span></div>
                    <div><strong>koi_teq:</strong> {payload.koi_teq ?? '-'} <span className="text-slate-400">K (Teq)</span></div>
                    <div><strong>koi_insol:</strong> {payload.koi_insol ?? '-'} <span className="text-slate-400">× Tierra</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">No hay datos del formulario en esta sesión. Envía el formulario para ver un resumen aquí.</div>
              )}

              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Probabilidad (modelo heurístico)</div>
                  <div className="font-mono">{probability !== null ? `${probability}%` : '-'}</div>
                </div>
                <div className="w-full bg-slate-700 rounded h-2 mt-1 overflow-hidden">
                  <div className="bg-cyan-500 h-2 transition-all" style={{ width: probability !== null ? `${probability}%` : '0%' }} />
                </div>
              </div>
            </div>

            {messages.map((m) => (
              <div key={m.id} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-slate-700 bg-slate-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                className="flex-1 px-3 py-2 rounded bg-slate-900 text-white text-sm"
                placeholder="Escribe tu pregunta para Gemini..."
              />
              <button onClick={send} disabled={loading} className="px-3 py-2 bg-cyan-600 rounded text-white text-sm">
                {loading ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
