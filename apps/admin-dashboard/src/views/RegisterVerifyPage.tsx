import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyInviteCodeApi, completeRegistrationApi } from '../models/registrationApi';

type Step = 'verify-code' | 'set-password' | 'done';

export function RegisterVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [step, setStep] = useState<Step>('verify-code');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">Enlace inválido</h1>
          <p className="mb-6 text-sm text-gray-600">
            El enlace de registro es inválido o ha expirado.
          </p>
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await verifyInviteCodeApi({ token, code: code.trim() });
      setStep('set-password');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código inválido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await completeRegistrationApi({ token, password });
      setStep('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al completar registro';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">¡Registro completado!</h1>
          <p className="mb-6 text-sm text-gray-600">
            Tu cuenta de administrador ha sido creada exitosamente.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (step === 'set-password') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Crear contraseña</h1>
          <p className="mb-6 text-sm text-gray-600">
            El código de invitación fue verificado. Ahora crea tu contraseña.
          </p>

          <form onSubmit={handleSetPassword} noValidate>
            <div className="mb-4">
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Nueva contraseña"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Confirmar contraseña"
              />
            </div>

            {error && (
              <p role="alert" className="mb-4 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              aria-busy={loading}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step: verify-code
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Verificar código</h1>
        <p className="mb-6 text-sm text-gray-600">
          Ingresa el código de invitación que te proporcionó un administrador existente.
        </p>

        <form onSubmit={handleVerifyCode} noValidate>
          <div className="mb-6">
            <label htmlFor="invite-code" className="mb-1 block text-sm font-medium text-gray-700">
              Código de invitación
            </label>
            <input
              id="invite-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={8}
              placeholder="Ej: A3X9K7M2"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Código de invitación"
              autoComplete="off"
            />
          </div>

          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? 'Verificando…' : 'Verificar código'}
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
