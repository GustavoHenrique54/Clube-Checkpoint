import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Lock, Users, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const rarityConfig = {
  common: { color: "text-slate-300", bg: "bg-slate-400/15", border: "border-slate-400/30", label: "Comum" },
  uncommon: { color: "text-green-300", bg: "bg-green-400/15", border: "border-green-400/30", label: "Incomum" },
  rare: { color: "text-blue-200", bg: "bg-blue-300/15", border: "border-blue-300/30", label: "Raro" },
  epic: { color: "text-purple-300", bg: "bg-purple-400/15", border: "border-purple-400/30", label: "Épico" },
  legendary: { color: "text-yellow-300", bg: "bg-yellow-400/15", border: "border-yellow-400/30", label: "Lendário" },
};

const categoryLabels = {
  participation: "Participação",
  game_completion: "Game Concluído",
  events: "Eventos",
  founder: "Fundador",
  special: "Especial",
  secret: "Secreto",
  veteran: "Veterano",
};

export default function BadgeDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const badgeId = urlParams.get("id");
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.isAuthenticated().then(async (isAuth) => {
      if (isAuth) setUser(await db.auth.me());
    });
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ["badge", badgeId],
    queryFn: () => db.entities.Badge.filter({ id: badgeId }),
    enabled: !!badgeId,
  });

  const badge = badges[0];

  const { data: allUserBadges = [] } = useQuery({
    queryKey: ["allUserBadgesForBadge", badgeId],
    queryFn: () => db.entities.UserBadge.filter({ badge_id: badgeId }),
    enabled: !!badgeId,
  });

  const { data: myUserBadges = [] } = useQuery({
    queryKey: ["myBadge", badgeId, user?.id],
    queryFn: () => db.entities.UserBadge.filter({ user_id: user.id, badge_id: badgeId }),
    enabled: !!user?.id && !!badgeId,
  });

  if (!badge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
  const earned = myUserBadges.length > 0;
  const earnedDate = myUserBadges[0]?.created_date;
  const earnedNote = myUserBadges[0]?.note;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-semibold">Voltar</span>
      </button>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden">
        {/* Badge Hero */}
        <div className={`p-8 text-center ${rarity.bg} border-b ${rarity.border}`}>
          <div className={`w-24 h-24 rounded-2xl mx-auto flex items-center justify-center ${rarity.bg} border-2 ${rarity.border} ${earned ? `rarity-glow-${badge.rarity}` : "opacity-50"}`}>
            {badge.icon_image ? (
              <img src={badge.icon_image} alt={badge.name} className="w-14 h-14 object-contain" />
            ) : (
              <Trophy className="w-16 h-16 text-slate-400 mx-auto" />
            )}
          </div>
          <h1 className="text-2xl font-black text-white mt-4 uppercase" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>{badge.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-sm font-bold ${rarity.color}`}>{rarity.label}</span>
            <span className="text-white/30">·</span>
            <span className="text-sm text-white/60">{categoryLabels[badge.category] || badge.category}</span>
          </div>
          {badge.is_secret && (
            <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold">
              <Lock className="w-3 h-3" /> Emblema Secreto
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Descrição</h3>
            <p className="text-white leading-relaxed">{badge.description}</p>
          </div>

          {earned && (
            <div className={`rounded-xl p-4 ${rarity.bg} border ${rarity.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-black text-white uppercase">Você conquistou este emblema!</span>
              </div>
              {earnedDate && (
                <p className="text-xs text-white/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Conquistado em {new Date(earnedDate).toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
              {earnedNote && (
                <p className="text-xs text-white/60 mt-1 italic">"{earnedNote}"</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50 font-medium">
              <Users className="w-4 h-4" />
              <span>{allUserBadges.length} membro{allUserBadges.length !== 1 ? "s" : ""} conquistaram</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50 font-medium">
              <Calendar className="w-4 h-4" />
              <span>{new Date(badge.created_date).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}