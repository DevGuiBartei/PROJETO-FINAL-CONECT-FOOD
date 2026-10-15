
import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Loader2,
  ArrowLeft,
  KeyRound,
  Mail,
} from 'lucide-react';
import { api } from '../../services/api';
import type { User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

type ViewMode = 'login' | 'forgot' | 'reset';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<ViewMode>('login');

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
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
      const response = await api.forgotPassword(email, normalizedCpf);

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

  const handleResetSubmit = async (e: React.FormEvent) => {
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
        response.mensagem || 'Senha alterada com sucesso! Você já pode entrar.'
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

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-gray-400';

  const renderFeedback = () => (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 text-xs rounded-lg"
          style={{
            backgroundColor: '#FFF0F3',
            color: '#FA003F',
            border: '1px solid #FA003F',
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-4 p-3 text-xs rounded-lg"
          style={{
            backgroundColor: '#F0FDF4',
            color: '#166534',
            border: '1px solid #BBF7D0',
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
      className="w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
      style={{ backgroundColor: '#FA003F' }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.backgroundColor = '#D40036';
      }}
      onMouseLeave={(e) => {
        if (!loading) e.currentTarget.style.backgroundColor = '#FA003F';
      }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processando...</span>
        </>
      ) : (
        label
      )}
    </button>
  );

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12"
      style={{ backgroundColor: '#FAFAFA' }}
    >
      {/* LOGO */}
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white mx-auto shadow-md mb-3"
          style={{ backgroundColor: '#FA003F' }}
        >
          <UtensilsCrossed className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Connect Food
        </h1>

        <p
          className="text-xs font-semibold tracking-widest uppercase mt-0.5"
          style={{ color: '#FA003F' }}
        >
          ESCOLA SESI
        </p>
      </div>

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-gray-900">
                Bem-vindo ao Connect Food
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Entre com seu e-mail institucional para continuar.
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <Mail
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: '#FA003F' }}
              />
              <h2 className="text-xl font-bold text-gray-900">
                Recuperar senha
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Informe o e-mail e o CPF associados à sua conta.
              </p>
            </>
          )}

          {mode === 'reset' && (
            <>
              <KeyRound
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: '#FA003F' }}
              />
              <h2 className="text-xl font-bold text-gray-900">
                Criar nova senha
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Cole o token de recuperação e escolha uma nova senha.
              </p>
            </>
          )}
        </div>

        {renderFeedback()}

        {/* LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seunome@sesi.com"
                className={inputClass}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
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

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => changeMode('forgot')}
                className="text-xs font-medium hover:underline"
                style={{ color: '#FA003F' }}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}

        {/* SOLICITAR RECUPERAÇÃO */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                E-mail cadastrado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seunome@sesi.com"
                className={inputClass}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                CPF cadastrado
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) =>
                  setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))
                }
                placeholder="Somente os 11 números"
                className={inputClass}
                maxLength={11}
                required
              />
            </div>

            {renderButton('Solicitar recuperação')}
          </form>
        )}

        {/* REDEFINIR SENHA */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Token de recuperação
              </label>
              <textarea
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nova senha
              </label>
              <input
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirmar nova senha
              </label>
              <input
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
            className="w-full mt-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </button>
        )}
      </div>
    </div>
  );
};
