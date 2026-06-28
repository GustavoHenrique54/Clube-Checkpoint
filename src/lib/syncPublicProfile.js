const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


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
async function calculateScore(userId) {
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
 * Syncs the authenticated user's public profile.
 * Creates one if it doesn't exist yet, updates if it does.
 */
export async function syncPublicProfile(user) {
  if (!user?.id) return;

  const [existing, score] = await Promise.all([
    db.entities.PublicProfile.filter({ user_id: user.id }),
    calculateScore(user.id),
  ]);

  const data = {
    user_id: user.id,
    display_name: user.display_name || user.full_name || "",
    username: user.username || "",
    bio: user.bio || "",
    profile_image: user.profile_image || "",
    cover_image: user.cover_image || "",
    featured_badges: user.featured_badges || [],
    instagram: user.instagram || "",
    discord: user.discord || "",
    steam: user.steam || "",
    psn_username: user.psn_username || "",
    xbox_username: user.xbox_username || "",
    games_completed: user.games_completed ?? 0,
    meetings_attended: user.meetings_attended ?? 0,
    score,
  };

  if (existing && existing.length > 0) {
    await db.entities.PublicProfile.update(existing[0].id, data);
  } else {
    await db.entities.PublicProfile.create(data);
  }
}