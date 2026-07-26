import { useState } from 'react';
import { useAuth } from '../controllers/useAuth';
import { generateInviteCodeApi } from '../models/registrationApi';

export function SettingsPage() {
  const { accessToken } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setInviteCode(null);
    setCopied(false);

    try {
      const result = await generateInviteCodeApi(accessToken);
      setInviteCode(result.code);
      setExpiresIn(result.expiresIn);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar código';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for environments where clipboard API isn't available
      setError('No se pudo copiar al portapapeles');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Configuración</h1>

      {/* Invite Code Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Código de Invitación</h2>
        <p className="mb-4 text-sm text-gray-600">
          Genera un código de invitación para que un nuevo administrador pueda registrarse. El
          código es válido por <strong>15 minutos</strong> y solo puede usarse una vez.
        </p>

        <button
          onClick={handleGenerateCode}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          aria-busy={loading}
        >
          {loading ? 'Generando…' : 'Generar código de invitación'}
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {inviteCode && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-medium text-blue-700 uppercase tracking-wide">
              Código generado (se muestra una sola vez)
            </p>
            <div className="flex items-center gap-3">
              <code className="rounded bg-white px-4 py-2 text-2xl font-bold tracking-widest text-gray-900 border border-blue-200">
                {inviteCode}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                aria-label="Copiar código"
              >
                {copied ? '✓ Copiado' : '📋 Copiar'}
              </button>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              ⏱️ Expira en {Math.floor(expiresIn / 60)} minutos. Compártelo de forma segura con el
              nuevo administrador.
            </p>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            <strong>⚠️ Seguridad:</strong> Comparte este código por un canal seguro (en persona,
            llamada, o mensaje directo). No lo envíes por email — el nuevo admin ya recibirá un
            enlace por correo.
          </p>
        </div>
      </section>
    </div>
  );
}
