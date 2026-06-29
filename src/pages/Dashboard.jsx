import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Pencil, ExternalLink, Star, Gamepad2, Calendar } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import RecentBadges from "@/components/profile/RecentBadges";

function formatMeetingDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  };
}

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: () => db.entities.Badge.list()
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadges", user?.id],
    queryFn: () => db.entities.UserBadge.filter({ user_id: user.id }),
    enabled: !!user?.id
  });

  const { data: hubRecords = [] } = useQuery({
    queryKey: ["clubHub"],
    queryFn: () => db.entities.ClubHub.list()
  });
  const hub = hubRecords[0];
  const meeting = formatMeetingDate(hub?.next_meeting_datetime);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  const rareBadgeIds = badges.filter((b) => ["rare", "epic", "legendary"].includes(b.rarity)).map((b) => b.id);
  const rareBadgeCount = userBadges.filter((ub) => rareBadgeIds.includes(ub.badge_id)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden">
        <ProfileHeader user={user} badgeCount={userBadges.length} rareBadgeCount={rareBadgeCount} />
        <div className="px-6 pb-4 flex gap-3">
          <Link to={createPageUrl("EditProfile")}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/30 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              <Pencil className="w-4 h-4" /> Editar Perfil
            </button>
          </Link>
          <Link to={createPageUrl("Profile")}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/30 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              <Star className="w-4 h-4" /> Meu Perfil
            </button>
          </Link>
          <Link to={createPageUrl("ClubHub")}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-sm font-bold hover:bg-white/25 transition-colors">
              <Gamepad2 className="w-4 h-4" /> Hub do Clube
            </button>
          </Link>
        </div>
      </div>

      {/* Hub Highlight Card */}
      <Link to={createPageUrl("ClubHub")} className="block group">
        <div className="relative rounded-2xl border border-white/15 overflow-hidden bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all">
          <div className="flex flex-col sm:flex-row">
            {/* Game Cover */}
            {hub?.active_game_image &&
            <div className="sm:w-36 sm:flex-shrink-0 h-44 sm:h-auto overflow-hidden">
                <img
                src={hub.active_game_image}
                alt={hub.active_game_title}
                className="w-full h-full object-cover" />

              </div>
            }
            <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
              {/* Game Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="w-4 h-4 text-blue-300" />
                  <span className="text-xs font-black text-blue-300 uppercase tracking-widest">Jogo Ativo</span>
                </div>
                {hub?.active_game_title ?
                <>
                    <h2 className="text-xl font-black text-white">{hub.active_game_title}</h2>
                    {hub.active_game_description &&
                  <p className="text-white/60 text-sm mt-1 line-clamp-2">{hub.active_game_description}</p>
                  }
                  </> :

                <p className="text-white/40 text-sm italic">Nenhum jogo ativo</p>
                }
              </div>

              {/* Meeting Info */}
              {meeting &&
              <div className="sm:border-l sm:border-white/10 sm:pl-4 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-300" />
                    <span className="text-xs font-black text-green-300 uppercase tracking-widest">Próxima Reunião</span>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center border border-white/15">
                    <p className="text-3xl font-black text-white">{meeting.time}</p>
                    <p className="text-xs text-white/65 capitalize mt-1">{meeting.date}</p>
                  </div>
                </div>
              }
            </div>
            

          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
        { to: "Profile", icon: Star, label: "Meu Perfil" },
        { to: "BadgeCollection", icon: Trophy, label: "Conquistas" },
        { to: `PublicProfile?id=${user.id}`, icon: ExternalLink, label: "Ver Perfil" },
        { to: "ClubHub", icon: Gamepad2, label: "Hub do Clube" }].
        map((item) =>
        <Link
          key={item.label}
          to={createPageUrl(item.to)}
          className="bg-white/10 border border-white/15 rounded-xl p-4 hover:bg-white/20 transition-all group text-center backdrop-blur-sm">

            <item.icon className="w-5 h-5 text-white mx-auto mb-2" />
            <p className="text-sm font-bold text-white">{item.label}</p>
          </Link>
        )}
      </div>

      {/* Recent Badges */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Conquistas Recentes
          </h2>
          <Link to={createPageUrl("BadgeCollection")} className="text-sm text-white/70 hover:text-white font-semibold">
            Ver todas
          </Link>
        </div>
        <RecentBadges badges={badges} userBadges={userBadges} limit={4} />
      </div>
    </div>);

}