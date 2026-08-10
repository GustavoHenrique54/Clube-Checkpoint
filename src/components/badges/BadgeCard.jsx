import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const rarityStyles = {
  common: { border: "border-slate-400/40", text: "text-slate-300", label: "Comum", glow: "" },
  uncommon: { border: "border-green-400/40", text: "text-green-300", label: "Incomum", glow: "rarity-glow-uncommon" },
  rare: { border: "border-blue-300/50", text: "text-blue-200", label: "Raro", glow: "rarity-glow-rare" },
  epic: { border: "border-purple-400/50", text: "text-purple-300", label: "Épico", glow: "rarity-glow-epic" },
  legendary: { border: "border-yellow-400/50", text: "text-yellow-300", label: "Lendário", glow: "rarity-glow-legendary" }
};

export default function BadgeCard({ badge, earned = false, earnedDate, featured = false, showLink = true }) {
  const rarity = rarityStyles[badge.rarity] || rarityStyles.common;
  const isSecret = badge.is_secret && !earned;

  const content = (
    <motion.div
      whileHover={{ scale: 1.03, y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`bg-white/10 p-3.5 sm:p-4 rounded-2xl relative group hover:bg-white/15 transition-all cursor-pointer backdrop-blur-sm h-full flex flex-col justify-between items-center text-center border border-white/15 ${earned ? "" : "opacity-40 grayscale"}`}
    >
      <div className="w-full flex flex-col items-center">
        {/* Top image container */}
        <div className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 overflow-hidden group-hover:border-white/20 transition-colors">
          {isSecret ? (
            <Lock className="w-10 h-10 text-white/40" />
          ) : badge.icon_image ? (
            <img src={badge.icon_image} alt={badge.name} className="w-full h-full object-contain" />
          ) : (
            <Trophy className="w-10 h-10 text-white/30" />
          )}
        </div>

        {/* Title and rarity */}
        <div className="mt-3">
          <h3 className={`font-bold text-sm leading-tight ${earned ? "text-white" : "text-white/40"}`}>
            {isSecret ? "Emblema Secreto" : badge.name}
          </h3>
          <p className={`text-xs mt-1 font-semibold ${rarity.text}`}>{rarity.label}</p>
        </div>
      </div>

      {earnedDate && (
        <p className="text-xs text-white/40 mt-4 flex-shrink-0 font-medium">
          {new Date(earnedDate).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
    </motion.div>
  );

  if (showLink && !isSecret) {
    return (
      <Link to={createPageUrl(`BadgeDetail?id=${badge.id}`)} className="h-full block">
        {content}
      </Link>
    );
  }

  return content;
}