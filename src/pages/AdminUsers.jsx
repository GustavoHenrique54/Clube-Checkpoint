import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Search, Users, ArrowLeft, ExternalLink, Award, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { syncPublicProfile } from "@/lib/syncPublicProfile";
import { useState as useLocalState } from "react";

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [syncingId, setSyncingId] = useLocalState(null);

  const handleSync = async (member) => {
    setSyncingId(member.id);
    await syncPublicProfile(member);
    setSyncingId(null);
  };

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => db.entities.User.list(),
    enabled: user?.role === "admin",
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["allUserBadges"],
    queryFn: () => db.entities.UserBadge.list(),
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen"><Shield className="w-12 h-12 text-white/40" /></div>;
  }

  const badgeCountMap = {};
  userBadges.forEach(ub => { badgeCountMap[ub.user_id] = (badgeCountMap[ub.user_id] || 0) + 1; });

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("AdminDashboard")} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Users className="w-6 h-6 text-white" />
        <h1 className="text-2xl font-black text-white uppercase" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>Membros</h1>
        <span className="text-sm text-white/50 ml-auto font-medium">{users.length} membros</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Buscar por nome, e-mail ou usuÃ¡rio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30"
        />
      </div>

      <div className="space-y-3">
        {filteredUsers.map((member) => (
          <div key={member.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-900 overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-white/20">
                {member.profile_image ? (
                  <img src={member.profile_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-white">{member.full_name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{member.full_name}</p>
                  {member.role === "admin" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-black uppercase">Admin</span>
                  )}
                </div>
                <p className="text-xs text-white/50 truncate">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-white/50 font-medium">{badgeCountMap[member.id] || 0} emblemas</span>
              <Link to={createPageUrl(`AdminGrantBadge?user_id=${member.id}`)}>
                <Button size="sm" variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold">
                  <Award className="w-4 h-4 mr-1" /> Conceder
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/50 hover:text-white"
                onClick={() => handleSync(member)}
                disabled={syncingId === member.id}
                title="Sincronizar perfil pÃºblico"
              >
                <RefreshCw className={`w-4 h-4 ${syncingId === member.id ? "animate-spin" : ""}`} />
              </Button>
              <Link to={createPageUrl(`PublicProfile?id=${member.id}`)}>
                <Button size="sm" variant="ghost" className="text-white/50 hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}