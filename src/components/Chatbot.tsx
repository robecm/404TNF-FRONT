import { FC, useEffect, useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; text: string };

const Chatbot: FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('openGeminiChat', handler as EventListener);
    return () => window.removeEventListener('openGeminiChat', handler as EventListener);
  }, []);

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
            {messages.length === 0 && <div className="text-sm text-slate-400">Pregúntale sobre los valores del formulario o sobre tránsitos.</div>}
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
