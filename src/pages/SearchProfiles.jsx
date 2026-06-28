const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, ArrowLeft, User } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchProfiles() {
  const [query, setQuery] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["allPublicProfiles"],
    queryFn: () => db.entities.PublicProfile.list(),
  });

  const filtered = query.trim().length < 1 ? [] : profiles.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Profile")} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
          Buscar Perfis
        </h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar por nome ou @usuario..."
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
          autoFocus
        />
      </div>

      {query.trim().length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <User className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Nenhum perfil encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filtered.map((u) => (
                <Link
                  key={u.id}
                  to={createPageUrl(`PublicProfile?id=${u.user_id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-900 border border-white/20 flex-shrink-0 overflow-hidden">
                    {u.profile_image ? (
                      <img src={u.profile_image} alt={u.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
                        <span className="text-sm font-black text-white">{u.display_name?.[0]?.toUpperCase() || "?"}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{u.display_name}</p>
                    {u.username && <p className="text-white/50 text-xs">@{u.username}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {query.trim().length === 0 && (
        <p className="text-center text-white/40 text-sm pt-4">Digite um nome ou @usuario para pesquisar</p>
      )}
    </div>
  );
}