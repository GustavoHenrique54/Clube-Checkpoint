import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Trophy, Plus, Pencil, Trash2, ArrowLeft, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = ["participation", "game_completion", "events", "founder", "special", "secret", "veteran"];
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

const categoryLabels = {
  participation: "Participação", game_completion: "Game Concluído", events: "Eventos",
  founder: "Fundador", special: "Especial", secret: "Secreto", veteran: "Veterano",
};

const rarityLabels = {
  common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário",
};

const rarityColors = {
  common: "text-slate-300", uncommon: "text-green-300", rare: "text-blue-200",
  epic: "text-purple-300", legendary: "text-yellow-300",
};

const emptyBadge = { name: "", description: "", category: "participation", rarity: "common", is_secret: false, icon_image: "" };

export default function AdminBadges() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [form, setForm] = useState(emptyBadge);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { db.auth.me().then(setUser); }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: () => db.entities.Badge.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Badge.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["badges"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Badge.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["badges"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Badge.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["badges"] }),
  });

  const openCreate = () => { setEditingBadge(null); setForm(emptyBadge); setDialogOpen(true); };
  const openEdit = (badge) => {
    setEditingBadge(badge);
    setForm({ name: badge.name, description: badge.description, category: badge.category, rarity: badge.rarity, is_secret: badge.is_secret || false, icon_image: badge.icon_image || "" });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingBadge(null); setForm(emptyBadge); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, icon_image: file_url }));
    setUploading(false);
  };

  const handleSave = () => {
    if (editingBadge) updateMutation.mutate({ id: editingBadge.id, data: form });
    else createMutation.mutate(form);
  };

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen"><Shield className="w-12 h-12 text-white/40" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AdminDashboard")} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Trophy className="w-6 h-6 text-white" />
          <h1 className="text-2xl font-black text-white uppercase" style={{textShadow: "2px 2px 0 rgba(0,0,0,0.3)"}}>Emblemas</h1>
        </div>
        <Button onClick={openCreate} className="bg-white text-blue-700 hover:bg-blue-50 font-black">
          <Plus className="w-4 h-4 mr-1.5" /> Criar Emblema
        </Button>
      </div>

      <div className="space-y-3">
        {badges.map((badge) => (
          <div key={badge.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                {badge.icon_image ? <img src={badge.icon_image} alt="" className="w-7 h-7 object-contain" /> : <Trophy className="w-6 h-6 text-white/30" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate uppercase">{badge.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-bold ${rarityColors[badge.rarity]}`}>{rarityLabels[badge.rarity]}</span>
                  <span className="text-white/25">·</span>
                  <span className="text-xs text-white/50">{categoryLabels[badge.category]}</span>
                  {badge.is_secret && <span className="text-xs text-white/40">· </span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => openEdit(badge)} className="text-white/50 hover:text-white">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(badge.id)} className="text-white/50 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {badges.length === 0 && (
          <div className="text-center py-12 text-white/50">Nenhum emblema criado ainda.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-blue-950 border-white/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-white">{editingBadge ? "Editar Emblema" : "Criar Emblema"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white font-bold">Ícone do Emblema</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  {form.icon_image ? <img src={form.icon_image} alt="" className="w-8 h-8 object-contain" /> : <Trophy className="w-7 h-7 text-white/30" />}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white font-bold hover:bg-white/20">
                    <Camera className="w-4 h-4" />
                    {uploading ? "Enviando..." : "Enviar"}
                  </div>
                </label>
                {form.icon_image && (
                  <button onClick={() => setForm(prev => ({ ...prev, icon_image: "" }))} className="text-white/40 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-white font-bold">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-white/10 border-white/20 text-white" />
            </div>
            <div>
              <Label className="text-white font-bold">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 bg-white/10 border-white/20 text-white resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-bold">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-blue-900 border-white/20">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white">{categoryLabels[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white font-bold">Raridade</Label>
                <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-blue-900 border-white/20">
                    {RARITIES.map(r => <SelectItem key={r} value={r} className="text-white">{rarityLabels[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white font-bold">Emblema Secreto</Label>
              <Switch checked={form.is_secret} onCheckedChange={(v) => setForm({ ...form, is_secret: v })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={closeDialog} className="border-white/30 text-white bg-transparent font-bold">Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.name || createMutation.isPending || updateMutation.isPending} className="bg-white text-blue-700 hover:bg-blue-50 font-black">
                {editingBadge ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}