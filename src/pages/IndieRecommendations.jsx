import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { 
  Gamepad2, Plus, Heart, Share2, Search, Trash2, Pencil, Check, 
  Sparkles, Trophy, MessageSquare, User, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Fallback initial recommendations for immediate demonstration or if database table is not yet created
const INITIAL_FALLBACK_RECOMMENDATIONS = [
  {
    id: "hollow-knight-demo",
    title: "Hollow Knight",
    submitter_name: "Gustavo",
    comment: "Um dos maiores metroidvanias de todos os tempos. Trilha sonora e direção de arte impecáveis!",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/0/04/Hollow_Knight_first_cover_art.webp",
    votes: 8,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: "celeste-demo",
    title: "Celeste",
    submitter_name: "Lucas Checkpoint",
    comment: "História emocionante sobre superação e um platformer extremamente afiado. Perfeito para o clube!",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/6/62/Celeste_box_art.png",
    votes: 6,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "sea-of-stars-demo",
    title: "Sea of Stars",
    submitter_name: "Mariana",
    comment: "RPG em pixel art inspirado nos clássicos dos anos 90 como Chrono Trigger. Trilha sonora incrível!",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/e/e0/Sea_of_Stars_cover_art.jpg",
    votes: 5,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

// Utility function to fetch cover art from Wikipedia silently in background with smart sequel matching
async function fetchWikipediaCover(gameTitle) {
  if (!gameTitle || !gameTitle.trim()) return null;
  const cleanTitle = gameTitle.trim();
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTitle + " video game")}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData.query?.search;
    if (!results || results.length === 0) return null;

    // Smart matching for sequel numbers (e.g. "Hades 2" -> match "2" or "II")
    const cleanLower = cleanTitle.toLowerCase();
    const seqTokens = [];
    if (/\b(2|ii)\b/i.test(cleanLower)) seqTokens.push("2", "ii");
    if (/\b(3|iii)\b/i.test(cleanLower)) seqTokens.push("3", "iii");
    if (/\b(4|iv)\b/i.test(cleanLower)) seqTokens.push("4", "iv");
    if (/\b(5|v)\b/i.test(cleanLower)) seqTokens.push("5", "v");

    let bestResult = results[0];
    let maxScore = -999;

    for (const item of results) {
      const itemTitleLower = item.title.toLowerCase();
      let score = 0;

      // Exact title match
      if (itemTitleLower === cleanLower || itemTitleLower === `${cleanLower} (video game)`) {
        score += 100;
      }

      // Sequel number match penalty / reward
      if (seqTokens.length > 0) {
        const itemHasSeq = seqTokens.some(tok => new RegExp(`\\b${tok}\\b`, 'i').test(itemTitleLower));
        if (itemHasSeq) {
          score += 100;
        } else {
          score -= 150; // Heavily penalize base game when user searched for sequel!
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestResult = item;
      }
    }
    
    const pageTitle = bestResult.title;
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=600&pilicense=any&format=json&origin=*`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = imgData.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    return pages[pageId]?.thumbnail?.source || null;
  } catch (e) {
    console.error("Erro ao buscar capa na Wikipedia:", e);
    return null;
  }
}

export default function IndieRecommendations() {
  const [user, setUser] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("votes"); // 'votes' | 'recent' | 'title'
  
  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  // Simple Form state (3 fields only)
  const [gameTitle, setGameTitle] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");

  // Edit State (for Admin)
  const [editingItem, setEditingItem] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Votes stored in local state/storage to prevent double voting locally
  const [votedIds, setVotedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("__voted_indies__") || "[]");
    } catch {
      return [];
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enforce dark mode on page mount
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Load user profile if logged in
  useEffect(() => {
    db.auth.me().then((me) => {
      setUser(me);
      if (me?.display_name || me?.username) {
        setSubmitterName(me.display_name || me.username);
      }
    }).catch(() => {});
  }, []);

  // Fetch Indie Recommendations
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["indieRecommendations"],
    queryFn: async () => {
      try {
        const list = await db.entities.IndieRecommendation.list("-created_at");
        if (!list || list.length === 0) {
          await db.entities.IndieRecommendation.filter().catch(e => { throw e; });
        }
        setIsUsingFallback(false);
        return list || [];
      } catch (e) {
        console.warn("Supabase table 'indie_recommendations' not available. Using local storage fallback.", e);
        setIsUsingFallback(true);
        const local = localStorage.getItem("__indie_recommendations__");
        if (local) {
          try {
            return JSON.parse(local);
          } catch {
            return INITIAL_FALLBACK_RECOMMENDATIONS;
          }
        } else {
          localStorage.setItem("__indie_recommendations__", JSON.stringify(INITIAL_FALLBACK_RECOMMENDATIONS));
          return INITIAL_FALLBACK_RECOMMENDATIONS;
        }
      }
    }
  });

  // Auto-correct covers for sequels (e.g. Hades 2 having Hades 1 cover)
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) return;

    const fixCovers = async () => {
      let updatedAny = false;
      for (const item of recommendations) {
        const titleLower = (item.title || "").toLowerCase();
        const isSequel = /\b(2|3|4|5|ii|iii|iv|v)\b/i.test(titleLower);
        
        if (isSequel || !item.cover_image) {
          const correctCover = await fetchWikipediaCover(item.title);
          if (correctCover && correctCover !== item.cover_image) {
            try {
              if (isUsingFallback) {
                const local = localStorage.getItem("__indie_recommendations__");
                if (local) {
                  const list = JSON.parse(local);
                  const idx = list.findIndex(r => r.id === item.id);
                  if (idx !== -1) {
                    list[idx].cover_image = correctCover;
                    localStorage.setItem("__indie_recommendations__", JSON.stringify(list));
                    updatedAny = true;
                  }
                }
              } else {
                await db.entities.IndieRecommendation.update(item.id, { cover_image: correctCover });
                updatedAny = true;
              }
            } catch (e) {
              console.error("Failed to update cover for:", item.title, e);
            }
          }
        }
      }

      if (updatedAny) {
        queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
      }
    };

    fixCovers();
  }, [recommendations, isUsingFallback, queryClient]);

  const isAdmin = user?.role === "admin";

  // Create Mutation with automatic failover to local storage if DB table does not exist
  const addMutation = useMutation({
    mutationFn: async (newItem) => {
      // Background auto-fetch cover image from Wikipedia
      if (newItem.title) {
        try {
          const autoCover = await fetchWikipediaCover(newItem.title);
          if (autoCover) newItem.cover_image = autoCover;
        } catch (e) {
          console.warn("Auto cover fetch failed:", e);
        }
      }

      // Try Supabase first, fallback gracefully to localStorage if table doesn't exist
      try {
        if (isUsingFallback) throw new Error("Using fallback mode");
        return await db.entities.IndieRecommendation.create(newItem);
      } catch (err) {
        console.warn("Supabase create failed, saving recommendation locally:", err);
        setIsUsingFallback(true);
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = [newItem, ...currentList];
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return newItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
      resetForm();
      setShowAddDialog(false);
      toast({
        title: "Recomendação enviada! 🚀",
        description: "Seu jogo indie foi adicionado à lista de recomendações.",
      });
    },
    onError: (err) => {
      console.error(err);
      // Fallback save in case mutation throws
      const newItem = {
        id: Math.random().toString(36).substring(2, 11),
        title: gameTitle.trim(),
        submitter_name: submitterName.trim(),
        comment: comment.trim() || null,
        votes: 1,
        created_at: new Date().toISOString()
      };
      const local = localStorage.getItem("__indie_recommendations__");
      const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
      localStorage.setItem("__indie_recommendations__", JSON.stringify([newItem, ...currentList]));
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
      resetForm();
      setShowAddDialog(false);
      toast({
        title: "Recomendação salva! 🚀",
        description: "Seu jogo foi adicionado à lista.",
      });
    }
  });

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: async ({ id, delta }) => {
      const item = recommendations.find(r => r.id === id);
      const currentVotes = (item?.votes || 0) + delta;
      
      try {
        if (isUsingFallback) throw new Error("Fallback mode");
        return await db.entities.IndieRecommendation.update(id, { votes: Math.max(0, currentVotes) });
      } catch {
        setIsUsingFallback(true);
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = currentList.map(r => r.id === id ? { ...r, votes: Math.max(0, currentVotes) } : r);
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return { id, votes: currentVotes };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        if (isUsingFallback) throw new Error("Fallback mode");
        return await db.entities.IndieRecommendation.delete(id);
      } catch {
        setIsUsingFallback(true);
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = currentList.filter(r => r.id !== id);
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
      toast({ title: "Recomendação removida" });
    }
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async (updated) => {
      try {
        if (isUsingFallback) throw new Error("Fallback mode");
        return await db.entities.IndieRecommendation.update(updated.id, updated);
      } catch {
        setIsUsingFallback(true);
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = currentList.map(r => r.id === updated.id ? updated : r);
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return updated;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
      setShowEditDialog(false);
      setEditingItem(null);
      toast({ title: "Recomendação atualizada com sucesso!" });
    }
  });

  const handleToggleVote = (id) => {
    const hasVoted = votedIds.includes(id);
    let newVoted;
    if (hasVoted) {
      newVoted = votedIds.filter(vId => vId !== id);
      voteMutation.mutate({ id, delta: -1 });
    } else {
      newVoted = [...votedIds, id];
      voteMutation.mutate({ id, delta: 1 });
    }
    setVotedIds(newVoted);
    localStorage.setItem("__voted_indies__", JSON.stringify(newVoted));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!gameTitle.trim()) {
      setFormError("Informe o nome do jogo indie.");
      return;
    }
    if (!submitterName.trim()) {
      setFormError("Informe o seu nome para sabermos quem indicou!");
      return;
    }

    const newItem = {
      id: Math.random().toString(36).substring(2, 11),
      title: gameTitle.trim(),
      submitter_name: submitterName.trim(),
      comment: comment.trim() || null,
      cover_image: null,
      votes: 1,
      created_at: new Date().toISOString()
    };

    const newVoted = [...votedIds, newItem.id];
    setVotedIds(newVoted);
    localStorage.setItem("__voted_indies__", JSON.stringify(newVoted));

    addMutation.mutate(newItem);
  };

  const resetForm = () => {
    setGameTitle("");
    setComment("");
    setFormError("");
    if (user?.display_name || user?.username) {
      setSubmitterName(user.display_name || user.username);
    }
  };

  const handleCopyShareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setShowShareSuccess(true);
    toast({
      title: "Link copiado! 🔗",
      description: "Envie este link direto para os membros recomendarem jogos indies.",
    });
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  // Filter and sort recommendations
  const filteredRecommendations = recommendations.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.submitter_name?.toLowerCase().includes(query) ||
      item.comment?.toLowerCase().includes(query)
    );
  });

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    if (sortBy === "votes") {
      return (b.votes || 0) - (a.votes || 0);
    }
    if (sortBy === "recent") {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortBy === "title") {
      return (a.title || "").localeCompare(b.title || "");
    }
    return 0;
  });

  const totalVotesCount = recommendations.reduce((acc, curr) => acc + (curr.votes || 0), 0);

  return (
    <div className="dark bg-[#080b11] text-slate-100 min-h-screen pb-24 font-sans ckpnt-pattern selection:bg-ps-blue selection:text-white">
      
      {/* Premium Minimal Hero Banner */}
      <div className="relative overflow-hidden bg-[#0c101a] border-b border-slate-800/80 pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Ambient Lighting */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-ps-blue/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            <div className="space-y-4 max-w-3xl">
              
              {/* Brand Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ps-blue/10 border border-ps-blue/30 text-ps-blue text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-ps-blue animate-pulse" />
                <span>Mês dos Jogos Indies • Clube Checkpoint</span>
              </div>
              
              {/* Title & Description */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Indicação de Jogos Indies
              </h1>
              
              <p className="text-slate-300 text-base leading-relaxed font-normal max-w-2xl">
                Ajude a escolher o próximo jogo do clube! Indique seus indies favoritos e vote na lista da comunidade. 
                <span className="block mt-1 text-white font-bold">Aberto a todos — Acesso livre por link direto, sem necessidade de login.</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold py-6 px-7 rounded-xl shadow-lg shadow-ps-blue/20 transition-all text-sm sm:text-base flex items-center gap-2 border border-blue-400/20"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Recomendar Jogo Indie</span>
              </Button>

              <Button
                onClick={handleCopyShareLink}
                variant="outline"
                className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-100 font-bold py-6 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm"
                title="Copiar link da página para compartilhar"
              >
                {showShareSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-300" />
                    <span>Copiar Link</span>
                  </>
                )}
              </Button>
            </div>

          </div>

          {/* High-Contrast Stat Cards */}
          <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            <div className="bg-[#111724] border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-lg bg-ps-blue/20 border border-ps-blue/40 flex items-center justify-center text-ps-blue shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jogos Indicados</p>
                <p className="text-2xl font-black text-white">{recommendations.length}</p>
              </div>
            </div>

            <div className="bg-[#111724] border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Votos Computados</p>
                <p className="text-2xl font-black text-white">{totalVotesCount}</p>
              </div>
            </div>

            <div className="bg-[#111724] border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acesso da Página</p>
                <p className="text-xs font-bold text-slate-200">Link Direto / Público</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Minimal Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar jogo ou quem indicou..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-[#101522] border-slate-700 focus:border-ps-blue text-white placeholder:text-slate-400 rounded-xl text-sm font-medium shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-1.5 bg-[#101522] border border-slate-800 p-1 rounded-xl shrink-0">
            <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Ordenar:
            </span>
            <button
              onClick={() => setSortBy("votes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "votes" 
                  ? "bg-ps-blue text-white shadow-md font-black" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Mais Votados 🔥
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "recent" 
                  ? "bg-ps-blue text-white shadow-md font-black" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Recentes ⏱️
            </button>
            <button
              onClick={() => setSortBy("title")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "title" 
                  ? "bg-ps-blue text-white shadow-md font-black" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              A-Z 🔤
            </button>
          </div>

        </div>

        {/* Recommendations List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#111622] border border-slate-800 rounded-2xl p-5 animate-pulse h-64 flex flex-col justify-between">
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-slate-800 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-800/60 rounded w-1/2" />
                    <div className="h-10 bg-slate-800/40 rounded w-full mt-2" />
                  </div>
                </div>
                <div className="h-9 bg-slate-800 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : sortedRecommendations.length === 0 ? (
          /* Empty State */
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-10 text-center max-w-md mx-auto my-12 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-ps-blue/15 border border-ps-blue/30 text-ps-blue flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Nenhuma recomendação</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {searchQuery 
                ? "Nenhum jogo atende aos critérios de busca."
                : "Seja a primeira pessoa a fazer uma recomendação!"}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setShowAddDialog(true);
              }}
              className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Indicar Jogo Indie
            </Button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRecommendations.map((item) => {
              const hasVoted = votedIds.includes(item.id);
              
              return (
                <div
                  key={item.id}
                  className="group bg-[#111622] border border-slate-800 hover:border-ps-blue/60 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-ps-blue/10 flex flex-col justify-between"
                >
                  {/* Top: Cover & Details */}
                  <div>
                    <div className="flex gap-4 items-start">
                      
                      {/* Game Cover */}
                      <div className="w-24 h-32 rounded-xl overflow-hidden bg-[#182030] border border-slate-700/80 shrink-0 relative shadow-md group-hover:border-ps-blue/50 transition-colors">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-900 text-ps-blue"
                          style={{ display: item.cover_image ? 'none' : 'flex' }}
                        >
                          <Gamepad2 className="w-6 h-6 mb-1 opacity-80" />
                          <span className="text-[10px] font-black uppercase tracking-wider line-clamp-2 leading-tight text-slate-200">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-lg text-white line-clamp-2 leading-tight group-hover:text-ps-blue transition-colors" title={item.title}>
                          {item.title}
                        </h3>

                        {/* Submitter Name Badge */}
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ps-blue/15 border border-ps-blue/30 text-blue-300 text-xs font-bold truncate max-w-full">
                          <User className="w-3.5 h-3.5 shrink-0 text-ps-blue" />
                          <span className="truncate">Indicado por <strong className="text-white">{item.submitter_name}</strong></span>
                        </div>
                      </div>

                    </div>

                    {/* Submitter Comment Box */}
                    {item.comment && (
                      <div className="mt-4 p-3 rounded-xl bg-[#0a0e17] border border-slate-800 text-xs text-slate-200 leading-relaxed font-normal relative">
                        <MessageSquare className="w-3.5 h-3.5 text-ps-blue absolute -top-2 left-3 bg-[#111622] px-0.5" />
                        <p className="line-clamp-3">"{item.comment}"</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Upvote Button & Meta */}
                  <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    
                    {/* Upvote Button */}
                    <button
                      onClick={() => handleToggleVote(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        hasVoted
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/50 border border-rose-500"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-rose-500/60 hover:text-rose-400"
                      }`}
                      title={hasVoted ? "Clique para remover seu voto" : "Votar nesta indicação"}
                    >
                      <Heart className={`w-4 h-4 ${hasVoted ? "fill-current text-white" : ""}`} />
                      <span>{item.votes || 0} {item.votes === 1 ? "Voto" : "Votos"}</span>
                    </button>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setGameTitle(item.title || "");
                              setSubmitterName(item.submitter_name || "");
                              setComment(item.comment || "");
                              setShowEditDialog(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remover "${item.title}" das recomendações?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Simplified Add Recommendation Modal (Only 3 inputs) */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="dark bg-[#0f1420] text-slate-100 border border-slate-800 max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2.5 text-white">
              <Sparkles className="w-6 h-6 text-ps-blue" />
              Recomendar Jogo Indie
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-300">
              Qual jogo indie você quer ver o clube jogando no próximo mês? Não precisa de login!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            
            {formError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-300">
                {formError}
              </div>
            )}

            {/* Field 1: Game Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Nome do Jogo Indie *
              </label>
              <Input
                type="text"
                placeholder="Ex: Celeste, Hades, Undertale, Tunic..."
                value={gameTitle}
                onChange={(e) => {
                  setGameTitle(e.target.value);
                  setFormError("");
                }}
                className="bg-[#141a27] border-slate-700 focus:border-ps-blue text-white placeholder:text-slate-400 rounded-xl py-2.5"
                required
              />
            </div>

            {/* Field 2: Submitter Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Seu Nome ou Apelido *
              </label>
              <Input
                type="text"
                placeholder="Como quer ser identificado na indicação?"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                className="bg-[#141a27] border-slate-700 focus:border-ps-blue text-white placeholder:text-slate-400 rounded-xl py-2.5"
                required
              />
            </div>

            {/* Field 3: Comment / Motivo (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Por que você indica esse jogo? (Opcional)
              </label>
              <Textarea
                placeholder="Conte brevemente por que ele é perfeito para o clube..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-[#141a27] border-slate-700 focus:border-ps-blue text-white placeholder:text-slate-400 rounded-xl text-sm min-h-[90px]"
              />
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddDialog(false)}
                className="text-slate-300 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending}
                className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold py-3 px-6 rounded-xl flex-1 shadow-md shadow-ps-blue/20"
              >
                {addMutation.isPending ? "Enviando..." : "Enviar Indicação"}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal (Admin) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="dark bg-[#0f1420] text-slate-100 border border-slate-800 max-w-lg rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">Editar Recomendação (Admin)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-200 mb-1">Título</label>
              <Input
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="bg-[#141a27] border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-200 mb-1">Quem indicou</label>
              <Input
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                className="bg-[#141a27] border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-200 mb-1">Comentário</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-[#141a27] border-slate-700 text-white min-h-[70px]"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="text-slate-300 hover:text-white">Cancelar</Button>
              <Button
                onClick={() => {
                  editMutation.mutate({
                    ...editingItem,
                    title: gameTitle,
                    submitter_name: submitterName,
                    comment
                  });
                }}
                className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
