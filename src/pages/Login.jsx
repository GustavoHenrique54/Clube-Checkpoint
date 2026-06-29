import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gamepad2, AlertCircle } from "lucide-react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/hub";

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      navigate(redirectPath);
    } catch (err) {
      setErrorMsg(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (!username.trim()) throw new Error("O nome de usuário é obrigatório.");
      if (!displayName.trim()) throw new Error("O nome de exibição é obrigatório.");

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim().toLowerCase(),
            display_name: displayName.trim(),
          }
        }
      });

      if (error) throw error;

      // Supabase email confirmation might be enabled, check user status
      if (data?.user?.identities?.length === 0) {
        throw new Error("Este e-mail já está cadastrado.");
      }

      setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail para confirmação.");
      // Auto-switch to login mode after register
      setTimeout(() => {
        setIsSignUp(false);
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setErrorMsg(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-ps-blue/10 to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-ps-dark-card border border-white/10 rounded-md p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-ps-blue rounded-full flex items-center justify-center mb-3">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white">Clube Checkpoint</h1>
          <p className="text-xs text-white/50 tracking-wider uppercase mt-1 font-mono">
            {isSignUp ? "Criar nova conta" : "Iniciar Sessão"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-green-950/40 border border-green-500/20 text-green-400 text-xs rounded-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-white/60 tracking-wider mb-1.5">Endereço de E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-ps-blue rounded-sm"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/60 tracking-wider mb-1.5">Nome de Usuário (@id)</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: holodecoy"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-ps-blue rounded-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/60 tracking-wider mb-1.5">Nome de Exibição</label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ex: Hamilton de Campos"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-ps-blue rounded-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-white/60 tracking-wider mb-1.5">Senha de Acesso</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-ps-blue rounded-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold rounded-full py-2.5 mt-2 uppercase text-xs tracking-wider border-none shadow-md"
          >
            {loading ? "Processando..." : isSignUp ? "Registrar Conta" : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-xs text-ps-blue hover:underline hover:text-white transition-colors"
          >
            {isSignUp ? "Já tem uma conta? Iniciar Sessão" : "Não tem uma conta? Cadastre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}
