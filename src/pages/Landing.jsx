import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, Star, ArrowRight, Shield, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
{
  icon: Trophy,
  title: "Conquistas Colecionáveis",
  description: "Ganhe emblemas por cada marco — games concluídos, encontros e conquistas especiais."
},
{
  icon: Users,
  title: "Perfis da Comunidade",
  description: "Monte seu perfil gamer e mostre sua jornada no clube para todos."
},
{
  icon: Star,
  title: "Sistema de Raridade",
  description: "De Comum a Lendário — os emblemas têm raridades que refletem sua dedicação."
},
{
  icon: Shield,
  title: "Acompanhe seu Progresso",
  description: "Veja sua participação, games concluídos e encontros frequentados em um só lugar."
}];

export default function Landing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.isAuthenticated().then((auth) => {
      if (auth) db.auth.me().then(setUser);
    });
  }, []);

  const { data: configRecords = [] } = useQuery({
    queryKey: ["landingConfig"],
    queryFn: () => db.entities.LandingConfig.list()
  });
  const config = configRecords[0];

  const { data: news = [] } = useQuery({
    queryKey: ["clubNews"],
    queryFn: () => db.entities.ClubNews.list("-created_date")
  });
  const publishedNews = news.filter((n) => n.is_published).slice(0, 3);

  // Inject custom fonts
  const subtitleStyle = {
    fontFamily: config?.subtitle_font_url ? "'CustomSubtitle', serif" : undefined,
    fontSize: config?.subtitle_size || undefined
  };

  const titleStyle = {
    fontFamily: config?.title_font_url ? "'CustomTitle', sans-serif" : undefined,
    fontSize: config?.title_size || undefined
  };

  return (
    <div className="min-h-screen text-white font-sans bg-ps-dark-canvas overflow-x-hidden">
      {config?.subtitle_font_url &&
      <style>{`@font-face { font-family: 'CustomSubtitle'; src: url('${config.subtitle_font_url}'); }`}</style>
      }
      {config?.title_font_url &&
      <style>{`@font-face { font-family: 'CustomTitle'; src: url('${config.title_font_url}'); }`}</style>
      }

      {/* Hero Chapter (Dark Canvas) */}
      <section className="relative overflow-hidden bg-ps-dark-canvas border-b border-white/10 py-24 sm:py-32 flex items-center justify-center">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}>

            {/* Club Logo Block */}
            <div className="mb-10">
              <p 
                className="text-white text-5xl font-light text-center tracking-[0.05em] sm:text-7xl md:text-5xl font-display uppercase" 
                style={subtitleStyle}
              >
                {config?.hero_subtitle || "clube"}
              </p>
              <h1 
                className="text-white text-6xl font-light tracking-[0.02em] sm:text-8xl md:text-9xl font-display uppercase"
                style={titleStyle}
              >
                {config?.hero_title || "CHECKPOINT"}
              </h1>
              <p className="mt-4 text-ps-blue font-bold uppercase tracking-widest text-sm sm:text-base">
                {config?.hero_tagline || 'O CLUBE "DO LIVRO" DE GAMES'}
              </p>
            </div>

            <p className="mt-6 text-base sm:text-lg text-white/70 max-w-lg mx-auto leading-relaxed font-sans">
              {config?.hero_description || "Jogue junto, discuta seus games favoritos e construa sua coleção de conquistas no clube."}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ?
              <>
                <Link to={createPageUrl("Profile")}>
                  <Button className="bg-ps-blue text-white hover:bg-ps-blue-pressed px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-full inline-flex items-center justify-center gap-2 transition-all h-12 shadow-md border-none">
                    Meu Perfil <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to={createPageUrl("ClubHub")}>
                  <Button className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-full inline-flex items-center justify-center gap-2 transition-all h-12">
                    Hub do Clube
                  </Button>
                </Link>
              </> :
              <>
                <Button
                  onClick={() => db.auth.redirectToLogin()}
                  className="bg-ps-blue text-white hover:bg-ps-blue-pressed px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-full inline-flex items-center justify-center gap-2 transition-all h-12 shadow-md border-none"
                >
                  Entrar no Clube <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => db.auth.redirectToLogin()}
                  className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-full inline-flex items-center justify-center gap-2 transition-all h-12"
                >
                  Já tenho conta
                </Button>
              </>
              }
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Chapter (Light Canvas) */}
      <section className="bg-ps-light-canvas text-ps-dark-canvas py-24 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-light uppercase tracking-wide text-ps-dark-canvas">
              {config?.features_title || "Como Funciona"}
            </h2>
            <p className="text-black/60 mt-3 max-w-md mx-auto text-sm">
              {config?.features_subtitle || "Entre no clube, participe das atividades e veja seu perfil crescer."}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) =>
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-ps-light-card border border-gray-200/50 rounded-md p-6 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-ps-blue/10 flex items-center justify-center mb-4 group-hover:bg-ps-blue/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-ps-blue" />
                </div>
                <h3 className="text-base font-bold text-ps-dark-canvas uppercase tracking-wide">{feature.title}</h3>
                <p className="text-sm text-black/60 mt-2 leading-relaxed">{feature.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Latest News Chapter (Dark Canvas Elevated) */}
      {publishedNews.length > 0 &&
        <section className="bg-ps-dark-elevated py-24 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-12 justify-center sm:justify-start">
              <Newspaper className="w-6 h-6 text-ps-blue" />
              <h2 className="text-2xl sm:text-3xl font-display font-light text-white uppercase tracking-wide">
                {config?.news_section_title || "Últimas Notícias"}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedNews.map((item, i) =>
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-ps-dark-card border border-white/10 rounded-md overflow-hidden hover:bg-white/5 transition-all group"
                >
                  {item.cover_image &&
                    <div className="h-40 overflow-hidden relative">
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  }
                  <div className="p-5">
                    <p className="text-white/40 text-xs mb-2 font-mono">
                      {new Date(item.created_date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h3 className="font-bold text-white text-base leading-tight mt-1 group-hover:text-ps-blue transition-colors line-clamp-2">{item.title}</h3>
                    {item.excerpt && <p className="text-white/60 text-xs mt-2 line-clamp-2">{item.excerpt}</p>}
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="mt-12 text-center">
              <Link to={createPageUrl("ClubHub")}>
                <Button className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all">
                  Ver todas as notícias <ArrowRight className="w-4 h-4 ml-1 inline" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      }

      {/* CTA Chapter (PlayStation Blue Band) */}
      <section className="bg-ps-blue py-20 text-center text-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-light uppercase tracking-wide">
            {config?.cta_title || "Pronto para Começar?"}
          </h2>
          <p className="text-white/80 mt-4 max-w-md mx-auto text-sm leading-relaxed">
            {config?.cta_description || "Crie seu perfil e comece a colecionar emblemas que contam a história das suas aventuras gamer."}
          </p>
          <Button
            onClick={() => db.auth.redirectToLogin()} 
            className="bg-white text-ps-blue hover:bg-gray-100 mt-8 px-10 py-3 text-sm font-bold uppercase tracking-wider rounded-full inline-flex items-center justify-center gap-2 transition-all h-12 shadow-md border-none"
          >
            {config?.cta_button_text || "Começar Agora"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ps-dark-canvas py-12 text-white border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-white/55 uppercase tracking-widest font-mono">clube</span>
            <span className="font-display font-light text-white text-lg tracking-wider">CHECKPOINT</span>
          </div>
          <p className="text-xs text-white/40 font-mono">© {new Date().getFullYear()} Clube Checkpoint. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}