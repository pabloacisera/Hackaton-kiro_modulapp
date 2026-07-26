import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { initiateRegistrationApi } from '../models/registrationApi';

export function RegisterInitiatePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await initiateRegistrationApi({ email });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar solicitud';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md text-center">
          <div className="mb-4 text-4xl">✉️</div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">Revisa tu correo</h1>
          <p className="mb-6 text-sm text-gray-600">
            Hemos enviado un enlace de registro a <strong>{email}</strong>. El enlace expira en 15
            minutos.
          </p>
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Registrar Administrador</h1>
        <p className="mb-6 text-sm text-gray-600">
          Ingresa tu correo electrónico para recibir el enlace de registro.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Correo electrónico"
            />
          </div>

          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? 'Enviando…' : 'Enviar enlace de registro'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
