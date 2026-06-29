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
      whileHover={{ scale: 1.04, y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`bg-white/10 px-4 py-5 rounded-xl relative group hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm h-full min-h-[190px] flex flex-col justify-between items-center text-center border border-white/10 ${earned ? "" : "opacity-40 grayscale"}`}
    >
      <div className="w-full flex flex-col items-center gap-2.5 flex-grow justify-center">
        <div className="rounded-xl w-16 h-16 flex items-center justify-center bg-white border border-white flex-shrink-0 shadow-sm">
          {isSecret ? (
            <Lock className="w-7 h-7 text-slate-400" />
          ) : badge.icon_image ? (
            <img src={badge.icon_image} alt={badge.name} className="w-11 h-11 object-contain" />
          ) : (
            <Trophy className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <div>
          <h3 className={`font-bold text-sm leading-snug ${earned ? "text-white" : "text-white/40"}`}>
            {isSecret ? "Emblema Secreto" : badge.name}
          </h3>
          <p className={`text-xs mt-0.5 font-semibold ${rarity.text}`}>{rarity.label}</p>
        </div>
      </div>
      {earnedDate && (
        <p className="text-[10px] text-white/45 mt-2 flex-shrink-0">
          {new Date(earnedDate).toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" })}
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