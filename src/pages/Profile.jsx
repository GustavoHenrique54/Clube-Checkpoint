import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pencil, ExternalLink, Copy, Check, Search, Users, UserCheck, Clock, X, Filter, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfileHeader from "@/components/profile/ProfileHeader";
import BadgeGrid from "@/components/badges/BadgeGrid";
import BadgeIconGrid from "@/components/badges/BadgeIconGrid";
import { syncPublicProfile } from "@/lib/syncPublicProfile";

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

export default function Profile() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBadgeFilters, setShowBadgeFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const queryClient = useQueryClient();

  const handleCopyPublicLink = (userId) => {
    const url = `${window.location.origin}/PublicProfile?id=${userId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const { data: sentReqs = [] } = useQuery({
    queryKey: ["sentRequests", user?.id],
    queryFn: () => db.entities.FriendRequest.filter({ sender_user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: receivedReqs = [] } = useQuery({
    queryKey: ["receivedRequests", user?.id],
    queryFn: () => db.entities.FriendRequest.filter({ receiver_user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: () => db.entities.PublicProfile.list(),
  });

  const invalidateFriends = () => {
    queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
    queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
  };

  const acceptMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "accepted" }),
    onSuccess: invalidateFriends,
  });

  const rejectMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "rejected" }),
    onSuccess: invalidateFriends,
  });

  const removeMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.delete(reqId),
    onSuccess: invalidateFriends,
  });

  const handleUploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    await db.auth.updateMe({ cover_image: file_url });
    const updated = await db.auth.me();
    setUser(updated);
    syncPublicProfile(updated);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profileMap = {};
  allProfiles.forEach(p => { profileMap[p.user_id] = p; });

  const rareBadgeIds = badges.filter(b => ["rare", "epic", "legendary"].includes(b.rarity)).map(b => b.id);
  const rareBadgeCount = userBadges.filter(ub => rareBadgeIds.includes(ub.badge_id)).length;
  const acceptedFriends = [
    ...sentReqs.filter(r => r.status === "accepted").map(r => ({ req: r, profile: profileMap[r.receiver_user_id] })),
    ...receivedReqs.filter(r => r.status === "accepted").map(r => ({ req: r, profile: profileMap[r.sender_user_id] })),
  ];
  const pendingReceived = receivedReqs.filter(r => r.status === "pending");
  const pendingSent = sentReqs.filter(r => r.status === "pending");
  const friendCount = acceptedFriends.length;
  const featuredBadges = user.featured_badges?.length
    ? badges.filter(b => user.featured_badges.includes(b.id))
    : [];

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const filteredBadges = badges.filter(b => {
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
    if (rarityFilter !== "all" && b.rarity !== rarityFilter) return false;
    if (showEarnedOnly && !earnedBadgeIds.includes(b.id)) return false;
    return true;
  });

  const searchFiltered = searchQuery.trim().length < 1 ? [] : allProfiles.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.display_name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q);
  });

  const ProfileRow = ({ profile, children }) => (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-ps-dark-elevated border border-white/10">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-900 border border-white/20 flex-shrink-0 flex items-center justify-center">
          {profile?.profile_image ? (
            <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-black text-white">{(profile?.display_name || "?")?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{profile?.display_name || "Membro"}</p>
          {profile?.username && <p className="text-[10px] text-white/50">@{profile.username}</p>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0 space-y-6">

      {/* Profile Header Card */}
      <div className="bg-ps-dark-card border border-white/10 rounded-md overflow-hidden shadow-md">
        <ProfileHeader
          user={user}
          badgeCount={userBadges.length}
          rareBadgeCount={rareBadgeCount}
          friendCount={friendCount}
          onUploadCover={handleUploadCover}
        />
        <div className="px-6 pb-5 flex flex-wrap gap-2 bg-ps-dark-card">
          <Link to={createPageUrl("EditProfile")}>
            <Button variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10 rounded-full font-bold px-4">
              <Pencil className="w-4 h-4 mr-1.5" /> Editar Perfil
            </Button>
          </Link>
          <Link to={createPageUrl(`PublicProfile?id=${user.id}`)}>
            <Button variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10 rounded-full font-bold px-4">
              <ExternalLink className="w-4 h-4 mr-1.5" /> Ver Perfil Público
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => handleCopyPublicLink(user.id)} className="border-white/20 text-white bg-transparent hover:bg-white/10 rounded-full font-bold px-4">
            {copied ? <Check className="w-4 h-4 mr-1.5 text-green-400" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>
          {user.role === "admin" && (
            <Link to="/AdminDashboard">
              <Button variant="outline" size="sm" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 rounded-full font-bold px-4">
                <Shield className="w-4 h-4 mr-1.5" /> Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Featured Badges */}
      <div className="bg-ps-dark-card border border-white/10 rounded-md p-6">
        <h2 className="text-lg font-bold text-white uppercase mb-4 tracking-wide">â­ Emblemas em Destaque</h2>
        {featuredBadges.length === 0 ? (
          <p className="text-white/40 text-sm italic font-sans">Nenhum emblema em destaque. <Link to={createPageUrl("EditProfile")} className="underline text-white/60 hover:text-white">Selecionar no perfil</Link></p>
        ) : (
          <BadgeGrid badges={featuredBadges} userBadges={userBadges} featuredBadgeIds={user.featured_badges} />
        )}
      </div>

      {/* All Badges with filters */}
      <div className="bg-ps-dark-card border border-white/10 rounded-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">
            ðŸ… Meus Emblemas
            <span className="ml-2 text-sm font-bold text-white/50 normal-case">{userBadges.length} / {badges.length}</span>
          </h2>
          <button
            onClick={() => setShowBadgeFilters(!showBadgeFilters)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${showBadgeFilters ? "bg-ps-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filtros
          </button>
        </div>

        {showBadgeFilters && (
          <div className="flex flex-wrap gap-2 p-3 bg-ps-dark-elevated rounded-md border border-white/10">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white text-xs h-8 rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-ps-dark-elevated border-white/10">
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value} className="text-white hover:bg-white/10">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white text-xs h-8 rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-ps-dark-elevated border-white/10">
                {RARITIES.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-white hover:bg-white/10">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setShowEarnedOnly(!showEarnedOnly)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${showEarnedOnly ? "bg-ps-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              Apenas Conquistados
            </button>
          </div>
        )}

        <BadgeIconGrid badges={showBadgeFilters ? filteredBadges : badges} userBadges={userBadges} />
      </div>

      </div>{/* end left column */}

      {/* Right sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4">

        {/* Search Profiles */}
        <div className="bg-ps-dark-card border border-white/10 rounded-md p-5 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Search className="w-4 h-4 text-ps-blue" /> Buscar Membros
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome ou @usuario..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-ps-blue rounded-sm"
            />
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="bg-ps-dark-elevated rounded-md border border-white/10 overflow-hidden">
              {searchFiltered.length === 0 ? (
                <p className="text-center py-6 text-white/40 text-sm">Nenhum perfil encontrado para "{searchQuery}"</p>
              ) : (
                <div className="divide-y divide-white/10">
                  {searchFiltered.map(u => (
                    <Link key={u.id} to={createPageUrl(`PublicProfile?id=${u.user_id}`)} className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-blue-900 border border-white/20 flex-shrink-0 overflow-hidden">
                        {u.profile_image ? (
                          <img src={u.profile_image} alt={u.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm font-black text-white">{u.display_name?.[0]?.toUpperCase() || "?"}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{u.display_name}</p>
                        {u.username && <p className="text-white/50 text-xs">@{u.username}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {searchQuery.trim().length === 0 && (
            <p className="text-xs text-white/40 text-center">Digite um nome ou @usuario para pesquisar</p>
          )}
        </div>

        {/* Friends */}
        <div className="bg-ps-dark-card border border-white/10 rounded-md p-5 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" /> Amigos
          </h2>

          {pendingReceived.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recebidas ({pendingReceived.length})
              </p>
              {pendingReceived.map(req => (
                <ProfileRow key={req.id} profile={profileMap[req.sender_user_id]}>
                  <button onClick={() => acceptMutation.mutate(req.id)} className="p-1 rounded-lg bg-green-600/80 hover:bg-green-600 text-white transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => rejectMutation.mutate(req.id)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </ProfileRow>
              ))}
            </div>
          )}

          {pendingSent.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Enviadas ({pendingSent.length})</p>
              {pendingSent.map(req => (
                <ProfileRow key={req.id} profile={profileMap[req.receiver_user_id]}>
                  <span className="text-[10px] text-white/40 font-bold px-1">Pendente</span>
                  <button onClick={() => removeMutation.mutate(req.id)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/40 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </ProfileRow>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Meus Amigos ({acceptedFriends.length})
            </p>
            {acceptedFriends.length === 0 ? (
              <p className="text-xs text-white/40 py-2 text-center">Use a busca acima para encontrar e adicionar amigos!</p>
            ) : (
              acceptedFriends.map(({ req, profile }) => (
                <ProfileRow key={req.id} profile={profile}>
                  <Link to={createPageUrl(`PublicProfile?id=${profile?.user_id}`)}>
                    <button className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                  <button onClick={() => removeMutation.mutate(req.id)} className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </ProfileRow>
              ))
            )}
          </div>
        </div>

      </div>{/* end right sidebar */}
      </div>{/* end flex row */}
    </div>
  );
}