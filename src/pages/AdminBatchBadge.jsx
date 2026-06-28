const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Award, ArrowLeft, Search, Check, X, Users, Plus, Trash2, Loader2 } from "lucide-react";
import { syncPublicProfile } from "@/lib/syncPublicProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const rarityColors = {
  common: "text-slate-300", uncommon: "text-green-300", rare: "text-blue-200",
  epic: "text-purple-300", legendary: "text-yellow-300",
};
const rarityLabels = {
  common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário",
};

export default function AdminBatchBadge() {
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState(null);
  const [mode, setMode] = useState("grant"); // "grant" | "revoke"

  // Selections
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user objects
  const [selectedBadges, setSelectedBadges] = useState([]); // array of badge objects

  // Searches
  const [userSearch, setUserSearch] = useState("");
  const [badgeSearch, setBadgeSearch] = useState("");

  // Status
  const [progress, setProgress] = useState(null); // null | { done, total }
  const [done, setDone] = useState(false);

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

  // For revoke mode: fetch all grants for selected users
  const { data: allGrants = [] } = useQuery({
    queryKey: ["batchGrants", selectedUsers.map(u => u.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        selectedUsers.map(u => db.entities.UserBadge.filter({ user_id: u.id }))
      );
      return results.flat();
    },
    enabled: mode === "revoke" && selectedUsers.length > 0,
  });

  if (!admin || admin.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen"><Shield className="w-12 h-12 text-white/40" /></div>;
  }

  const toggleUser = (user) => {
    setSelectedUsers(prev =>
      prev.find(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user]
    );
    setDone(false);
  };

  const toggleBadge = (badge) => {
    setSelectedBadges(prev =>
      prev.find(b => b.id === badge.id) ? prev.filter(b => b.id !== badge.id) : [...prev, badge]
    );
    setDone(false);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // For grant: only show badges not already owned by ALL selected users (show if at least one user doesn't have it)
  const grantedBadgeIdsPerUser = {};
  allGrants.forEach(g => {
    if (!grantedBadgeIdsPerUser[g.user_id]) grantedBadgeIdsPerUser[g.user_id] = new Set();
    grantedBadgeIdsPerUser[g.user_id].add(g.badge_id);
  });

  const filteredBadges = badges.filter(b =>
    b.name?.toLowerCase().includes(badgeSearch.toLowerCase())
  );

  // For revoke: show badges that exist for at least one selected user
  const revokableBadges = mode === "revoke"
    ? badges.filter(b => allGrants.some(g => g.badge_id === b.id))
    : [];

  const filteredRevokeBadges = revokableBadges.filter(b =>
    b.name?.toLowerCase().includes(badgeSearch.toLowerCase())
  );

  const handleExecute = async () => {
    if (selectedUsers.length === 0 || selectedBadges.length === 0) return;
    const total = selectedUsers.length * selectedBadges.length;
    setProgress({ done: 0, total });
    setDone(false);

    let count = 0;
    if (mode === "grant") {
      for (const user of selectedUsers) {
        const userGrants = allGrants.filter(g => g.user_id === user.id);
        const userBadgeIds = new Set(userGrants.map(g => g.badge_id));
        for (const badge of selectedBadges) {
          if (!userBadgeIds.has(badge.id)) {
            await db.entities.UserBadge.create({
              user_id: user.id,
              badge_id: badge.id,
              granted_by_admin: admin.email,
            });
          }
          count++;
          setProgress({ done: count, total });
        }
        await syncPublicProfile(user);
      }
    } else {
      for (const user of selectedUsers) {
        const userGrants = allGrants.filter(g => g.user_id === user.id);
        for (const badge of selectedBadges) {
          const grant = userGrants.find(g => g.badge_id === badge.id);
          if (grant) {
            await db.entities.UserBadge.delete(grant.id);
          }
          count++;
          setProgress({ done: count, total });
        }
        await syncPublicProfile(user);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["batchGrants"] });
    queryClient.invalidateQueries({ queryKey: ["allUserBadges"] });
    setDone(true);
    setProgress(null);
  };

  const isRunning = progress !== null;
  const displayBadges = mode === "revoke" ? filteredRevokeBadges : filteredBadges;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("AdminDashboard")} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Award className="w-6 h-6 text-white" />
        <h1 className="text-2xl font-black text-white uppercase" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>
          Emblemas em Lote
        </h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode("grant"); setSelectedBadges([]); setDone(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === "grant" ? "bg-white text-blue-700" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          <Plus className="w-4 h-4" /> Conceder em Lote
        </button>
        <button
          onClick={() => { setMode("revoke"); setSelectedBadges([]); setDone(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === "revoke" ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          <Trash2 className="w-4 h-4" /> Revogar em Lote
        </button>
      </div>

      {done && (
        <div className="bg-green-500/20 border border-green-400/40 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-300" />
          <p className="text-green-300 text-sm font-bold">
            Operação concluída com sucesso para {selectedUsers.length} membro(s) e {selectedBadges.length} emblema(s)!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5">
          <Label className="text-white font-black uppercase text-sm mb-3 block flex items-center gap-2">
            <Users className="w-4 h-4" /> Membros ({selectedUsers.length} selecionados)
          </Label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar membro..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
          </div>

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedUsers.map(u => (
                <span key={u.id} className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {u.full_name?.split(" ")[0]}
                  <button onClick={() => toggleUser(u)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredUsers.map((u) => {
              const isSelected = selectedUsers.some(s => s.id === u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${isSelected ? "bg-white/20 border border-white/30" : "hover:bg-white/10"}`}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0">
                    {u.profile_image ? <img src={u.profile_image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white">{u.full_name?.[0]}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-bold truncate">{u.full_name}</p>
                    <p className="text-xs text-white/50 truncate">{u.email}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-green-300 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Badges panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5">
          <Label className="text-white font-black uppercase text-sm mb-3 block flex items-center gap-2">
            <Award className="w-4 h-4" /> Emblemas ({selectedBadges.length} selecionados)
          </Label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar emblema..."
              value={badgeSearch}
              onChange={(e) => setBadgeSearch(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
          </div>

          {/* Selected badges chips */}
          {selectedBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedBadges.map(b => (
                <span key={b.id} className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {b.name}
                  <button onClick={() => toggleBadge(b)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1">
            {displayBadges.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">
                {mode === "revoke" && selectedUsers.length === 0
                  ? "Selecione membros primeiro para ver os emblemas revogáveis."
                  : "Nenhum emblema encontrado."}
              </p>
            ) : (
              displayBadges.map((b) => {
                const isSelected = selectedBadges.some(s => s.id === b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBadge(b)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${isSelected ? "bg-white/20 border border-white/30" : "hover:bg-white/10"}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                      {b.icon_image ? <img src={b.icon_image} alt="" className="w-5 h-5 object-contain" /> : <span className="text-sm">🏆</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-bold truncate">{b.name}</p>
                      <p className={`text-xs font-semibold ${rarityColors[b.rarity]}`}>{rarityLabels[b.rarity]}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-green-300 ml-auto flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Summary & Execute */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-sm">
              {selectedUsers.length > 0 && selectedBadges.length > 0 ? (
                mode === "grant"
                  ? `Conceder ${selectedBadges.length} emblema(s) para ${selectedUsers.length} membro(s) — ${selectedUsers.length * selectedBadges.length} operações`
                  : `Revogar ${selectedBadges.length} emblema(s) de ${selectedUsers.length} membro(s)`
              ) : (
                <span className="text-white/40">Selecione membros e emblemas para continuar.</span>
              )}
            </p>
            {isRunning && (
              <p className="text-white/60 text-xs mt-1">
                Processando {progress.done}/{progress.total}...
              </p>
            )}
          </div>
          <Button
            onClick={handleExecute}
            disabled={selectedUsers.length === 0 || selectedBadges.length === 0 || isRunning}
            className={`font-black min-w-[160px] ${mode === "grant" ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-red-500 text-white hover:bg-red-600"}`}
          >
            {isRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
            ) : mode === "grant" ? (
              <><Plus className="w-4 h-4 mr-1.5" /> Conceder</>
            ) : (
              <><Trash2 className="w-4 h-4 mr-1.5" /> Revogar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}