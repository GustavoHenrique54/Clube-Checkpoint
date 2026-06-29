import { db } from "@/api/supabaseClient";

import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Medal, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 15;

export default function Leaderboard() {
  const [page, setPage] = useState(1);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => db.entities.PublicProfile.list("-score", 500),
  });

  const sorted = [...profiles].sort((a, b) => (b.score || 0) - (a.score || 0));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const globalIndex = (i) => (page - 1) * PAGE_SIZE + i;

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-white/40 font-black text-sm w-5 text-center">{index + 1}</span>;
  };

  const getRankBg = (index) => {
    if (index === 0) return "bg-yellow-400/10 border-yellow-400/30";
    if (index === 1) return "bg-slate-300/10 border-slate-300/20";
    if (index === 2) return "bg-amber-600/10 border-amber-600/20";
    return "bg-white/5 border-white/10";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
          Placar de LÃ­deres
        </h1>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-4 flex gap-4 sm:gap-6 text-center flex-wrap">
        {[
          { label: "Comum", pts: "5 pts", color: "text-white" },
          { label: "Incomum", pts: "10 pts", color: "text-green-400" },
          { label: "Raro", pts: "25 pts", color: "text-blue-400" },
          { label: "Ã‰pico", pts: "50 pts", color: "text-purple-400" },
          { label: "LendÃ¡rio", pts: "100 pts", color: "text-yellow-400" },
        ].map(({ label, pts, color }) => (
          <div key={label} className="flex-1 min-w-[60px]">
            <p className="text-xs text-white/50 font-bold uppercase">{label}</p>
            <p className={`${color} font-black`}>{pts}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((profile, i) => {
              const gi = globalIndex(i);
              return (
                <Link
                  key={profile.id}
                  to={createPageUrl(`PublicProfile?id=${profile.user_id}`)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:bg-white/15 ${getRankBg(gi)}`}
                >
                  <div className="flex items-center justify-center w-7 flex-shrink-0">
                    {getRankIcon(gi)}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-900 border-2 border-white/20 flex items-center justify-center">
                    {profile.profile_image ? (
                      <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">{(profile.display_name || "?")?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{profile.display_name || profile.username || "Membro"}</p>
                    {profile.username && <p className="text-xs text-white/50">@{profile.username}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-white">{profile.score || 0}</p>
                    <p className="text-xs text-white/50">pontos</p>
                  </div>
                </Link>
              );
            })}
            {sorted.length === 0 && (
              <div className="text-center py-12 text-white/50">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">Nenhum membro com pontuaÃ§Ã£o ainda.</p>
                <p className="text-sm mt-1">Conquiste emblemas para aparecer aqui!</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-white/30 text-white bg-transparent hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/60 font-bold">
                PÃ¡gina {page} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-white/30 text-white bg-transparent hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}