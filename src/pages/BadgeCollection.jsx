const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BadgeGrid from "@/components/badges/BadgeGrid";

const CATEGORIES = [
  { value: "all", label: "Todas as Categorias" },
  { value: "participation", label: "Participação" },
  { value: "game_completion", label: "Games Concluídos" },
  { value: "events", label: "Eventos" },
  { value: "founder", label: "Fundador" },
  { value: "special", label: "Especial" },
  { value: "secret", label: "Secreto" },
  { value: "veteran", label: "Veterano" },
];

const RARITIES = [
  { value: "all", label: "Todas as Raridades" },
  { value: "common", label: "Comum" },
  { value: "uncommon", label: "Incomum" },
  { value: "rare", label: "Raro" },
  { value: "epic", label: "Épico" },
  { value: "legendary", label: "Lendário" },
];

export default function BadgeCollection() {
  const [user, setUser] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: () => db.entities.Badge.list(),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadges", user?.id],
    queryFn: () => db.entities.UserBadge.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);

  const filteredBadges = badges.filter(b => {
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
    if (rarityFilter !== "all" && b.rarity !== rarityFilter) return false;
    if (showEarnedOnly && !earnedBadgeIds.includes(b.id)) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase flex items-center gap-2" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>
            <Trophy className="w-6 h-6" />
            Coleção de Emblemas
          </h1>
          <p className="text-white/60 text-sm mt-1 font-medium">
            {userBadges.length} conquistados · {badges.length} no total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-white/60" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-blue-900 border-white/20">
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value} className="text-white hover:bg-white/10">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-blue-900 border-white/20">
              {RARITIES.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-white hover:bg-white/10">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showEarnedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEarnedOnly(!showEarnedOnly)}
            className={showEarnedOnly
              ? "bg-white text-blue-700 hover:bg-blue-50 font-bold"
              : "border-white/30 text-white bg-transparent hover:bg-white/10 font-bold"
            }
          >
            Apenas Conquistados
          </Button>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <BadgeGrid
          badges={filteredBadges}
          userBadges={userBadges}
          featuredBadgeIds={user?.featured_badges || []}
          showAll={true}
        />
      </div>
    </div>
  );
}