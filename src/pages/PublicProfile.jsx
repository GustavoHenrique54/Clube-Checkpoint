import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Copy, Check, UserPlus, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileHeader from "@/components/profile/ProfileHeader";
import BadgeGrid from "@/components/badges/BadgeGrid";
import BadgeIconGrid from "@/components/badges/BadgeIconGrid";

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const userId = searchParams.get("id");
  const username = searchParams.get("username");

  useEffect(() => {
    db.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: profiles = [], isLoading: usersLoading } = useQuery({
    queryKey: ["publicProfile", userId, username],
    queryFn: async () => {
      if (userId) return db.entities.PublicProfile.filter({ user_id: userId });
      if (username) return db.entities.PublicProfile.filter({ username });
      return [];
    },
    enabled: !!(userId || username),
  });

  const profile = profiles[0];
  // Shape the profile to match what ProfileHeader expects (full_name field)
  const user = profile ? { ...profile, full_name: profile.display_name || profile.username || "Membro", id: profile.user_id } : null;

  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: () => db.entities.Badge.list(),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["publicUserBadges", user?.id],
    queryFn: () => db.entities.UserBadge.filter({ user_id: profile.user_id }),
    enabled: !!profile?.user_id,
  });

  const { data: profileFriends = [] } = useQuery({
    queryKey: ["profileFriends", userId],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        db.entities.FriendRequest.filter({ sender_user_id: userId, status: "accepted" }),
        db.entities.FriendRequest.filter({ receiver_user_id: userId, status: "accepted" }),
      ]);
      return [...sent, ...received];
    },
    enabled: !!userId,
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ["friendRequestsWith", currentUser?.id, userId],
    queryFn: async () => {
      if (!currentUser?.id || !userId || currentUser.id === userId) return [];
      const [sent, received] = await Promise.all([
        db.entities.FriendRequest.filter({ sender_user_id: currentUser.id, receiver_user_id: userId }),
        db.entities.FriendRequest.filter({ sender_user_id: userId, receiver_user_id: currentUser.id }),
      ]);
      return [...sent, ...received];
    },
    enabled: !!currentUser?.id && !!userId,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => db.entities.FriendRequest.create({
      sender_user_id: currentUser.id,
      receiver_user_id: userId,
      status: "pending",
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendRequestsWith"] }),
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "accepted" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendRequestsWith"] }),
  });

  const friendRequest = friendRequests[0];
  const isOwnProfile = currentUser?.id === userId;
  const isFriend = friendRequest?.status === "accepted";
  const isPendingSent = friendRequest?.status === "pending" && friendRequest?.sender_user_id === currentUser?.id;
  const isPendingReceived = friendRequest?.status === "pending" && friendRequest?.receiver_user_id === currentUser?.id;

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>Perfil não encontrado</p>
          <p className="text-white/60 mt-2">Este usuário não existe ou o perfil está indisponível.</p>
        </div>
      </div>
    );
  }

  const rareBadgeIds = badges.filter(b => ["rare", "epic", "legendary"].includes(b.rarity)).map(b => b.id);
  const rareBadgeCount = userBadges.filter(ub => rareBadgeIds.includes(ub.badge_id)).length;
  const featuredBadges = user.featured_badges?.length
    ? badges.filter(b => user.featured_badges.includes(b.id))
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-ps-dark-card border border-white/10 rounded-md overflow-hidden shadow-md">
        <ProfileHeader user={user} badgeCount={userBadges.length} rareBadgeCount={rareBadgeCount} friendCount={profileFriends.length} />
        <div className="px-6 pb-4 flex flex-wrap gap-3 bg-ps-dark-card">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-white/75 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Link copiado!" : "Copiar link do perfil"}
          </button>

          {!isOwnProfile && currentUser && (
            isFriend ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5" /> Amigos
              </div>
            ) : isPendingSent ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" /> Solicitação enviada
              </div>
            ) : isPendingReceived ? (
              <Button size="sm" onClick={() => acceptRequestMutation.mutate(friendRequest.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-8 rounded-full px-4">
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Aceitar Amizade
              </Button>
            ) : (
              <Button size="sm" onClick={() => sendRequestMutation.mutate()} className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold text-xs h-8 rounded-full px-4 border-none shadow-md">
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Adicionar Amigo
              </Button>
            )
          )}
        </div>
      </div>

      {featuredBadges.length > 0 && (
        <div className="bg-ps-dark-card border border-white/10 rounded-md p-6">
          <h2 className="text-lg font-bold text-white uppercase mb-4 tracking-wide">Emblemas em Destaque</h2>
          <BadgeGrid
            badges={featuredBadges}
            userBadges={userBadges}
            featuredBadgeIds={user.featured_badges}
          />
        </div>
      )}

      <div className="bg-ps-dark-card border border-white/10 rounded-md p-6">
        <h2 className="text-lg font-bold text-white uppercase mb-4 tracking-wide">Emblemas</h2>
        <BadgeIconGrid badges={badges} userBadges={userBadges} />
      </div>
    </div>
  );
}