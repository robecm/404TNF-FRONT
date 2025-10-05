
import { FC } from 'react';

const TransitExplanation: FC<{ videoId?: string }> = ({ videoId = 'TVJmC19juU0' }) => {
  const embedSrc = `https://www.youtube.com/embed/${videoId}`;

  return (
    <section className="w-full max-w-5xl mx-auto mt-10 bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-md rounded-xl p-6 border border-slate-600/30">
  <h3 className="text-2xl md:text-3xl font-semibold text-white/90 mb-1">Vigilancia de Exoplanetas</h3>
  <p className="text-sm text-slate-400 mb-6">Una iniciativa de ciencia ciudadana para observar tránsitos de exoplanetas y colaborar con datos útiles para la investigación.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <div className="aspect-video w-full rounded-md overflow-hidden border border-slate-700/40">
            <iframe
              src={embedSrc}
              title="Exoplanet Watch — explicación por tránsito"
              className="w-full h-full"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="space-y-4">
            <p className="text-slate-200/90">
              Cuando un exoplaneta pasa frente a su estrella (un tránsito) bloquea una fracción pequeña de
              la luz de la estrella. Midiendo con precisión la curva de brillo podemos detectar esos
              oscurecimientos periódicos y estimar el tamaño y la órbita del planeta.
            </p>

            <p className="text-slate-200/90">
              Exoplanet Watch permite a aficionados y científicos colaborar: observa tránsitos con tu
              telescopio o solicita datos observacionales si no dispones de uno. No necesitas formación
              previa: el proyecto ofrece recursos y apoyo comunitario.
            </p>

            {/* Metadatos eliminados por solicitud del usuario */}
          </div>
        </div>
      </div>

      {/* Secciones removidas por solicitud del usuario: 'Qué harás', 'Requisitos', 'Aprende más' y créditos */}
    </section>
  );
};

export default TransitExplanation;
