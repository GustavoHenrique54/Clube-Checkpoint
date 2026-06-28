const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

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
  const gradientFrom = config?.gradient_from || "#0f2566";
  const gradientMid = config?.gradient_mid || "#1d4ed8";
  const gradientTo = config?.gradient_to || "#3b82f6";
  const bgStyle = { background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientMid} 60%, ${gradientTo} 100%)` };

  const subtitleStyle = {
    fontFamily: config?.subtitle_font_url ? "'CustomSubtitle', serif" : "'Georgia', serif",
    letterSpacing: "0.05em",
    fontSize: config?.subtitle_size || undefined
  };

  const titleStyle = {
    fontFamily: config?.title_font_url ? "'CustomTitle', sans-serif" : undefined,
    textShadow: "4px 4px 0 rgba(0,0,0,0.35), 8px 8px 0 rgba(0,0,0,0.15)",
    letterSpacing: "-0.02em",
    WebkitTextStroke: "2px rgba(0,0,0,0.15)",
    fontSize: config?.title_size || undefined
  };

  return (
    <div className="min-h-screen ckpnt-pattern" style={bgStyle}>
      {config?.subtitle_font_url &&
      <style>{`@font-face { font-family: 'CustomSubtitle'; src: url('${config.subtitle_font_url}'); }`}</style>
      }
      {config?.title_font_url &&
      <style>{`@font-face { font-family: 'CustomTitle'; src: url('${config.title_font_url}'); }`}</style>
      }

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}>

            {/* Club Logo Block */}
            <div className="mb-10">
              <p className="text-white text-5xl font-thin text-left tracking-[0.15em] sm:text-8xl md:text-6xl whitespace-nowrap !tracking-[0.04em] ![text-shadow:none] ![-webkit-text-stroke:0] px-16 md:px-64" style={subtitleStyle}>
                {config?.hero_subtitle || "clube"}
              </p>
              <h1 className="text-white text-7xl font-thin tracking-[0.15em] sm:text-2xl md:text-8xl whitespace-nowrap !tracking-[0.04em] ![text-shadow:none] ![-webkit-text-stroke:0]"

              style={titleStyle}>

                {config?.hero_title || "CHECKPOINT"}
              </h1>
              <p
                className="mt-3 text-white font-bold uppercase tracking-widest text-base sm:text-lg"
                style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>

                {config?.hero_tagline || 'O CLUBE "DO LIVRO" DE GAMES'}
              </p>
            </div>

            <p className="mt-6 text-lg text-white/75 max-w-lg mx-auto leading-relaxed">
              {config?.hero_description || "Jogue junto, discuta seus games favoritos e construa sua coleção de conquistas no clube."}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ?
              <>
                  <Link to={createPageUrl("Profile")}>
                    <Button size="lg" className="bg-white text-blue-700 px-10 py-2 text-base font-black uppercase tracking-wide rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-blue-50 h-13 shadow-lg">
                      Meu Perfil <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("ClubHub")}>
                    <Button size="lg" variant="outline" className="bg-transparent text-white px-12 py-2 text-base font-bold rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground border-white/40 hover:bg-white/10 h-13">
                      Hub do Clube
                    </Button>
                  </Link>
                </> :

              <>
                  <Button
                  size="lg"
                  onClick={() => db.auth.redirectToLogin()}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-black px-10 h-13 text-base uppercase tracking-wide shadow-lg">

                    Entrar no Clube
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                  size="lg"
                  variant="outline"
                  onClick={() => db.auth.redirectToLogin()}
                  className="border-white/40 text-white bg-transparent hover:bg-white/10 px-10 h-13 text-base font-bold">

                    Já tenho conta
                  </Button>
                </>
              }
            </div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-white/10 max-w-5xl mx-auto" />

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-black text-white uppercase"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.25)" }}>

            {config?.features_title || "Como Funciona"}
          </h2>
          <p className="text-white/65 mt-3 max-w-md mx-auto">
            {config?.features_subtitle || "Entre no clube, participe das atividades e veja seu perfil crescer."}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) =>
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 hover:bg-white/15 transition-all group">

              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-white/65 mt-2 leading-relaxed">{feature.description}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Latest News */}
      {publishedNews.length > 0 &&
      <>
          <div className="w-full h-px bg-white/10 max-w-5xl mx-auto" />
          <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
              <Newspaper className="w-6 h-6 text-white" />
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase" style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.25)" }}>
                {config?.news_section_title || "Últimas Notícias"}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publishedNews.map((item, i) =>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden hover:bg-white/15 transition-all group">

                  {item.cover_image &&
              <div className="h-36 overflow-hidden">
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
              }
                  <div className="p-5">
                    <p className="text-white/40 text-xs mb-2">
                      {new Date(item.created_date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h3 className="font-black text-white text-sm leading-tight">{item.title}</h3>
                    {item.excerpt && <p className="text-white/60 text-xs mt-2 line-clamp-2">{item.excerpt}</p>}
                  </div>
                </motion.div>
            )}
            </div>
            <div className="mt-6 text-center">
              <Link to={createPageUrl("ClubHub")}>
                <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold">
                  Ver todas as notícias <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </section>
        </>
      }

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 p-12 text-center">
          <h2
            className="text-3xl font-black text-white uppercase"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.25)" }}>

            {config?.cta_title || "Pronto para Começar?"}
          </h2>
          <p className="text-white/70 mt-4 max-w-md mx-auto">
            {config?.cta_description || "Crie seu perfil e comece a colecionar emblemas que contam a história das suas aventuras gamer."}
          </p>
          <Button
            size="lg"
            onClick={() => db.auth.redirectToLogin()} className="bg-white text-blue-700 mt-8 px-10 py-8 text-base font-black uppercase tracking-wide rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-50 shadow-lg">

            {config?.cta_button_text || "Começar Agora"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-white/60 italic" style={subtitleStyle}>clube</span>
            <span className="font-black text-white uppercase text-sm" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>CHECKPOINT</span>
          </div>
          <p className="text-sm text-white/40">© {new Date().getFullYear()} Clube Checkpoint. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>);

}