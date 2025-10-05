import { FC, useState } from 'react';

type FormState = {
  koi_prad: string; // decimal
  koi_model_snr: string; // decimal
  koi_depth: string; // decimal (ppm)
  koi_impact: string; // decimal
  koi_duration: string; // decimal (hours)
  koi_period: string; // days
  koi_time0bk: string; // BKJD
  koi_teq: string; // K
  koi_insol: string; // relative to Earth
  koi_steff: string; // K
  koi_slogg: string; // log g
  koi_srad: string; // stellar radius (R_sun)
};

const initialState: FormState = {
  koi_prad: '',
  koi_model_snr: '',
  koi_depth: '',
  koi_impact: '',
  koi_duration: '',
  koi_period: '',
  koi_time0bk: '',
  koi_teq: '',
  koi_insol: '',
  koi_steff: '',
  koi_slogg: '',
  koi_srad: '',
};

// Límites asumidos (explicados en comentarios):
// - koi_prad: >0, y < PRAD_MAX (valores muy grandes suelen ser estrellas; 30 R⊕ es un tope razonable)
// - koi_depth: ppm, entre 0 y 1_000_000 (1e6 ppm = 100% de oscurecimiento, imposible físicamente más allá de eso)
// - koi_impact: 0..1
// - koi_duration: >0 y < MAX_DURATION (horas); transit durations normalmente < 1000 h
const PRAD_MAX = 30;
const MAX_DEPTH_PPM = 1_000_000;
const MAX_DURATION_HOURS = 1000;
const MAX_PERIOD_DAYS = 10000; // broad cap
const MAX_TEQ_K = 10000;
const MAX_INSOL = 1e6;
const MAX_STEFF_K = 100000;
const MAX_SRAD = 1000; // R_sun

// InfoHover eliminado: se ha suprimido la integración con Gemini en este formulario.

// Icono de ayuda (i) con tooltip accesible
const InfoIcon: FC<{ text: string }> = ({ text }) => {
  return (
    <span className="relative inline-block ml-2 group">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-slate-700 text-xs text-white flex items-center justify-center focus:outline-none"
        aria-haspopup="true"
        aria-expanded="false"
        aria-label={`Información: ${text}`}
        tabIndex={0}
      >
        i
      </button>

      {/* Tooltip: aparece sobre el icono, con flecha y se muestra en hover o focus */}
      <div
        role="tooltip"
        className="absolute z-30 -top-2 left-1/2 -translate-x-1/2 -translate-y-full mt-0 w-72 max-w-xs rounded bg-slate-800 text-xs text-slate-100 px-3 py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150 shadow-lg"
      >
        <div className="text-sm leading-snug">{text}</div>
        {/* Arrow */}
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7 7L13 1" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </span>
  );
};

