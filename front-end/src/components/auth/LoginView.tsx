import React, { useState } from 'react';
import { UtensilsCrossed, KeyRound, UserCheck, Loader2 } from 'lucide-react';
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

  const handleLoginSubmit = async (e: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
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
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    handleLoginSubmit(null as any, demoEmail, '123456');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-b from-emerald-50 via-green-50/30 to-emerald-100/40 py-12">
      {/* Top Logo Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white mx-auto shadow-md mb-3">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Food</h1>
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase mt-0.5">
          ESCOLA SESI
        </p>
      </div>

      {/* Main Login Form Card */}
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-emerald-100">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Bem-vindo ao Connect Food</h2>
          <p className="text-xs text-gray-500 mt-1">
            Entre com seu e-mail institucional para continuar.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seunome@sesi.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 mt-2 flex items-center justify-center gap-2"
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

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => alert('Função de recuperação de senha: Entre em contato com a Secretaria Sesi.')}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>
      </div>

      {/* Demo Credentials Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xs rounded-xl p-5 mt-4 border border-emerald-100 text-center shadow-xs">
        <div className="flex items-center justify-center gap-1.5 text-gray-700 text-xs font-semibold mb-3">
          <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acessos de demonstração (senha: 123456)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            disabled={loading}
            onClick={() => handleDemoSelect('aluno@sesi.com')}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-colors border border-emerald-100 group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">Aluno</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">aluno@sesi.com</p>
          </button>

          <button
            disabled={loading}
            onClick={() => handleDemoSelect('nutri@sesi.com')}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-colors border border-emerald-100 group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">Nutricionista</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">nutri@sesi.com</p>
          </button>

          <button
            disabled={loading}
            onClick={() => handleDemoSelect('direcao@sesi.com')}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-colors border border-emerald-100 group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">Direção</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">direcao@sesi.com</p>
          </button>
        </div>
      </div>
    </div>
  );
};
