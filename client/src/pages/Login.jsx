import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Store, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('admin@crm.local');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(role) {
    if (role === 'admin') {
      setEmail('admin@crm.local');
      setPassword('AdminPassword123!');
    } else {
      setEmail('agent@crm.local');
      setPassword('AgentPassword123!');
    }
    setErrorMessage('');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-indigo/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-indigo to-indigo-400 items-center justify-center text-white shadow-xl shadow-brand-indigo/30 mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Merqanta</h1>
          <p className="text-sm text-slate-400 mt-1.5">Sign in to manage customers, orders, and commerce retention</p>
        </div>

        <Card className="border-slate-800 bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base text-slate-900">CRM Authentication</CardTitle>
            <CardDescription>Enter your credentials to access the workspace</CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@crm.local"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />

              <Button
                type="submit"
                variant="default"
                size="md"
                isLoading={loading}
                className="w-full bg-brand-dark hover:bg-slate-900 text-white font-semibold py-2.5"
              >
                Sign In to CRM
              </Button>
            </form>

            {/* Demo Quick-Fill Buttons */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Instant Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFill('admin')}
                  className="text-xs border-slate-200 text-slate-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-indigo" />
                  Admin User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFill('agent')}
                  className="text-xs border-slate-200 text-slate-700"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  Staff Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Merqanta &bull; Supabase Database (managed PostgreSQL) &bull; Prisma ORM
        </p>
      </div>
    </div>
  );
}
