import React from "react";
import BadgeCard from "./BadgeCard";

export default function BadgeGrid({ badges, userBadges = [], featuredBadgeIds = [], showAll = false }) {
  const earnedBadgeMap = {};
  userBadges.forEach(ub => {
    earnedBadgeMap[ub.badge_id] = ub;
  });

  const displayBadges = showAll
    ? badges
    : badges.filter(b => earnedBadgeMap[b.id]);

  if (displayBadges.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p className="text-lg font-bold">Nenhum emblema ainda</p>
        <p className="text-sm mt-1">Participe do clube para conquistar emblemas!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {displayBadges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={!!earnedBadgeMap[badge.id]}
          earnedDate={earnedBadgeMap[badge.id]?.created_date}
          featured={featuredBadgeIds.includes(badge.id)}
        />
      ))}
    </div>
  );
}