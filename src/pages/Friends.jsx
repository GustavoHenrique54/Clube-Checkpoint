import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, UserCheck, Clock, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Friends() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sentRequests", user?.id],
    queryFn: () => db.entities.FriendRequest.filter({ sender_user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["receivedRequests", user?.id],
    queryFn: () => db.entities.FriendRequest.filter({ receiver_user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: () => db.entities.PublicProfile.list(),
  });

  const acceptMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "accepted" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.delete(reqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profileMap = {};
  allProfiles.forEach(p => { profileMap[p.user_id] = p; });

  const pendingReceived = receivedRequests.filter(r => r.status === "pending");
  const acceptedFriends = [
    ...sentRequests.filter(r => r.status === "accepted").map(r => ({ req: r, profile: profileMap[r.receiver_user_id] })),
    ...receivedRequests.filter(r => r.status === "accepted").map(r => ({ req: r, profile: profileMap[r.sender_user_id] })),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-white" />
        <h1 className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
          Amigos
        </h1>
      </div>

      {/* Pending Requests */}
      {pendingReceived.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 space-y-4">
          <h2 className="text-sm font-black text-white/70 uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4" /> Solicitações Recebidas ({pendingReceived.length})
          </h2>
          <div className="space-y-3">
            {pendingReceived.map((req) => {
              const profile = profileMap[req.sender_user_id];
              return (
                <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-900 border-2 border-white/20 flex-shrink-0 flex items-center justify-center">
                      {profile?.profile_image ? (
                        <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-white">{(profile?.display_name || "?")?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{profile?.display_name || "Membro"}</p>
                      {profile?.username && <p className="text-xs text-white/50">@{profile.username}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => acceptMutation.mutate(req.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(req.id)} className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 space-y-4">
        <h2 className="text-sm font-black text-white/70 uppercase tracking-wide flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Meus Amigos ({acceptedFriends.length})
        </h2>
        {acceptedFriends.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Nenhum amigo ainda.</p>
            <p className="text-sm mt-1">
              <Link to={createPageUrl("SearchProfiles")} className="underline hover:text-white transition-colors">Busque perfis</Link> para adicionar amigos!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedFriends.map(({ req, profile }) => (
              <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-900 border-2 border-white/20 flex-shrink-0 flex items-center justify-center">
                    {profile?.profile_image ? (
                      <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">{(profile?.display_name || "?")?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{profile?.display_name || "Membro"}</p>
                    {profile?.username && <p className="text-xs text-white/50">@{profile.username}</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={createPageUrl(`PublicProfile?id=${profile?.user_id}`)}>
                    <Button size="sm" variant="ghost" className="text-white/50 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => removeMutation.mutate(req.id)} className="text-white/30 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}