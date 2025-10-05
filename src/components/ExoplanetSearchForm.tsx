import { FC, useState } from 'react';

type FormState = {
  observerName: string;
  planetName: string;
  ra: string;
  dec: string;
  obsDate: string;
  instrument: string;
};

const initialState: FormState = {
  observerName: '',
  planetName: '',
  ra: '',
  dec: '',
  obsDate: '',
  instrument: '',
};

const ExoplanetSearchForm: FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [k]: e.target.value }));
  };

  const validate = (data: FormState) => {
    if (!data.observerName.trim() || !data.planetName.trim()) return 'Nombre del observador y nombre del planeta son obligatorios.';
    if (!data.obsDate) return 'Selecciona la fecha de observación.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate(form);
    if (v) return setError(v);

    // Aquí podrías enviar a un endpoint; por ahora simulamos envío local
    console.log('[ExoplanetSearchForm] submit', form);
    setSuccess('Solicitud enviada. Revisaremos tus datos y te contactaremos si procede.');
    setForm(initialState);
  };

  return (
    <div className="mt-10 bg-gradient-to-br from-black/30 to-slate-900/40 p-6 rounded-xl border border-slate-700/30">
      <h4 className="text-xl font-semibold text-white mb-3">Buscar / Registrar tu exoplaneta</h4>
      <p className="text-sm text-slate-400 mb-4">Rellena los datos para solicitar una búsqueda o registrar una observación propia.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-300">Nombre del observador</label>
          <input value={form.observerName} onChange={handleChange('observerName')} className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>

        <div>
          <label className="text-sm text-slate-300">Nombre del planeta</label>
          <input value={form.planetName} onChange={handleChange('planetName')} className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>

        <div>
          <label className="text-sm text-slate-300">Ascensión recta (RA)</label>
          <input value={form.ra} onChange={handleChange('ra')} placeholder="hh:mm:ss" className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>

        <div>
          <label className="text-sm text-slate-300">Declinación (Dec)</label>
          <input value={form.dec} onChange={handleChange('dec')} placeholder="±dd:mm:ss" className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>

        <div>
          <label className="text-sm text-slate-300">Fecha de observación</label>
          <input type="date" value={form.obsDate} onChange={handleChange('obsDate')} className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>

        <div>
          <label className="text-sm text-slate-300">Telescopio / Instrumento</label>
          <input value={form.instrument} onChange={handleChange('instrument')} placeholder="Ej. Celestron 8" className="mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>

        <div className="md:col-span-2 flex items-center gap-4 mt-2">
          <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md shadow">Enviar</button>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-400 text-sm">{success}</div>}
        </div>
      </form>
    </div>
  );
};

export default ExoplanetSearchForm;
