import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from
"@/components/ui/dialog";
import {
  Pencil, Plus, Trash2, ExternalLink,
  Link as LinkIcon, Newspaper, Save, MapPin, Trophy, Medal, Crown, ChevronLeft, ChevronRight } from
"lucide-react";

function formatMeetingDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  };
}

const LEADERBOARD_PAGE_SIZE = 15;

export default function ClubHub() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("hub");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const queryClient = useQueryClient();

  // Dialog states
  const [viewingNews, setViewingNews] = useState(null);
  const [editNewsOpen, setEditNewsOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editGameOpen, setEditGameOpen] = useState(false);
  const [editMeetingOpen, setEditMeetingOpen] = useState(false);
  const [editLinkOpen, setEditLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  // Form states
  const [gameForm, setGameForm] = useState({ active_game_title: "", active_game_image: "", active_game_description: "" });
  const [meetingForm, setMeetingForm] = useState({ next_meeting_datetime: "", meeting_location: "" });
  const [newsForm, setNewsForm] = useState({ title: "", excerpt: "", content: "", cover_image: "", is_published: true });
  const [linkForm, setLinkForm] = useState({ title: "", url: "", description: "", emoji: "" });

  useEffect(() => {db.auth.me().then(setUser);}, []);

  const isAdmin = user?.role === "admin";

  const { data: hubRecords = [] } = useQuery({
    queryKey: ["clubHub"],
    queryFn: () => db.entities.ClubHub.list()
  });
  const hub = hubRecords[0];

  const { data: news = [] } = useQuery({
    queryKey: ["clubNews"],
    queryFn: () => db.entities.ClubNews.list("-created_date")
  });

  const { data: links = [] } = useQuery({
    queryKey: ["clubLinks"],
    queryFn: () => db.entities.ClubLink.list()
  });

  const { data: leaderboardProfiles = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => db.entities.PublicProfile.list("-score", 500),
  });

  const sortedProfiles = [...leaderboardProfiles].sort((a, b) => (b.score || 0) - (a.score || 0));
  const leaderTotalPages = Math.max(1, Math.ceil(sortedProfiles.length / LEADERBOARD_PAGE_SIZE));
  const leaderPaginated = sortedProfiles.slice((leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE, leaderboardPage * LEADERBOARD_PAGE_SIZE);
  const globalRank = (i) => (leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE + i;

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-white/40 font-black text-sm w-5 text-center">{index + 1}</span>;
  };

  const getRankBg = (index) => {
    if (index === 0) return "bg-yellow-400/10 border-yellow-400/20";
    if (index === 1) return "bg-slate-300/10 border-slate-300/20";
    if (index === 2) return "bg-amber-600/10 border-amber-600/20";
    return "bg-ps-dark-card border-white/5";
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["clubHub"] });
    queryClient.invalidateQueries({ queryKey: ["clubNews"] });
    queryClient.invalidateQueries({ queryKey: ["clubLinks"] });
  };

  // --- Game / Meeting mutations ---
  const saveHub = useMutation({
    mutationFn: async (data) => {
      if (hub) return db.entities.ClubHub.update(hub.id, data);
      return db.entities.ClubHub.create(data);
    },
    onSuccess: invalidate
  });

  // --- News mutations ---
  const saveNews = useMutation({
    mutationFn: async (data) => {
      if (editingNews?.id) return db.entities.ClubNews.update(editingNews.id, data);
      return db.entities.ClubNews.create(data);
    },
    onSuccess: () => {invalidate();setEditNewsOpen(false);}
  });

  const deleteNews = useMutation({
    mutationFn: (id) => db.entities.ClubNews.delete(id),
    onSuccess: invalidate
  });

  // --- Link mutations ---
  const saveLink = useMutation({
    mutationFn: async (data) => {
      if (editingLink?.id) return db.entities.ClubLink.update(editingLink.id, data);
      return db.entities.ClubLink.create(data);
    },
    onSuccess: () => {invalidate();setEditLinkOpen(false);}
  });

  const deleteLink = useMutation({
    mutationFn: (id) => db.entities.ClubLink.delete(id),
    onSuccess: invalidate
  });

  const openEditGame = () => {
    setGameForm({
      active_game_title: hub?.active_game_title || "",
      active_game_image: hub?.active_game_image || "",
      active_game_description: hub?.active_game_description || ""
    });
    setEditGameOpen(true);
  };

  const openEditMeeting = () => {
    let dt = hub?.next_meeting_datetime || "";
    if (dt) {
      // Format for datetime-local input
      const d = new Date(dt);
      const pad = (n) => String(n).padStart(2, "0");
      dt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    setMeetingForm({ next_meeting_datetime: dt, meeting_location: hub?.meeting_location || "" });
    setEditMeetingOpen(true);
  };

  const openEditNews = (item = null) => {
    setEditingNews(item);
    setNewsForm(item ? { title: item.title, excerpt: item.excerpt || "", content: item.content, cover_image: item.cover_image || "", is_published: item.is_published ?? true } : { title: "", excerpt: "", content: "", cover_image: "", is_published: true });
    setEditNewsOpen(true);
  };

  const openEditLink = (item = null) => {
    setEditingLink(item);
    setLinkForm(item ? { title: item.title, url: item.url, description: item.description || "", emoji: item.emoji || "" } : { title: "", url: "", description: "", emoji: "" });
    setEditLinkOpen(true);
  };

  const meeting = formatMeetingDate(hub?.next_meeting_datetime);

  const publishedNews = news.filter((n) => n.is_published || isAdmin);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            Hub do Clube
          </h1>
          <p className="text-white/55 text-sm mt-1">Tudo do Clube Checkpoint em um só lugar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("hub")}
          className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "hub" ? "bg-ps-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          Hub
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === "leaderboard" ? "bg-ps-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <Trophy className="w-4 h-4" /> Placar
        </button>
      </div>

      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <div className="bg-ps-dark-card border border-white/10 rounded-md p-4 flex gap-4 sm:gap-6 text-center flex-wrap">
            {[
              { label: "Comum", pts: "5 pts", color: "text-white" },
              { label: "Incomum", pts: "10 pts", color: "text-green-400" },
              { label: "Raro", pts: "25 pts", color: "text-blue-400" },
              { label: "Épico", pts: "50 pts", color: "text-purple-400" },
              { label: "Lendário", pts: "100 pts", color: "text-yellow-400" },
            ].map(({ label, pts, color }) => (
              <div key={label} className="flex-1 min-w-[60px]">
                <p className="text-xs text-white/50 font-bold uppercase">{label}</p>
                <p className={`${color} font-black`}>{pts}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {leaderPaginated.map((profile, i) => {
              const gi = globalRank(i);
              return (
                <Link
                  key={profile.id}
                  to={createPageUrl(`PublicProfile?id=${profile.user_id}`)}
                  className={`flex items-center gap-4 p-4 rounded-md border transition-all hover:bg-white/5 ${getRankBg(gi)}`}
                >
                  <div className="flex items-center justify-center w-7 flex-shrink-0">
                    {getRankIcon(gi)}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-900 border-2 border-white/20 flex items-center justify-center">
                    {profile.profile_image ? (
                      <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">{(profile.display_name || "?")?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{profile.display_name || profile.username || "Membro"}</p>
                    {profile.username && <p className="text-xs text-white/50">@{profile.username}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-white">{profile.score || 0}</p>
                    <p className="text-xs text-white/50">pontos</p>
                  </div>
                </Link>
              );
            })}
            {sortedProfiles.length === 0 && (
              <div className="text-center py-12 text-white/50">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">Nenhum membro com pontuação ainda.</p>
              </div>
            )}
          </div>
          {leaderTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))} disabled={leaderboardPage === 1} className="border-white/20 text-white bg-transparent hover:bg-white/10 disabled:opacity-30 rounded-full px-4 py-1.5 text-xs font-bold">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/60 font-bold">Página {leaderboardPage} de {leaderTotalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setLeaderboardPage(p => Math.min(leaderTotalPages, p + 1))} disabled={leaderboardPage === leaderTotalPages} className="border-white/20 text-white bg-transparent hover:bg-white/10 disabled:opacity-30 rounded-full px-4 py-1.5 text-xs font-bold">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "hub" && <>
      {/* Active Game + Meeting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Game — vertical cover */}
        <div className="bg-ps-dark-card border border-white/10 rounded-md overflow-hidden relative group flex flex-col justify-center flex-1">
          {isAdmin &&
          <button onClick={openEditGame} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100">
              <Pencil className="w-4 h-4" />
            </button>
          }
          <div className="mx-1 my-5 px-5 flex items-center gap-4 h-full w-full">
            {hub?.active_game_image &&
            <div className="shrink-0 w-24 flex items-center justify-center" style={{ aspectRatio: "2/3" }}>
                <img src={hub.active_game_image} alt={hub.active_game_title} className="w-full h-auto object-contain rounded-md" />
              </div>
            }
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-ps-blue text-white rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Jogo Ativo</span>
              </div>
              {hub?.active_game_title ?
              <>
                  <h2 className="text-lg font-bold text-white leading-tight">{hub.active_game_title}</h2>
                  {hub.active_game_description &&
                <p className="text-white/60 text-xs mt-2 leading-relaxed">{hub.active_game_description}</p>
                }
                </> :

              <p className="text-white/40 text-sm italic">{isAdmin ? "Clique no lápis para definir o jogo ativo." : "Nenhum jogo ativo no momento."}</p>
              }
            </div>
          </div>
        </div>

        {/* Next Meeting */}
        <div className="bg-ps-dark-card border border-white/10 rounded-md p-5 relative group">
          {isAdmin &&
          <button onClick={openEditMeeting} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
              <Pencil className="w-4 h-4" />
            </button>
          }
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-green-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Próxima Reunião</span>
          </div>
          {meeting ?
          <div className="space-y-3">
              <div className="bg-ps-dark-elevated border border-white/10 rounded-md px-5 py-4 text-center">
                <p className="text-4xl font-bold text-white">{meeting.time}</p>
                <p className="text-white/60 capitalize mt-2 text-xs font-semibold">{meeting.date}</p>
              </div>
              {hub?.meeting_location &&
            <div className="flex items-center gap-1.5 text-white/50 text-xs px-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{hub.meeting_location}</span>
                </div>
            }
            </div> :

          <p className="text-white/40 text-sm italic">{isAdmin ? "Clique no lápis para definir a reunião." : "Data da próxima reunião não anunciada ainda."}</p>
          }
        </div>
      </div>

      {/* Links */}
      <div className="bg-ps-dark-card border border-white/10 rounded-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white uppercase tracking-wide">Links Úteis</h2>
          </div>
          {isAdmin &&
          <Button size="sm" onClick={() => openEditLink()} className="bg-ps-blue text-white hover:bg-ps-blue-pressed rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border-none">
              <Plus className="w-4 h-4 mr-1" /> Novo Link
            </Button>
          }
        </div>
        {links.length === 0 ?
        <p className="text-white/40 text-sm italic">Nenhum link cadastrado ainda.</p> :

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) =>
          <div key={link.id} className="relative group/link">
                <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-md border border-white/10 bg-ps-dark-elevated hover:bg-white/5 transition-all">

                  <span className="text-2xl flex-shrink-0">{link.emoji || ""}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{link.title}</p>
                    {link.description && <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{link.description}</p>}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                </a>
                {isAdmin &&
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                    <button onClick={() => openEditLink(link)} className="p-1 rounded bg-black/50 text-white hover:bg-black/70">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteLink.mutate(link.id)} className="p-1 rounded bg-red-500/70 text-white hover:bg-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
            }
              </div>
          )}
          </div>
        }
      </div>

      {/* News */}
      <div className="bg-ps-dark-card border border-white/10 rounded-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white uppercase tracking-wide">Notícias</h2>
          </div>
          {isAdmin &&
          <Button size="sm" onClick={() => openEditNews()} className="bg-ps-blue text-white hover:bg-ps-blue-pressed rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border-none">
              <Plus className="w-4 h-4 mr-1" /> Nova Notícia
            </Button>
          }
        </div>
        {publishedNews.length === 0 ?
        <p className="text-white/40 text-sm italic">Nenhuma notícia publicada ainda.</p> :

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedNews.map((item) =>
          <div key={item.id} className="relative group/card">
                <button
              onClick={() => setViewingNews(item)}
              className="w-full text-left rounded-md border border-white/10 bg-ps-dark-elevated hover:bg-white/5 transition-all overflow-hidden">

                  {item.cover_image &&
              <div className="h-32 overflow-hidden">
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
              }
                  <div className="p-4">
                    <h3 className="font-bold text-white text-sm leading-tight group-hover:text-ps-blue transition-colors">{item.title}</h3>
                    {item.excerpt && <p className="text-white/60 text-xs mt-1.5 line-clamp-2">{item.excerpt}</p>}
                    <p className="text-white/40 text-[10px] mt-2 font-mono">{new Date(item.created_date).toLocaleDateString("pt-BR")}</p>
                    {!item.is_published && isAdmin &&
                <span className="text-xs text-yellow-400 font-bold mt-1 block">● Rascunho</span>
                }
                  </div>
                </button>
                {isAdmin &&
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button onClick={() => openEditNews(item)} className="p-1 rounded bg-black/50 text-white hover:bg-black/70">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteNews.mutate(item.id)} className="p-1 rounded bg-red-500/70 text-white hover:bg-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
            }
              </div>
          )}
          </div>
        }
      </div>

      {/* --- Dialogs --- */}

      {/* View News */}
      <Dialog open={!!viewingNews} onOpenChange={() => setViewingNews(null)}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto rounded-md">
          {viewingNews &&
          <>
              {viewingNews.cover_image &&
            <img src={viewingNews.cover_image} alt={viewingNews.title} className="w-full h-48 object-cover rounded-md mb-2" />
            }
              <DialogHeader>
                <DialogTitle className="text-white font-bold text-lg">{viewingNews.title}</DialogTitle>
                <p className="text-white/40 text-xs font-mono">{new Date(viewingNews.created_date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</p>
              </DialogHeader>
              <div className="mt-2 text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{viewingNews.content}</div>
            </>
          }
        </DialogContent>
      </Dialog>

      {/* Edit News */}
      <Dialog open={editNewsOpen} onOpenChange={setEditNewsOpen}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-xl max-h-[85vh] overflow-y-auto rounded-md">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">{editingNews ? "Editar Notícia" : "Nova Notícia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-white/80 text-sm">Título *</Label>
              <Input value={newsForm.title} onChange={(e) => setNewsForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">Resumo (aparece no card)</Label>
              <Input value={newsForm.excerpt} onChange={(e) => setNewsForm((f) => ({ ...f, excerpt: e.target.value }))} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">Conteúdo completo *</Label>
              <Textarea value={newsForm.content} onChange={(e) => setNewsForm((f) => ({ ...f, content: e.target.value }))} rows={6} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 resize-none rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">URL da imagem de capa (opcional)</Label>
              <Input value={newsForm.cover_image} onChange={(e) => setNewsForm((f) => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newsForm.is_published} onChange={(e) => setNewsForm((f) => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4 rounded-sm" />
              <span className="text-white/80 text-sm">Publicar agora</span>
            </label>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditNewsOpen(false)} className="border-white/20 text-white bg-transparent rounded-full px-5 py-2 text-xs font-bold">Cancelar</Button>
            <Button onClick={() => saveNews.mutate(newsForm)} disabled={saveNews.isPending} className="bg-ps-blue text-white hover:bg-ps-blue-pressed rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider border-none">
              <Save className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Game */}
      <Dialog open={editGameOpen} onOpenChange={setEditGameOpen}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">Jogo Ativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-white/80 text-sm">Nome do Jogo</Label>
              <Input value={gameForm.active_game_title} onChange={(e) => setGameForm((f) => ({ ...f, active_game_title: e.target.value }))} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">URL da Capa</Label>
              <Input value={gameForm.active_game_image} onChange={(e) => setGameForm((f) => ({ ...f, active_game_image: e.target.value }))} placeholder="https://..." className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">Descrição / Progresso</Label>
              <Textarea value={gameForm.active_game_description} onChange={(e) => setGameForm((f) => ({ ...f, active_game_description: e.target.value }))} rows={3} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 resize-none rounded-sm" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditGameOpen(false)} className="border-white/20 text-white bg-transparent rounded-full px-5 py-2 text-xs font-bold">Cancelar</Button>
            <Button onClick={() => {saveHub.mutate(gameForm);setEditGameOpen(false);}} className="bg-ps-blue text-white hover:bg-ps-blue-pressed rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider border-none">
              <Save className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting */}
      <Dialog open={editMeetingOpen} onOpenChange={setEditMeetingOpen}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">Próxima Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-white/80 text-sm">Data e Horário</Label>
              <input
                type="datetime-local"
                value={meetingForm.next_meeting_datetime}
                onChange={(e) => setMeetingForm((f) => ({ ...f, next_meeting_datetime: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-sm bg-white/5 border border-white/15 text-white text-sm [color-scheme:dark]" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">Local / Link</Label>
              <Input value={meetingForm.meeting_location} onChange={(e) => setMeetingForm((f) => ({ ...f, meeting_location: e.target.value }))} placeholder="Discord, Zoom, endereço..." className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditMeetingOpen(false)} className="border-white/20 text-white bg-transparent rounded-full px-5 py-2 text-xs font-bold">Cancelar</Button>
            <Button onClick={() => {saveHub.mutate(meetingForm);setEditMeetingOpen(false);}} className="bg-ps-blue text-white hover:bg-ps-blue-pressed rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider border-none">
              <Save className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link */}
      <Dialog open={editLinkOpen} onOpenChange={setEditLinkOpen}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">{editingLink ? "Editar Link" : "Novo Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-white/80 text-sm">Emoji</Label>
              <Input value={linkForm.emoji} onChange={(e) => setLinkForm((f) => ({ ...f, emoji: e.target.value }))} className="mt-1 bg-white/5 border-white/15 text-white w-20 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">Título *</Label>
              <Input value={linkForm.title} onChange={(e) => setLinkForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">URL *</Label>
              <Input value={linkForm.url} onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-sm">Descrição</Label>
              <Input value={linkForm.description} onChange={(e) => setLinkForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-sm" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditLinkOpen(false)} className="border-white/20 text-white bg-transparent rounded-full px-5 py-2 text-xs font-bold">Cancelar</Button>
            <Button onClick={() => saveLink.mutate(linkForm)} disabled={saveLink.isPending} className="bg-ps-blue text-white hover:bg-ps-blue-pressed rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider border-none">
              <Save className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>}
    </div>
  );

}