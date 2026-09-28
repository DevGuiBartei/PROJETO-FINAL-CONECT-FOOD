import React, { useState } from 'react';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import type { User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (
    e: React.FormEvent,
    customEmail?: string,
    customPass?: string
  ) => {
    e.preventDefault();
    setError('');

    const targetEmail = customEmail || email;
    const targetPassword = customPass || password;

    if (!targetEmail) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!targetPassword) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(targetEmail, targetPassword);
      onLoginSuccess(response.usuario);
    } catch (err: any) {
      setError(
        err.message || 'Erro ao realizar login. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

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

          <h2 className="text-xl font-bold text-gray-900">
            Bem-vindo ao Connect Food
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Entre com seu e-mail institucional para continuar.
          </p>

        </div>

        {/* ERRO */}
        {error && (
          <div
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

        <form onSubmit={handleLoginSubmit} className="space-y-4">

          {/* E-MAIL */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seunome@sesi.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none transition-all placeholder:text-gray-400"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FA003F';
                e.currentTarget.style.boxShadow =
                  '0 0 0 2px rgba(250, 0, 63, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.boxShadow = '';
              }}
              required
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Senha
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none transition-all placeholder:text-gray-400"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FA003F';
                e.currentTarget.style.boxShadow =
                  '0 0 0 2px rgba(250, 0, 63, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.boxShadow = '';
              }}
              required
            />
          </div>

          {/* BOTÃO ENTRAR */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm focus:outline-none mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#FA003F' }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#D40036';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#FA003F';
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>

          {/* ESQUECI MINHA SENHA */}
          <div className="text-center pt-2">

            <button
              type="button"
              onClick={() =>
                alert(
                  'Função de recuperação de senha: Entre em contato com a Secretaria Sesi.'
                )
              }
              className="text-xs font-medium hover:underline"
              style={{ color: '#FA003F' }}
            >
              Esqueci minha senha
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};
