const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, UserCheck, Clock, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FriendsSidebar({ userId }) {
  const queryClient = useQueryClient();

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sentRequests", userId],
    queryFn: () => db.entities.FriendRequest.filter({ sender_user_id: userId }),
    enabled: !!userId,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["receivedRequests", userId],
    queryFn: () => db.entities.FriendRequest.filter({ receiver_user_id: userId }),
    enabled: !!userId,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: () => db.entities.PublicProfile.list(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
    queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
  };

  const acceptMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "accepted" }),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.update(reqId, { status: "rejected" }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (reqId) => db.entities.FriendRequest.delete(reqId),
    onSuccess: invalidate,
  });

  const profileMap = {};
  allProfiles.forEach(p => { profileMap[p.user_id] = p; });

  const pendingReceived = receivedRequests.filter(r => r.status === "pending");
  const pendingSent = sentRequests.filter(r => r.status === "pending");
  const acceptedFriends = [
    ...sentRequests.filter(r => r.status === "accepted").map(r => ({ req: r, profile: profileMap[r.receiver_user_id] })),
    ...receivedRequests.filter(r => r.status === "accepted").map(r => ({ req: r, profile: profileMap[r.sender_user_id] })),
  ];

  const ProfileRow = ({ profile, children }) => (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
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
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5 space-y-5">
      <h2 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
        <Users className="w-4 h-4" /> Amigos
      </h2>

      {/* Received requests */}
      {pendingReceived.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3 h-3" /> Recebidas ({pendingReceived.length})
          </p>
          {pendingReceived.map((req) => (
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

      {/* Sent requests */}
      {pendingSent.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Enviadas ({pendingSent.length})</p>
          {pendingSent.map((req) => (
            <ProfileRow key={req.id} profile={profileMap[req.receiver_user_id]}>
              <span className="text-[10px] text-white/40 font-bold px-1">Pendente</span>
              <button onClick={() => removeMutation.mutate(req.id)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/40 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </ProfileRow>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
          <UserCheck className="w-3 h-3" /> Meus Amigos ({acceptedFriends.length})
        </p>
        {acceptedFriends.length === 0 ? (
          <p className="text-xs text-white/40 py-2 text-center">
            <Link to={createPageUrl("SearchProfiles")} className="underline hover:text-white">Busque perfis</Link> para adicionar amigos!
          </p>
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
  );
}