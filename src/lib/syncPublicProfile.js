import { db } from "@/api/supabaseClient";

const RARITY_POINTS = {
  common: 5,
  uncommon: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
};

/**
 * Calculates the total score for a user based on their badges.
 */
export async function calculateScore(userId) {
  if (!userId) return 0;
  const userBadges = await db.entities.UserBadge.filter({ user_id: userId });
  if (!userBadges || userBadges.length === 0) return 0;

  const allBadges = await db.entities.Badge.list();
  const badgeMap = {};
  allBadges.forEach(b => { badgeMap[b.id] = b; });

  return userBadges.reduce((total, ub) => {
    const badge = badgeMap[ub.badge_id];
    return total + (RARITY_POINTS[badge?.rarity] || 0);
  }, 0);
}

/**
 * Syncs a user's public profile and recalculates their leaderboard score.
 * Accepts either a user object or a userId string.
 */
export async function syncPublicProfile(userOrId) {
  const userId = typeof userOrId === "string" ? userOrId : userOrId?.id;
  if (!userId) return;
  const userObj = typeof userOrId === "object" && userOrId ? userOrId : {};

  const [existing, score] = await Promise.all([
    db.entities.PublicProfile.filter({ user_id: userId }),
    calculateScore(userId),
  ]);

  const profileData = existing && existing[0] ? existing[0] : {};

  const data = {
    user_id: userId,
    display_name: userObj.display_name || userObj.full_name || profileData.display_name || "",
    username: userObj.username || profileData.username || "",
    bio: userObj.bio || profileData.bio || "",
    profile_image: userObj.profile_image || profileData.profile_image || "",
    cover_image: userObj.cover_image || profileData.cover_image || "",
    featured_badges: userObj.featured_badges || profileData.featured_badges || [],
    instagram: userObj.instagram || profileData.instagram || "",
    discord: userObj.discord || profileData.discord || "",
    steam: userObj.steam || profileData.steam || "",
    psn_username: userObj.psn_username || profileData.psn_username || "",
    xbox_username: userObj.xbox_username || profileData.xbox_username || "",
    games_completed: userObj.games_completed ?? profileData.games_completed ?? 0,
    meetings_attended: userObj.meetings_attended ?? profileData.meetings_attended ?? 0,
    score,
  };

  if (existing && existing.length > 0) {
    await db.entities.PublicProfile.update(existing[0].id, data);
  } else {
    await db.entities.PublicProfile.create(data);
  }
}