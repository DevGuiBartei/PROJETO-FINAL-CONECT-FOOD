
import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Loader2,
  ArrowLeft,
  KeyRound,
  Mail,
  Contrast,
} from 'lucide-react';

import { api } from '../../services/api';
import type { User } from '../../types';

type AccessibilityTheme = 'light' | 'dark' | 'high-contrast';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  theme: AccessibilityTheme;
  onThemeChange: (theme: AccessibilityTheme) => void;
}

type ViewMode = 'login' | 'forgot' | 'reset';

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  theme,
  onThemeChange,
}) => {
  const [mode, setMode] = useState<ViewMode>('login');

  const highContrast = theme === 'high-contrast';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [cpf, setCpf] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const changeMode = (newMode: ViewMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
  };

  const textClass = highContrast
    ? 'text-white'
    : 'text-gray-900';

  const descriptionClass = highContrast
    ? 'text-white'
    : 'text-gray-600';

  const labelClass = highContrast
    ? 'text-white'
    : 'text-gray-700';

  const inputClass = `
    w-full rounded-lg border px-3.5 py-3 text-base
    focus-visible:outline-none focus-visible:ring-4
    focus-visible:ring-yellow-400 focus-visible:ring-offset-2
    ${
      highContrast
        ? 'border-white bg-black text-white placeholder:text-gray-200 focus-visible:ring-offset-black'
        : 'border-gray-400 bg-white text-gray-900 placeholder:text-gray-600 focus-visible:ring-offset-white'
    }
  `;

  const focusClass = `
    focus-visible:outline-none focus-visible:ring-4
    focus-visible:ring-yellow-400 focus-visible:ring-offset-2
    ${
      highContrast
        ? 'focus-visible:ring-offset-black'
        : 'focus-visible:ring-offset-white'
    }
  `;

  const handleLoginSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      onLoginSuccess(response.usuario);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao realizar login. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalizedCpf = cpf.replace(/\D/g, '');

    if (normalizedCpf.length !== 11) {
      setError('Informe um CPF válido com 11 números.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.forgotPassword(
        email,
        normalizedCpf
      );

      setMessage(
        response.mensagem +
          ' No modo de teste, confira o terminal do back-end para obter o link de recuperação.'
      );

      setMode('reset');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível solicitar a recuperação.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token.trim()) {
      setError('Cole o token de recuperação.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.resetPassword(
        token.trim(),
        newPassword
      );

      setMessage(
        response.mensagem ||
          'Senha alterada com sucesso! Você já pode entrar.'
      );

      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToken('');
      setMode('login');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível redefinir a senha. Verifique o token.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFeedback = () => (
    <>
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg border p-3 text-sm"
          style={{
            backgroundColor: highContrast ? '#000000' : '#FFF0F3',
            color: highContrast ? '#FFFF00' : '#A00028',
            borderColor: highContrast ? '#FFFF00' : '#FA003F',
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg border p-3 text-sm"
          style={{
            backgroundColor: highContrast ? '#000000' : '#F0FDF4',
            color: highContrast ? '#00FFFF' : '#166534',
            borderColor: highContrast ? '#00FFFF' : '#BBF7D0',
          }}
        >
          {message}
        </div>
      )}
    </>
  );

  const renderButton = (label: string) => (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={`
        mt-2 flex min-h-12 w-full items-center justify-center
        gap-2 rounded-lg border-2 px-4 py-3
        text-base font-bold transition-colors
        disabled:cursor-not-allowed disabled:opacity-60
        ${focusClass}
        ${
          highContrast
            ? 'border-yellow-400 bg-black text-yellow-400 hover:bg-gray-900'
            : 'border-transparent bg-[#FA003F] text-white hover:bg-[#D40036]'
        }
      `}
    >
      {loading ? (
        <>
          <Loader2
            className="h-5 w-5 animate-spin"
            aria-hidden="true"
          />
          <span>Processando...</span>
        </>
      ) : (
        label
      )}
    </button>
  );

  return (
    <main
      className={`
        flex min-h-screen flex-col items-center justify-center
        px-4 py-10 transition-colors
        ${highContrast ? 'bg-black' : 'bg-gray-50'}
      `}
    >
      {/* LOGO */}
      <header className="mb-6 text-center">
        <div
          className={`
            mx-auto mb-3 flex h-14 w-14 items-center
            justify-center rounded-full border-2 shadow-md
            ${
              highContrast
                ? 'border-yellow-400 bg-black text-yellow-400'
                : 'border-transparent bg-[#FA003F] text-white'
            }
          `}
          aria-hidden="true"
        >
          <UtensilsCrossed className="h-7 w-7" />
        </div>

        <h1 className={`text-2xl font-bold ${textClass}`}>
          Connect Food
        </h1>

        <p
          className={`mt-1 text-xs font-bold tracking-widest ${
            highContrast ? 'text-yellow-400' : 'text-[#FA003F]'
          }`}
        >
          ESCOLA SESI
        </p>
      </header>

      {/* ALTO CONTRASTE */}
      <button
        type="button"
        onClick={() =>
          onThemeChange(highContrast ? 'light' : 'high-contrast')
        }
        aria-pressed={highContrast}
        className={`
          mb-5 flex min-h-12 items-center justify-center gap-2
          rounded-lg border-2 px-4 py-2 text-sm font-bold
          ${focusClass}
          ${
            highContrast
              ? 'border-yellow-400 bg-black text-yellow-400 hover:bg-gray-900'
              : 'border-gray-400 bg-white text-gray-900 hover:bg-gray-100'
          }
        `}
      >
        <Contrast className="h-5 w-5" aria-hidden="true" />
        {highContrast
          ? 'Desativar alto contraste'
          : 'Ativar alto contraste'}
      </button>

      {/* CARTÃO */}
      <section
        aria-labelledby={
          mode === 'login'
            ? 'login-title'
            : mode === 'forgot'
              ? 'forgot-title'
              : 'reset-title'
        }
        className={`
          w-full max-w-md rounded-2xl border-2 p-6 shadow-md sm:p-8
          ${
            highContrast
              ? 'border-white bg-black'
              : 'border-transparent bg-white'
          }
        `}
      >
        <header className="mb-6 text-center">
          {mode === 'login' && (
            <>
              <h2
                id="login-title"
                className={`text-xl font-bold ${textClass}`}
              >
                Bem-vindo ao Connect Food
              </h2>

              <p className={`mt-2 text-sm ${descriptionClass}`}>
                Entre com seu e-mail institucional para continuar.
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <Mail
                className={`mx-auto mb-3 h-8 w-8 ${
                  highContrast ? 'text-yellow-400' : 'text-[#FA003F]'
                }`}
                aria-hidden="true"
              />

              <h2
                id="forgot-title"
                className={`text-xl font-bold ${textClass}`}
              >
                Recuperar senha
              </h2>

              <p className={`mt-2 text-sm ${descriptionClass}`}>
                Informe o e-mail e o CPF associados à sua conta.
              </p>
            </>
          )}

          {mode === 'reset' && (
            <>
              <KeyRound
                className={`mx-auto mb-3 h-8 w-8 ${
                  highContrast ? 'text-yellow-400' : 'text-[#FA003F]'
                }`}
                aria-hidden="true"
              />

              <h2
                id="reset-title"
                className={`text-xl font-bold ${textClass}`}
              >
                Criar nova senha
              </h2>

              <p className={`mt-2 text-sm ${descriptionClass}`}>
                Cole o token de recuperação e escolha uma nova senha.
              </p>
            </>
          )}
        </header>

        {renderFeedback()}

        {/* LOGIN */}
        {mode === 'login' && (
          <form
            onSubmit={handleLoginSubmit}
            aria-labelledby="login-title"
            aria-busy={loading}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="login-email"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                E-mail
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seunome@sesi.com"
                className={inputClass}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                Senha
              </label>

              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>

            {renderButton('Entrar')}

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => changeMode('forgot')}
                className={`
                  rounded px-2 py-2 text-sm font-bold underline
                  ${focusClass}
                  ${
                    highContrast
                      ? 'text-yellow-400 hover:text-white'
                      : 'text-[#D40036] hover:text-[#A00028]'
                  }
                `}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}

        {/* RECUPERAÇÃO */}
        {mode === 'forgot' && (
          <form
            onSubmit={handleForgotSubmit}
            aria-labelledby="forgot-title"
            aria-busy={loading}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="forgot-email"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                E-mail cadastrado
              </label>

              <input
                id="forgot-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seunome@sesi.com"
                className={inputClass}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div>
              <label
                htmlFor="forgot-cpf"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                CPF cadastrado
              </label>

              <input
                id="forgot-cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) =>
                  setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))
                }
                placeholder="Somente os 11 números"
                className={inputClass}
                maxLength={11}
                autoComplete="off"
                aria-describedby="cpf-help"
                required
              />

              <p
                id="cpf-help"
                className={`mt-2 text-sm ${descriptionClass}`}
              >
                Digite os 11 números do CPF, sem pontos ou traços.
              </p>
            </div>

            {renderButton('Solicitar recuperação')}
          </form>
        )}

        {/* REDEFINIÇÃO */}
        {mode === 'reset' && (
          <form
            onSubmit={handleResetSubmit}
            aria-labelledby="reset-title"
            aria-busy={loading}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="reset-token"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                Token de recuperação
              </label>

              <textarea
                id="reset-token"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole aqui o token do link exibido no terminal"
                className={`${inputClass} min-h-24 resize-y`}
                rows={3}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                Nova senha
              </label>

              <input
                id="new-password"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                className={inputClass}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className={`mb-2 block text-sm font-semibold ${labelClass}`}
              >
                Confirmar nova senha
              </label>

              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className={inputClass}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {renderButton('Salvar nova senha')}
          </form>
        )}

        {/* VOLTAR */}
        {mode !== 'login' && (
          <button
            type="button"
            onClick={() => changeMode('login')}
            className={`
              mt-5 flex min-h-12 w-full items-center justify-center
              gap-2 rounded-lg px-3 py-2 text-sm font-bold
              ${focusClass}
              ${
                highContrast
                  ? 'text-yellow-400 hover:bg-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Voltar ao login
          </button>
        )}
      </section>

      <p
        className={`mt-5 max-w-md text-center text-sm ${descriptionClass}`}
      >
        Connect Food · Acessibilidade para todos.
      </p>
    </main>
  );
};
