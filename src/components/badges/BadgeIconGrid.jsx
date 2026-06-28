import React, { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Lock } from "lucide-react";

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

const rarityStyles = {
  common: { border: "border-slate-400/40", text: "text-slate-300", label: "Comum", glow: "" },
  uncommon: { border: "border-green-400/40", text: "text-green-300", label: "Incomum", glow: "rarity-glow-uncommon" },
  rare: { border: "border-blue-300/50", text: "text-blue-200", label: "Raro", glow: "rarity-glow-rare" },
  epic: { border: "border-purple-400/50", text: "text-purple-300", label: "Épico", glow: "rarity-glow-epic" },
  legendary: { border: "border-yellow-400/50", text: "text-yellow-300", label: "Lendário", glow: "rarity-glow-legendary" },
};

export default function BadgeIconGrid({ badges, userBadges = [], showFilters = true }) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);

  const earnedMap = {};
  userBadges.forEach(ub => { earnedMap[ub.badge_id] = ub; });

  const filtered = badges.filter(b => {
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
    if (rarityFilter !== "all" && b.rarity !== rarityFilter) return false;
    if (showEarnedOnly && !earnedMap[b.id]) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-white/60" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-blue-900 border-white/20">
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value} className="text-white hover:bg-white/10">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-blue-900 border-white/20">
              {RARITIES.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-white hover:bg-white/10">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showEarnedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEarnedOnly(!showEarnedOnly)}
            className={showEarnedOnly
              ? "bg-white text-blue-700 hover:bg-blue-50 font-bold"
              : "border-white/30 text-white bg-transparent hover:bg-white/10 font-bold"}
          >
            Apenas Conquistados
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-white/50 text-sm py-4">Nenhum emblema encontrado.</p>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="flex flex-wrap gap-2">
            {filtered.map(badge => {
              const earned = !!earnedMap[badge.id];
              const ub = earnedMap[badge.id];
              const rarity = rarityStyles[badge.rarity] || rarityStyles.common;
              const isSecret = badge.is_secret && !earned;

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-14 h-14 rounded-xl border flex items-center justify-center cursor-default transition-all flex-shrink-0
                        ${rarity.border}
                        ${earned ? `bg-white/10 hover:bg-white/20 ${rarity.glow}` : "bg-white/5 opacity-40 grayscale"}
                      `}
                    >
                      {isSecret ? (
                        <Lock className="w-6 h-6 text-white/30" />
                      ) : badge.icon_image ? (
                        <img src={badge.icon_image} alt={badge.name} className="w-9 h-9 object-contain" />
                      ) : (
                        <span className="text-2xl">🏆</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-blue-950 border border-white/20 text-white max-w-[220px] p-3"
                  >
                    <p className="font-bold text-sm">{isSecret ? "Emblema Secreto" : badge.name}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${rarity.text}`}>{rarity.label}</p>
                    {!isSecret && badge.description && (
                      <p className="text-xs text-white/65 mt-1 leading-relaxed">{badge.description}</p>
                    )}
                    {ub && (
                      <p className="text-xs text-white/45 mt-1.5">
                        ✓ Conquistado em {new Date(ub.created_date).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {!earned && !isSecret && (
                      <p className="text-xs text-white/35 mt-1">Ainda não conquistado</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}