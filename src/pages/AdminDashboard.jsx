const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Trophy, Award, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => db.entities.User.list(),
    enabled: user?.role === "admin",
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: () => db.entities.Badge.list(),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["allUserBadges"],
    queryFn: () => db.entities.UserBadge.list(),
    enabled: user?.role === "admin",
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase">Acesso Negado</h2>
          <p className="text-white/60 mt-2">Você precisa de permissões de admin.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Membros", value: users.length, icon: Users },
    { label: "Emblemas", value: badges.length, icon: Trophy },
    { label: "Concedidos", value: userBadges.length, icon: Award },
  ];

  const recentGrants = [...userBadges].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-white" />
        <h1 className="text-2xl font-black text-white uppercase" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>Painel Admin</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 text-center">
            <stat.icon className="w-8 h-8 text-white mx-auto mb-3" />
            <p className="text-4xl font-black text-white">{stat.value}</p>
            <p className="text-sm text-white/60 font-bold uppercase tracking-wide mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "AdminUsers", icon: Users, label: "Gerenciar Membros", desc: "Ver e conceder emblemas" },
          { to: "AdminBadges", icon: Trophy, label: "Gerenciar Emblemas", desc: "Criar e editar emblemas" },
          { to: "AdminGrantBadge", icon: Award, label: "Conceder Emblema", desc: "Dar emblemas a membros" },
          { to: "AdminBatchBadge", icon: Award, label: "Emblemas em Lote", desc: "Conceder/revogar para vários membros" },
          { to: "AdminLandingConfig", icon: Shield, label: "Visual da Landing", desc: "Fonts e estilo da página inicial" },
        ].map((item) => (
          <Link
            key={item.to}
            to={createPageUrl(item.to)}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 hover:bg-white/20 transition-all group"
          >
            <item.icon className="w-6 h-6 text-white mb-3" />
            <h3 className="font-black text-white uppercase text-sm">{item.label}</h3>
            <p className="text-sm text-white/55 mt-1">{item.desc}</p>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white mt-3 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <h2 className="text-lg font-black text-white uppercase mb-4">Últimos Emblemas Concedidos</h2>
        {recentGrants.length === 0 ? (
          <p className="text-white/50 text-sm">Nenhum emblema concedido ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentGrants.map((ub) => {
              const badge = badges.find(b => b.id === ub.badge_id);
              const member = users.find(u => u.id === ub.user_id);
              return (
                <div key={ub.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      {badge?.icon_image ? <img src={badge.icon_image} alt="" className="w-5 h-5 object-contain" /> : <span>🏆</span>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{badge?.name || "Desconhecido"}</p>
                      <p className="text-xs text-white/50">Concedido a {member?.full_name || "Desconhecido"}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">{new Date(ub.created_date).toLocaleDateString("pt-BR")}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}