const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Award, ArrowLeft, Search, Check, X } from "lucide-react";
import { syncPublicProfile } from "@/lib/syncPublicProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const rarityColors = {
  common: "text-slate-300", uncommon: "text-green-300", rare: "text-blue-200",
  epic: "text-purple-300", legendary: "text-yellow-300",
};

const rarityLabels = {
  common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário",
};

export default function AdminGrantBadge() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedUserId = urlParams.get("user_id");

  const [admin, setAdmin] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId || "");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [note, setNote] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [badgeSearch, setBadgeSearch] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { db.auth.me().then(setAdmin); }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => db.entities.User.list(),
    enabled: admin?.role === "admin",
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: () => db.entities.Badge.list(),
  });

  const { data: existingGrants = [] } = useQuery({
    queryKey: ["userBadgesForGrant", selectedUserId],
    queryFn: () => db.entities.UserBadge.filter({ user_id: selectedUserId }),
    enabled: !!selectedUserId,
  });

  const syncScore = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) await syncPublicProfile(targetUser);
  };

  const grantMutation = useMutation({
    mutationFn: (data) => db.entities.UserBadge.create(data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userBadgesForGrant"] });
      queryClient.invalidateQueries({ queryKey: ["allUserBadges"] });
      setSuccess(true);
      setSelectedBadgeId("");
      setNote("");
      setTimeout(() => setSuccess(false), 3000);
      await syncScore(variables.user_id);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => db.entities.UserBadge.delete(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["userBadgesForGrant"] });
      queryClient.invalidateQueries({ queryKey: ["allUserBadges"] });
      await syncScore(selectedUserId);
    },
  });

  if (!admin || admin.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen"><Shield className="w-12 h-12 text-white/40" /></div>;
  }

  const existingBadgeIds = existingGrants.map(g => g.badge_id);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredBadges = badges.filter(b =>
    b.name?.toLowerCase().includes(badgeSearch.toLowerCase()) &&
    !existingBadgeIds.includes(b.id)
  );

  const handleGrant = () => {
    if (!selectedUserId || !selectedBadgeId) return;
    grantMutation.mutate({
      user_id: selectedUserId,
      badge_id: selectedBadgeId,
      granted_by_admin: admin.email,
      note: note || undefined,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("AdminDashboard")} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Award className="w-6 h-6 text-white" />
        <h1 className="text-2xl font-black text-white uppercase" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>Conceder Emblema</h1>
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-400/40 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-300" />
          <p className="text-green-300 text-sm font-bold">Emblema concedido com sucesso!</p>
        </div>
      )}

      {/* Select User */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <Label className="text-white font-black uppercase text-sm mb-3 block">1. Selecionar Membro</Label>
        {selectedUser ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/15 border border-white/25">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-900 overflow-hidden flex items-center justify-center border border-white/20">
                {selectedUser.profile_image ? <img src={selectedUser.profile_image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white">{selectedUser.full_name?.[0]}</span>}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{selectedUser.full_name}</p>
                <p className="text-xs text-white/50">{selectedUser.email}</p>
              </div>
            </div>
            <button onClick={() => setSelectedUserId("")} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input placeholder="Buscar membro..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredUsers.map((u) => (
                <button key={u.id} onClick={() => { setSelectedUserId(u.id); setUserSearch(""); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden border border-white/20">
                    {u.profile_image ? <img src={u.profile_image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white">{u.full_name?.[0]}</span>}
                  </div>
                  <div>
                    <p className="text-sm text-white font-bold">{u.full_name}</p>
                    <p className="text-xs text-white/50">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
          <Label className="text-white font-black uppercase text-sm mb-3 block">2. Selecionar Emblema</Label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input placeholder="Buscar emblema..." value={badgeSearch} onChange={(e) => setBadgeSearch(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredBadges.map((b) => (
              <button key={b.id} onClick={() => setSelectedBadgeId(b.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${selectedBadgeId === b.id ? "bg-white/20 border border-white/30" : "hover:bg-white/10"}`}>
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                  {b.icon_image ? <img src={b.icon_image} alt="" className="w-5 h-5 object-contain" /> : <span className="text-sm">🏆</span>}
                </div>
                <div>
                  <p className="text-sm text-white font-bold">{b.name}</p>
                  <p className={`text-xs font-semibold ${rarityColors[b.rarity]}`}>{rarityLabels[b.rarity]}</p>
                </div>
              </button>
            ))}
            {filteredBadges.length === 0 && <p className="text-sm text-white/40 text-center py-4">Nenhum emblema disponível para conceder.</p>}
          </div>

          <div className="mt-4">
            <Label className="text-white font-bold">Observação (opcional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Por que este emblema está sendo concedido?" rows={2} className="mt-1 bg-white/10 border-white/20 text-white resize-none placeholder:text-white/30" />
          </div>

          <Button onClick={handleGrant} disabled={!selectedBadgeId || grantMutation.isPending} className="mt-4 bg-white text-blue-700 hover:bg-blue-50 font-black w-full">
            <Award className="w-4 h-4 mr-1.5" />
            {grantMutation.isPending ? "Concedendo..." : "Conceder Emblema"}
          </Button>
        </div>
      )}

      {selectedUserId && existingGrants.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
          <Label className="text-white font-black uppercase text-sm mb-3 block">Emblemas Atuais ({existingGrants.length})</Label>
          <div className="space-y-2">
            {existingGrants.map((grant) => {
              const badge = badges.find(b => b.id === grant.badge_id);
              return (
                <div key={grant.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      {badge?.icon_image ? <img src={badge.icon_image} alt="" className="w-5 h-5 object-contain" /> : <span className="text-sm">🏆</span>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{badge?.name || "Desconhecido"}</p>
                      <p className="text-xs text-white/40">{new Date(grant.created_date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revokeMutation.mutate(grant.id)} className="text-white/40 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}