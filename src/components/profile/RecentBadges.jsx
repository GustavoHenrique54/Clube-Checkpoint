import React from "react";
import BadgeCard from "../badges/BadgeCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

export default function RecentBadges({ badges, userBadges, limit = 4 }) {
  const badgeMap = {};
  badges.forEach(b => { badgeMap[b.id] = b; });

  const sortedUserBadges = [...userBadges]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, limit);

  if (sortedUserBadges.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <p>Nenhum emblema conquistado ainda. Continue participando!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {sortedUserBadges.map((ub) => {
          const badge = badgeMap[ub.badge_id];
          if (!badge) return null;
          return (
            <BadgeCard
              key={ub.id}
              badge={badge}
              earned={true}
              earnedDate={ub.created_date}
            />
          );
        })}
      </div>
      {userBadges.length > limit && (
        <div className="mt-4 text-center">
          <Link
            to={createPageUrl("BadgeCollection")}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white font-bold transition-colors"
          >
            Ver todos os emblemas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}