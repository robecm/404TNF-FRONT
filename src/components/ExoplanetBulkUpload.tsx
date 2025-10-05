import { FC, useState } from 'react';

const meta = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | undefined> }) : undefined);
const API_BASE = meta?.env?.VITE_API_BASE || '';

const ExoplanetBulkUpload: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFile(null);
      return;
    }
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!allowed.includes(f.type) && !['csv','xls','xlsx'].includes(ext)) {
      setError('Tipo de archivo no soportado. Usa CSV, XLS o XLSX.');
      setFile(null);
      return;
    }
    // tamaño máximo 10MB
    if (f.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande (límite 10 MB).');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    setError(null);
    setSuccess(null);
    if (!file) return setError('Selecciona un archivo antes de subir.');
    setUploading(true);
    try {
      const url = `${API_BASE}/api/exoplanets/upload`;
      const fd = new FormData();
      fd.append('file', file, file.name);

      const res = await fetch(url, { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText || 'Error');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      setSuccess('Archivo subido correctamente. Gracias.');
      setFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error al subir: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-black/20 to-slate-900/30 p-4 rounded-md border border-slate-700/20">
      <h5 className="text-sm font-semibold text-white mb-3">Carga tu (CSV / XLS / XLSX)</h5>

      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Selector estilizado */}
        <label className="inline-flex items-center gap-3 bg-slate-800/60 px-4 py-2 rounded-md cursor-pointer hover:bg-slate-800">
          <input
            type="file"
            accept=".csv, .xls, .xlsx, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileChange}
            className="hidden"
          />
          <span className="px-3 py-1 bg-slate-700 text-sm rounded text-white">Seleccionar archivo</span>
          <span className="text-sm text-slate-300 hidden md:inline">{file ? file.name : 'Ningún archivo seleccionado'}</span>
        </label>

        <div className="flex-1 md:flex md:justify-end md:items-center w-full">
          <div className="flex items-center gap-3">
            {file && (
              <div className="text-sm text-slate-300 max-w-xs truncate" title={file.name}>{file.name}</div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md shadow disabled:opacity-60"
            >
              {uploading ? 'Subiendo...' : 'Subir archivo'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}
      {success && <div className="mt-3 text-green-400 text-sm">{success}</div>}
    </div>
  );
};

export default ExoplanetBulkUpload;
