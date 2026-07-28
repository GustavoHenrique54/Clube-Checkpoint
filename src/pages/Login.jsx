import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gamepad2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

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

  const formatAuthError = (msg) => {
    if (!msg) return "Ocorreu um erro inesperado.";
    const lower = msg.toLowerCase();
    if (lower.includes("email rate limit exceeded")) {
      return "Limite de envio de e-mails atingido no servidor Supabase (limite de confirmações por hora). Por favor, aguarde alguns minutos antes de tentar novamente, ou desative a 'Confirmação por E-mail' no painel do Supabase (Authentication -> Providers -> Email -> Confirm Email).";
    }
    if (lower.includes("user already registered") || lower.includes("already exists")) {
      return "Este e-mail já está cadastrado no sistema.";
    }
    if (lower.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos. Verifique suas credenciais.";
    }
    if (lower.includes("password should be at least")) {
      return "A senha deve conter no mínimo 6 caracteres.";
    }
    return msg;
  };

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
      setErrorMsg(formatAuthError(err.message));
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

      // Check if user already exists
      if (data?.user?.identities?.length === 0) {
        throw new Error("Este e-mail já está cadastrado.");
      }

      // Try to ensure public profile row exists in Supabase profiles table
      if (data?.user) {
        try {
          const { data: existingProf } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();

          if (!existingProf) {
            await supabase.from('profiles').insert([{
              id: data.user.id,
              email: email.trim(),
              username: username.trim().toLowerCase(),
              display_name: displayName.trim(),
              role: 'member'
            }]);
          }
        } catch (profErr) {
          console.warn("Could not pre-create profile row:", profErr);
        }
      }

      if (data?.session) {
        // Direct login succeeded (email confirmation was disabled)
        navigate(redirectPath);
        return;
      }

      setSuccessMsg("Conta criada com sucesso! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      setTimeout(() => {
        setIsSignUp(false);
        setSuccessMsg("");
      }, 6000);
    } catch (err) {
      setErrorMsg(formatAuthError(err.message));
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
          <Logo variant="white" className="h-10 w-auto object-contain mb-3" />
          <p className="text-xs text-white/50 tracking-wider uppercase font-mono">
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
