import { db } from "@/api/supabaseClient";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Gamepad2, User, Shield, LogOut, Menu, X, Trophy, Users, Sun, Moon, Library, Settings, Coffee, Heart } from "lucide-react";
import Logo from "@/components/Logo";

const PUBLIC_PAGES = ["Landing", "PublicProfile", "IndieRecommendations"];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    if (currentPageName === "IndieRecommendations") {
      document.documentElement.classList.add("dark");
      return;
    }
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, [theme, currentPageName]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await db.auth.isAuthenticated();
        if (isAuth) {
          const me = await db.auth.me();
          setUser(me);
        }
      } catch (e) {
        console.error("Auth initialization failed:", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await db.auth.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    setUser(null);
    navigate("/");
  };

  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-ps-dark-canvas text-white ckpnt-pattern">
        <nav className="fixed top-0 w-full z-50 bg-ps-dark-canvas/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="auto" className="h-8 sm:h-9 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              {currentPageName !== "IndieRecommendations" && (
                <button onClick={toggleTheme} className="p-2 text-white/60 hover:text-white rounded-full transition-all" title="Alternar Tema">
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}
              {user ? (
                <>
                  <Link to="/perfil">
                    <button className="px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 bg-white/5 text-sm font-bold transition-all">
                      Perfil
                    </button>
                  </Link>
                  <Link to="/hub">
                    <button className="px-5 py-2 rounded-full bg-ps-blue text-white hover:bg-ps-blue-pressed text-sm font-bold transition-all">
                      Entrar no Hub
                    </button>
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => db.auth.redirectToLogin(window.location.href)}
                  className="px-5 py-2 rounded-full bg-ps-blue text-white hover:bg-ps-blue-pressed text-sm font-bold transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>
        <div className="pt-16">
          {children}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  const navigation = [
    { name: "Hub do Clube", href: "/hub", icon: Gamepad2 },
    { name: "Jogos", href: "/ConsideredGames", icon: Library },
    { name: "Placar", href: "/Leaderboard", icon: Trophy },
    { name: "Buscar Membros", href: "/SearchProfiles", icon: Users },
    { name: "Amigos", href: "/Friends", icon: Users },
    { name: "Meu Perfil", href: "/perfil", icon: User },
  ];

  if (isAdmin) {
    navigation.push({ name: "Painel Admin", href: "/AdminDashboard", icon: Shield });
    navigation.push({ name: "Configurações", href: "/AdminLandingConfig", icon: Settings });
  }

  return (
    <div className="min-h-screen bg-ps-dark-canvas text-white flex flex-col md:flex-row">
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-ps-dark-elevated border-b border-white/10 fixed top-0 w-full z-40">
        <Link to="/hub" className="flex items-center gap-2">
          <Logo variant="auto" className="h-7 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="https://ko-fi.com/clubecheckpoint"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 px-3 bg-amber-500/20 text-amber-400 border border-amber-400/40 rounded-full flex items-center gap-1.5 text-xs font-black uppercase tracking-wider hover:bg-amber-500/30 transition-all shadow-xs"
            title="Apoie no Ko-fi"
          >
            <Coffee className="w-3.5 h-3.5 fill-current" />
            <span>Apoie</span>
          </a>
          <button onClick={toggleTheme} className="p-2 text-white/60 hover:text-white rounded-full transition-all" title="Alternar Tema">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white hover:bg-white/10 rounded-full">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-ps-dark-elevated border-r border-white/10 h-screen sticky top-0">
        <div className="p-6">
          <Link to="/hub" className="flex items-center gap-2">
            <Logo variant="auto" className="h-9 w-auto object-contain" />
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold uppercase transition-all ${
                  isActive ? "bg-ps-blue text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Ko-fi Donation Area */}
        <div className="px-4 py-2.5 mx-3 mb-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-ps-blue/15 border border-white/10 hover:border-amber-400/40 transition-all duration-200 group relative">
          <a
            href="https://ko-fi.com/clubecheckpoint"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-ps-dark flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
                <Coffee className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-amber-400 leading-none truncate">Apoie o Clube</span>
                <span className="text-[9px] font-bold text-white/50 lowercase truncate">ko-fi.com/clubecheckpoint</span>
              </div>
            </div>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30 group-hover:scale-110 transition-transform shrink-0" />
          </a>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 bg-ps-dark-card border border-white/15 rounded-xl text-[11px] text-white/90 leading-relaxed shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50 text-center font-medium">
            Qualquer doação é muito bem-vinda, toda ajuda será usada para elevar o nível dos conteúdos do clube e levá-lo adiante!
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-ps-dark-card border-r border-b border-white/15 rotate-45" />
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-ps-blue border-2 border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-white">{(user?.display_name || user?.username || "?")[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{user?.display_name || user?.username || "Membro"}</p>
              {isAdmin && (
                <span className="text-[10px] text-yellow-400 font-bold uppercase flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={toggleTheme} className="p-2 text-white/55 hover:text-white hover:bg-white/5 rounded-full" title="Alternar Tema">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="p-2 text-white/55 hover:text-white hover:bg-white/5 rounded-full flex-shrink-0" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Dropdown (Compact, Solid Theme BG, Non-Full-Screen) */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 md:hidden bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-16 right-3 left-3 sm:left-auto sm:w-72 z-50 md:hidden bg-ps-dark-elevated text-white border border-white/15 rounded-2xl p-3 shadow-2xl space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive ? "bg-ps-blue text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile Ko-fi Link (Compact) */}
            <a
              href="https://ko-fi.com/clubecheckpoint"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/30 text-amber-300 hover:border-amber-400/50 transition-all mt-1"
            >
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 fill-current text-amber-400" />
                <span>Apoiar no Ko-fi</span>
              </div>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
            </a>

            <div className="pt-2 border-t border-white/10 mt-1 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-ps-blue border border-white/20 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  {(user?.display_name || user?.username || "?")[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-bold text-white/80 truncate">{user?.display_name || user?.username || "Membro"}</span>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase text-red-400 hover:bg-red-500/10 transition-all"
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}