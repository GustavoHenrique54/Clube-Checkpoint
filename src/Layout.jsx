import { db } from "@/api/supabaseClient";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Gamepad2, User, Shield, LogOut, Menu, X, Trophy, Users, Sun, Moon } from "lucide-react";

const PUBLIC_PAGES = ["Landing", "PublicProfile"];

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
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, [theme]);

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
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-script text-white/80 italic font-light tracking-wide">clube</span>
                <span className="text-xl font-black text-white uppercase tracking-tight" style={{ textShadow: "2px 2px 0  rgba(0,0,0,0.3)" }}>CHECKPOINT</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 text-white/60 hover:text-white rounded-full transition-all" title="Alternar Tema">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
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
    { name: "Placar", href: "/Leaderboard", icon: Trophy },
    { name: "Buscar Membros", href: "/SearchProfiles", icon: Users },
    { name: "Amigos", href: "/Friends", icon: Users },
    { name: "Meu Perfil", href: "/perfil", icon: User },
  ];

  if (isAdmin) {
    navigation.push({ name: "Configurações", href: "/AdminLandingConfig", icon: Shield });
  }

  return (
    <div className="min-h-screen bg-ps-dark-canvas text-white flex flex-col md:flex-row">
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-ps-dark-elevated border-b border-white/10 fixed top-0 w-full z-40">
        <Link to="/hub" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-white uppercase">CHECKPOINT</span>
        </Link>
        <div className="flex items-center gap-2">
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
            <span className="text-xl font-black tracking-tight text-white uppercase">CHECKPOINT</span>
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-ps-dark-canvas/95 backdrop-blur-md z-30 md:hidden flex flex-col pt-20 px-6 space-y-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-full text-lg font-bold uppercase transition-all ${
                  isActive ? "bg-ps-blue text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-6 h-6" />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 px-4 py-4 rounded-full text-lg font-bold uppercase text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
          >
            <LogOut className="w-6 h-6" />
            Sair
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}