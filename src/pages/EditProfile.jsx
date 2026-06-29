const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Save, ArrowLeft, Star } from "lucide-react";
import { syncPublicProfile } from "@/lib/syncPublicProfile";

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: "", username: "", bio: "", featured_badges: [],
    instagram: "", discord: "", steam: "", psn_username: "", xbox_username: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    db.auth.me().then((me) => {
      setUser(me);
      setForm({
        full_name: me.display_name || me.full_name || "",
        username: me.username || "",
        bio: me.bio || "",
        featured_badges: me.featured_badges || [],
        instagram: me.instagram || "",
        discord: me.discord || "",
        steam: me.steam || "",
        psn_username: me.psn_username || "",
        xbox_username: me.xbox_username || "",
      });
    });
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

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const earnedBadges = badges.filter(b => earnedBadgeIds.includes(b.id));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    await db.auth.updateMe({ profile_image: file_url });
    const updated = await db.auth.me();
    setUser(updated);
    setUploading(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    await db.auth.updateMe({ cover_image: file_url });
    const updated = await db.auth.me();
    setUser(updated);
    setUploadingCover(false);
  };

  const toggleFeaturedBadge = (badgeId) => {
    setForm(prev => {
      const featured = prev.featured_badges || [];
      if (featured.includes(badgeId)) {
        return { ...prev, featured_badges: featured.filter(id => id !== badgeId) };
      }
      if (featured.length >= 4) return prev;
      return { ...prev, featured_badges: [...featured, badgeId] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await db.auth.updateMe({
      display_name: form.full_name || undefined,
      username: form.username || undefined,
      bio: form.bio || undefined,
      featured_badges: form.featured_badges,
      instagram: form.instagram || undefined,
      discord: form.discord || undefined,
      steam: form.steam || undefined,
      psn_username: form.psn_username || undefined,
      xbox_username: form.xbox_username || undefined,
    });
    const updated = await db.auth.me();
    await syncPublicProfile(updated);
    setSaving(false);
    navigate(createPageUrl("Profile"));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>Editar Perfil</h1>
      </div>

      {/* Cover Image */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden">
        <div className="relative h-32 ckpnt-pattern" style={{ background: "linear-gradient(135deg, #0f2566 0%, #1d4ed8 80%, #3b82f6 100%)" }}>
          {user.cover_image && <img src={user.cover_image} alt="Capa" className="w-full h-full object-cover" />}
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between">
          <Label className="text-white font-bold">Foto de Capa</Label>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 border border-white/20 text-sm text-white font-bold hover:bg-white/25 transition-colors">
              <Camera className="w-4 h-4" />
              {uploadingCover ? "Enviando..." : "Alterar Capa"}
            </div>
          </label>
        </div>
      </div>

      {/* Profile Image */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <Label className="text-white font-bold mb-3 block">Foto de Perfil</Label>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-blue-900 border-2 border-white/20 flex-shrink-0">
            {user.profile_image ? (
              <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
                <span className="text-2xl font-black text-white">{user.full_name?.[0]?.toUpperCase()}</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 border border-white/20 text-sm text-white font-bold hover:bg-white/25 transition-colors">
              <Camera className="w-4 h-4" />
              {uploading ? "Enviando..." : "Enviar Foto"}
            </div>
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 space-y-4">
        <h2 className="text-sm font-black text-white/70 uppercase tracking-wide">Informações Básicas</h2>
        <div>
          <Label className="text-white font-bold">Nome completo</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Seu nome completo"
            className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50"
          />
        </div>
        <div>
          <Label className="text-white font-bold">Nome de usuário</Label>
          <Input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Escolha um nome de usuário"
            className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50"
          />
        </div>
        <div>
          <Label className="text-white font-bold">Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Conta um pouco sobre você..."
            rows={3}
            className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none focus:border-white/50"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 space-y-4">
        <h2 className="text-sm font-black text-white/70 uppercase tracking-wide">Links & Redes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-white font-bold text-sm">📸 Instagram</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
              <Input
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="usuario"
                className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <div>
            <Label className="text-white font-bold text-sm">💬 Discord</Label>
            <Input
              value={form.discord}
              onChange={(e) => setForm({ ...form, discord: e.target.value })}
              placeholder="usuario#0000"
              className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-white font-bold text-sm">🎮 Steam</Label>
            <Input
              value={form.steam}
              onChange={(e) => setForm({ ...form, steam: e.target.value })}
              placeholder="URL ou nome de usuário"
              className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-white font-bold text-sm">🎮 PSN</Label>
            <Input
              value={form.psn_username}
              onChange={(e) => setForm({ ...form, psn_username: e.target.value })}
              placeholder="Nickname PSN"
              className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-white font-bold text-sm">🎮 Xbox</Label>
            <Input
              value={form.xbox_username}
              onChange={(e) => setForm({ ...form, xbox_username: e.target.value })}
              placeholder="Gamertag Xbox"
              className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
          </div>
        </div>
      </div>

      {/* Featured Badges */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="text-white font-bold text-base">Emblemas em Destaque</Label>
            <p className="text-xs text-white/50 mt-0.5">Selecione até 4 emblemas para destacar no seu perfil</p>
          </div>
          <span className="text-xs text-white/70 font-bold">{form.featured_badges.length}/4</span>
        </div>
        {earnedBadges.length === 0 ? (
          <p className="text-white/50 text-sm">Nenhum emblema conquistado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earnedBadges.map((badge) => {
              const isFeatured = form.featured_badges.includes(badge.id);
              return (
                <button
                  key={badge.id}
                  onClick={() => toggleFeaturedBadge(badge.id)}
                  className={`relative p-3 rounded-xl border text-left transition-all ${
                    isFeatured ? "border-yellow-400/60 bg-yellow-400/10" : "border-white/15 bg-white/5 hover:border-white/25"
                  }`}
                >
                  {isFeatured && (
                    <Star className="absolute top-2 right-2 w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      {badge.icon_image ? (
                        <img src={badge.icon_image} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="text-sm">🏆</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white truncate">{badge.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-white text-blue-700 hover:bg-blue-50 font-black">
          {saving ? "Salvando..." : <><Save className="w-4 h-4 mr-1.5" /> Salvar</>}
        </Button>
      </div>
    </div>
  );
}