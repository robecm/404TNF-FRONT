import { FC, useEffect, useState } from 'react';

type Payload = {
  koi_prad: number;
  koi_model_snr: number;
  koi_depth: number;
  koi_impact: number;
  koi_duration: number;
};

const PosibleExo: FC<{ name: string }> = ({ name }) => {
  const [data, setData] = useState<Payload | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [chatOpen, setChatOpen] = useState(false);

  // componente interno para chat local en la página PosibleExo
  const LocalGeminiChat: FC = () => {
    const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const push = (m: { id: string; role: 'user' | 'assistant'; text: string }) => setMessages((s) => [...s, m]);

    const ask = async (prompt: string) => {
      if (!prompt.trim()) return;
      const user = { id: 'u' + Date.now(), role: 'user' as const, text: prompt };
      push(user);
      setInput('');
      setLoading(true);
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) {
          push({ id: 'a' + Date.now(), role: 'assistant', text: 'No se pudo contactar al proxy de Gemini. Respuesta simulada.' });
        } else {
          const json = await res.json();
          push({ id: 'a' + Date.now(), role: 'assistant', text: json.reply ?? 'Respuesta inesperada del proxy.' });
        }
      } catch {
        push({ id: 'a' + Date.now(), role: 'assistant', text: 'Error de red al contactar al proxy. Configure un endpoint /api/gemini en su servidor.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed bottom-6 right-6 z-40 w-80">
        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-full shadow">
            <img src={new URL('../static/gemini icon.webp', import.meta.url).href} alt="Gemini" width={18} height={18} />
            <span className="text-sm">Preguntar a Gemini</span>
          </button>
        )}

        {chatOpen && (
          <div className="bg-slate-900/95 rounded-lg shadow-lg overflow-hidden flex flex-col h-96">
            <div className="px-3 py-2 bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2"><img src={new URL('../static/gemini icon.webp', import.meta.url).href} alt="Gemini" width={18} height={18} /> <strong>Gemini</strong></div>
              <div><button onClick={() => setChatOpen(false)} className="text-slate-300">Cerrar</button></div>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {messages.length === 0 && <div className="text-sm text-slate-400">Pregunta sobre este exoplaneta o sobre los valores mostrados.</div>}
              {messages.map((m) => (
                <div key={m.id} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`${m.role === 'user' ? 'bg-cyan-600 text-white inline-block' : 'bg-slate-700 text-slate-100 inline-block'} px-3 py-2 rounded`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-800 border-t border-slate-700">
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(input); }} className="flex-1 px-3 py-2 rounded bg-slate-900 text-white text-sm" placeholder="Escribe tu pregunta..." />
                <button onClick={() => ask(input)} disabled={loading} className="px-3 py-2 bg-cyan-600 rounded text-white text-sm">{loading ? '...' : 'Enviar'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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

    // intentar resolver imagen por varios medios (similar a App.tsx)
    const bundled = new URL('../static/exoplanet.png', import.meta.url).href;
    setImgSrc(bundled);
  }, [name]);

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
              <div className="space-y-2 text-sm">
                <p><strong>koi_prad:</strong> {data.koi_prad} R⊕</p>
                <p><strong>koi_model_snr:</strong> {data.koi_model_snr}</p>
                <p><strong>koi_depth:</strong> {data.koi_depth} ppm</p>
                <p><strong>koi_impact:</strong> {data.koi_impact}</p>
                <p><strong>koi_duration:</strong> {data.koi_duration} horas</p>
              </div>
            ) : (
              <div className="text-sm text-slate-300">No se encontraron datos del formulario para este objeto. Tal vez la sesión expiró o el envío fue en otra sesión.</div>
            )}
          </div>
        </div>
      </div>
      {/* Chat local para preguntar a Gemini (solo en esta página) */}
      <LocalGeminiChat />
    </div>
  );
};

export default PosibleExo;