const ExoplanetSearchForm: FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  // nombre separado: no forma parte del payload que enviamos al modelo
  const [name, setName] = useState<string>('');
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // errores por campo
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  // touched para mostrar errores sólo después de que el usuario interactúe
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const parseNumber = (v: string) => (v.trim() === '' ? NaN : Number(v));

  const validateField = (k: keyof FormState, value: string): string | null => {
    // todos los campos que quedan son numéricos excepto que validamos sus formatos más abajo

    if (k === 'koi_prad') {
      const n = parseNumber(value);
      if (!Number.isFinite(n) || n <= 0) return 'koi_prad debe ser un número positivo (ej: 2.5).';
      if (n > PRAD_MAX) return `koi_prad demasiado grande (> ${PRAD_MAX} R⊕). Valores tan grandes suelen ser estrellas.`;
      return null;
    }

      if (k === 'koi_period') {
        const n = parseNumber(value);
        if (!Number.isFinite(n) || n <= 0) return 'koi_period debe ser un número de días (> 0).';
        if (n > MAX_PERIOD_DAYS) return `koi_period demasiado grande (> ${MAX_PERIOD_DAYS} d). Revise la unidad.`;
        return null;
      }

      if (k === 'koi_time0bk') {
        const n = parseNumber(value);
        if (!Number.isFinite(n)) return 'koi_time0bk debe ser un número (BKJD).';
        return null;
      }

      if (k === 'koi_teq') {
        const n = parseNumber(value);
        if (!Number.isFinite(n) || n <= 0) return 'koi_teq debe ser una temperatura en Kelvin (> 0).';
        if (n > MAX_TEQ_K) return `koi_teq inusualmente grande (> ${MAX_TEQ_K} K). Revise los datos.`;
        return null;
      }

      if (k === 'koi_insol') {
        const n = parseNumber(value);
        if (!Number.isFinite(n) || n < 0) return 'koi_insol debe ser un número (>= 0).';
        if (n > MAX_INSOL) return `koi_insol demasiado grande (> ${MAX_INSOL}). Revise la unidad.`;
        return null;
      }

      if (k === 'koi_steff') {
        const n = parseNumber(value);
        if (!Number.isFinite(n) || n <= 0) return 'koi_steff debe ser una temperatura en Kelvin (> 0).';
        if (n > MAX_STEFF_K) return `koi_steff inusualmente grande (> ${MAX_STEFF_K} K). Revise los datos.`;
        return null;
      }

      if (k === 'koi_slogg') {
        const n = parseNumber(value);
        if (!Number.isFinite(n)) return 'koi_slogg debe ser un número (log g).';
        // typical log g between ~0 and 6, but allow wider
        if (n < -2 || n > 7) return 'koi_slogg fuera de rango esperado (-2..7). Revise los datos.';
        return null;
      }

      if (k === 'koi_srad') {
        const n = parseNumber(value);
        if (!Number.isFinite(n) || n <= 0) return 'koi_srad debe ser el radio estelar en radios solares (> 0).';
        if (n > MAX_SRAD) return `koi_srad inusualmente grande (> ${MAX_SRAD} R☉). Revise los datos.`;
        return null;
      }

    if (k === 'koi_model_snr') {
      const n = parseNumber(value);
      if (!Number.isFinite(n) || n < 0) return 'koi_model_snr debe ser un número (SNR >= 0).';
      return null;
    }

    if (k === 'koi_depth') {
      const n = parseNumber(value);
      if (!Number.isFinite(n) || n < 0) return 'koi_depth debe ser un número (ppm >= 0).';
      if (n > MAX_DEPTH_PPM) return `koi_depth demasiado grande (> ${MAX_DEPTH_PPM} ppm). Revise la unidad.`;
      return null;
    }

    if (k === 'koi_impact') {
      const n = parseNumber(value);
      if (!Number.isFinite(n)) return 'koi_impact debe ser un número entre 0 y 1.';
      if (n < 0 || n > 1) return 'koi_impact debe estar entre 0 y 1.';
      return null;
    }

    if (k === 'koi_duration') {
      const n = parseNumber(value);
      if (!Number.isFinite(n) || n <= 0) return 'koi_duration debe ser un número de horas (> 0).';
      if (n > MAX_DURATION_HOURS) return `koi_duration inusualmente larga (> ${MAX_DURATION_HOURS} h). Revise los datos.`;
      return null;
    }

    return null;
  };

  const handleChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((s) => ({ ...s, [k]: v }));
    // si ya fue tocado, validar en cada cambio para feedback inmediato
    if (touched[k]) {
      const fErr = validateField(k, v);
      setErrors((prev) => ({ ...prev, [k]: fErr || undefined }));
    }
  };

  const handleBlur = (k: keyof FormState) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    const fErr = validateField(k, form[k]);
    setErrors((prev) => ({ ...prev, [k]: fErr || undefined }));
  };

  const handleNameBlur = () => {
    setNameTouched(true);
    const v = name.trim();
    if (!v) setNameError('El nombre es obligatorio para crear la página.');
    else setNameError(null);
  };

  const validateAll = (d: FormState) => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    (Object.keys(d) as (keyof FormState)[]).forEach((k) => {
      const err = validateField(k, d[k]);
      if (err) newErrors[k] = err;
    });
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccess(null);
    // validar nombre (no se envía en el payload)
    if (!name.trim()) {
      setNameTouched(true);
      setNameError('El nombre es obligatorio para crear la página.');
      setGlobalError('Corrige los errores marcados antes de enviar.');
      return;
    }

    const newErrors = validateAll(form);
    // marcar todos como tocados para mostrar todos los errores
    const allTouched: Partial<Record<keyof FormState, boolean>> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGlobalError('Corrige los errores marcados antes de enviar.');
      return;
    }
    const payload = {
      koi_prad: Number(form.koi_prad),
      koi_model_snr: Number(form.koi_model_snr),
      koi_depth: Number(form.koi_depth),
      koi_impact: Number(form.koi_impact),
      koi_duration: Number(form.koi_duration),
      koi_period: Number(form.koi_period),
      koi_time0bk: Number(form.koi_time0bk),
      koi_teq: Number(form.koi_teq),
      koi_insol: Number(form.koi_insol),
      koi_steff: Number(form.koi_steff),
      koi_slogg: Number(form.koi_slogg),
      koi_srad: Number(form.koi_srad),
    };
    console.log('[ExoplanetSearchForm] submit', payload);

    // guardar en sessionStorage para que la página destino pueda mostrar los valores
    const slug = encodeURIComponent(name.trim());
    const storageKey = `possibleExo::${slug}`;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // si falla (por storage deshabilitado), intentamos un fallback genérico
      try {
        sessionStorage.setItem('possibleExo', JSON.stringify(payload));
      } catch {
        // ignoramos errores de storage
      }
    }

    // navegar a la nueva página usando el nombre (url-encoded)
    const target = `/posibleExo/${slug}`;
    // opcional: limpiar el form antes de navegar
    setForm(initialState);
    setTouched({});
    setErrors({});
    // redirigir
    window.location.href = target;
  };

  const anyFieldEmpty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k].trim() === '');
  const isSubmitDisabled = Object.keys(errors).some((k) => !!errors[k as keyof FormState]) || anyFieldEmpty || !name.trim();

  return (
    <div className="mt-10 bg-gradient-to-br from-black/30 to-slate-900/40 p-6 rounded-xl border border-slate-700/30">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Busca tu propio exoplaneta</h2>
      <h4 className="text-xl font-semibold text-white mb-3">Variables de Entrada para el Modelo</h4>
      <p className="text-sm text-slate-400 mb-4">Proporciona las variables físicas medidas para que el modelo determine si la señal corresponde a un exoplaneta.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">Nombre (para la ruta)</label>
            <InfoIcon text={"Nombre que se usará para construir la ruta /posibleExo/(Nombre). Ej: Kepler-1234. No se envía al modelo; solo identifica la página."} />
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Ej: Kepler-1234"
            aria-invalid={!!nameError}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${nameError ? 'border-red-500' : 'border-slate-700'}`}
          />
          <p className="text-xs text-slate-500 mt-1">Nombre que se usará para crear la página <code>/posibleExo/(Nombre)</code>.</p>
          {nameTouched && nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_prad (Radio del planeta, R⊕)</label>
            <InfoIcon text={"koi_prad: número decimal. Radio del planeta en radios terrestres (ej: 2.5). Es la característica más importante: objetos muy grandes suelen ser estrellas, no planetas."} />
          </div>
          <input
            value={form.koi_prad}
            onChange={handleChange('koi_prad')}
            onBlur={handleBlur('koi_prad')}
            placeholder="Ej: 2.5"
            type="number"
            step="any"
            min={0}
            max={PRAD_MAX}
            aria-invalid={!!errors.koi_prad}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_prad ? 'border-red-500' : 'border-slate-700'}`}
          />
          <p className="text-xs text-slate-500 mt-1">Tamaño del planeta en radios terrestres. Importante para descartar objetos demasiado grandes (suponemos tope {PRAD_MAX} R⊕).</p>
          <p className="text-xs text-slate-400 mt-1">Unidad: R⊕ (radios terrestres)</p>
          {errors.koi_prad && <p className="text-xs text-red-400 mt-1">{errors.koi_prad}</p>}
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_model_snr (SNR)</label>
            <InfoIcon text={"koi_model_snr: número decimal. Relación señal/ruido del tránsito; valores mayores indican una observación más confiable."} />
          </div>
          <input
            value={form.koi_model_snr}
            onChange={handleChange('koi_model_snr')}
            onBlur={handleBlur('koi_model_snr')}
            placeholder="Ej: 12.3"
            type="number"
            step="any"
            min={0}
            aria-invalid={!!errors.koi_model_snr}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_model_snr ? 'border-red-500' : 'border-slate-700'}`}
          />
          <p className="text-xs text-slate-500 mt-1">Relación señal/ruido del tránsito; mayor SNR = señal más confiable.</p>
          <p className="text-xs text-slate-400 mt-1">Unidad: adimensional (SNR)</p>
          {errors.koi_model_snr && <p className="text-xs text-red-400 mt-1">{errors.koi_model_snr}</p>}
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_depth (Profundidad, ppm)</label>
            <InfoIcon text={"koi_depth: número decimal en ppm (parts-per-million). Cuánto se oscureció la estrella en el tránsito; relacionado con el radio del planeta."} />
          </div>
          <input
            value={form.koi_depth}
            onChange={handleChange('koi_depth')}
            onBlur={handleBlur('koi_depth')}
            placeholder="Ej: 2500"
            type="number"
            step="any"
            min={0}
            max={MAX_DEPTH_PPM}
            aria-invalid={!!errors.koi_depth}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_depth ? 'border-red-500' : 'border-slate-700'}`}
          />
          <p className="text-xs text-slate-500 mt-1">Profundidad del tránsito en partes por millón; relacionada con el radio del planeta.</p>
          <p className="text-xs text-slate-400 mt-1">Unidad: ppm (parts-per-million)</p>
          {errors.koi_depth && <p className="text-xs text-red-400 mt-1">{errors.koi_depth}</p>}
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_impact (Impact parameter)</label>
            <InfoIcon text={"koi_impact: número decimal entre 0 y 1. Indica qué tan centrado fue el tránsito (0 = ecuatorial, 1 = muy de borde). Ayuda a distinguir tránsitos planetarios de eclipses estelares."} />
          </div>
          <input
            value={form.koi_impact}
            onChange={handleChange('koi_impact')}
            onBlur={handleBlur('koi_impact')}
            placeholder="0.0 - 1.0"
            type="number"
            step="any"
            min={0}
            max={1}
            aria-invalid={!!errors.koi_impact}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_impact ? 'border-red-500' : 'border-slate-700'}`}
          />
          <p className="text-xs text-slate-500 mt-1">Qué tan centrado fue el tránsito (0 = ecuatorial, 1 = muy de borde).</p>
          <p className="text-xs text-slate-400 mt-1">Unidad: adimensional (0–1)</p>
          {errors.koi_impact && <p className="text-xs text-red-400 mt-1">{errors.koi_impact}</p>}
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_duration (Duración en horas)</label>
            <InfoIcon text={"koi_duration: número decimal. Duración total del tránsito en horas. Debe ser coherente con una órbita; duraciones anómalas pueden indicar falsos positivos."} />
          </div>
          <input
            value={form.koi_duration}
            onChange={handleChange('koi_duration')}
            onBlur={handleBlur('koi_duration')}
            placeholder="Ej: 2.5"
            type="number"
            step="any"
            min={0}
            max={MAX_DURATION_HOURS}
            aria-invalid={!!errors.koi_duration}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_duration ? 'border-red-500' : 'border-slate-700'}`}
          />
          <p className="text-xs text-slate-500 mt-1">Duración total del tránsito; debe ser coherente con una órbita real.</p>
          <p className="text-xs text-slate-400 mt-1">Unidad: horas</p>
          {errors.koi_duration && <p className="text-xs text-red-400 mt-1">{errors.koi_duration}</p>}
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_period (Período, días)</label>
            <InfoIcon text={"koi_period: tiempo orbital en días. Tránsitos deben repetirse con esta periodicidad."} />
          </div>
          <input
            value={form.koi_period}
            onChange={handleChange('koi_period')}
            onBlur={handleBlur('koi_period')}
            placeholder="Ej: 12.345"
            type="number"
            step="any"
            min={0}
            aria-invalid={!!errors.koi_period}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_period ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_period && <p className="text-xs text-red-400 mt-1">{errors.koi_period}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: días</p>
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_time0bk (Época, BKJD)</label>
            <InfoIcon text={"koi_time0bk: época del tránsito en BKJD (Barycentric Kepler Julian Date)."} />
          </div>
          <input
            value={form.koi_time0bk}
            onChange={handleChange('koi_time0bk')}
            onBlur={handleBlur('koi_time0bk')}
            placeholder="Ej: 1295.123"
            type="number"
            step="any"
            aria-invalid={!!errors.koi_time0bk}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_time0bk ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_time0bk && <p className="text-xs text-red-400 mt-1">{errors.koi_time0bk}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: BKJD (Barycentric Kepler Julian Date)</p>
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_teq (Temperatura de equilibrio, K)</label>
            <InfoIcon text={"koi_teq: temperatura de equilibrio estimada en Kelvin."} />
          </div>
          <input
            value={form.koi_teq}
            onChange={handleChange('koi_teq')}
            onBlur={handleBlur('koi_teq')}
            placeholder="Ej: 300"
            type="number"
            step="any"
            min={0}
            aria-invalid={!!errors.koi_teq}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_teq ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_teq && <p className="text-xs text-red-400 mt-1">{errors.koi_teq}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: Kelvin (K)</p>
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_insol (Insolación, relativo a la Tierra)</label>
            <InfoIcon text={"koi_insol: flujo recibido relativo a la Tierra (1 = misma insolación que la Tierra)."} />
          </div>
          <input
            value={form.koi_insol}
            onChange={handleChange('koi_insol')}
            onBlur={handleBlur('koi_insol')}
            placeholder="Ej: 1.0"
            type="number"
            step="any"
            min={0}
            aria-invalid={!!errors.koi_insol}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_insol ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_insol && <p className="text-xs text-red-400 mt-1">{errors.koi_insol}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: relativa a la Tierra (1 = misma insolación que la Tierra)</p>
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_steff (Temperatura estelar, K)</label>
            <InfoIcon text={"koi_steff: temperatura efectiva de la estrella anfitriona en Kelvin."} />
          </div>
          <input
            value={form.koi_steff}
            onChange={handleChange('koi_steff')}
            onBlur={handleBlur('koi_steff')}
            placeholder="Ej: 5778"
            type="number"
            step="any"
            min={0}
            aria-invalid={!!errors.koi_steff}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_steff ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_steff && <p className="text-xs text-red-400 mt-1">{errors.koi_steff}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: Kelvin (K)</p>
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_slogg (log g estelar)</label>
            <InfoIcon text={"koi_slogg: logaritmo de la gravedad superficial de la estrella (log g)."} />
          </div>
          <input
            value={form.koi_slogg}
            onChange={handleChange('koi_slogg')}
            onBlur={handleBlur('koi_slogg')}
            placeholder="Ej: 4.44"
            type="number"
            step="any"
            aria-invalid={!!errors.koi_slogg}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_slogg ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_slogg && <p className="text-xs text-red-400 mt-1">{errors.koi_slogg}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: log10(cm/s²) (log g)</p>
        </div>

        <div>
          <div className="flex items-center">
            <label className="text-sm text-slate-300">koi_srad (Radio estelar, R☉)</label>
            <InfoIcon text={"koi_srad: radio de la estrella en radios solares."} />
          </div>
          <input
            value={form.koi_srad}
            onChange={handleChange('koi_srad')}
            onBlur={handleBlur('koi_srad')}
            placeholder="Ej: 1.0"
            type="number"
            step="any"
            min={0}
            aria-invalid={!!errors.koi_srad}
            className={`mt-1 w-full px-3 py-2 rounded bg-slate-800 text-white border ${errors.koi_srad ? 'border-red-500' : 'border-slate-700'}`}
          />
          {errors.koi_srad && <p className="text-xs text-red-400 mt-1">{errors.koi_srad}</p>}
          <p className="text-xs text-slate-400 mt-1">Unidad: R☉ (radios solares)</p>
        </div>

        <div className="md:col-span-2 flex items-center gap-4 mt-2">
          <button type="submit" disabled={isSubmitDisabled} className={`px-4 py-2 rounded-md shadow text-white ${isSubmitDisabled ? 'bg-slate-600 cursor-not-allowed' : 'bg-cyan-600'}`}>
            Enviar
          </button>
          {globalError && <div className="text-red-400 text-sm">{globalError}</div>}
          {success && <div className="text-green-400 text-sm">{success}</div>}
        </div>
      </form>
    </div>
  );
};

export default ExoplanetSearchForm;
