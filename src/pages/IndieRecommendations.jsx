import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { 
  Gamepad2, Plus, Heart, Share2, Search, Trash2, Pencil, Check, 
  Copy, ExternalLink, Sparkles, Trophy, Flame, MessageSquare, 
  User, Calendar, Upload, Wand2, Tag, Filter, RefreshCw, Star, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import squareCaseImg from "@/assets/square-case.png";
import verticalCaseImg from "@/assets/vertical-case.png";
import horizontalCaseImg from "@/assets/horizontal-case.png";

// Fallback initial recommendations for immediate demonstration or if database table is not yet created
const INITIAL_FALLBACK_RECOMMENDATIONS = [
  {
    id: "hollow-knight-demo",
    title: "Hollow Knight",
    submitter_name: "Gustavo",
    comment: "Um dos maiores metroidvanias de todos os tempos. Trilha sonora e direção de arte impecáveis!",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/0/04/Hollow_Knight_first_cover_art.webp",
    platforms: ["PC", "Switch", "PlayStation", "Xbox"],
    votes: 8,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: "celeste-demo",
    title: "Celeste",
    submitter_name: "Lucas Checkpoint",
    comment: "História emocionante sobre superação e um platformer extremamente afiado. Perfeito para o clube!",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/6/62/Celeste_box_art.png",
    platforms: ["PC", "Switch", "PlayStation"],
    votes: 6,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "sea-of-stars-demo",
    title: "Sea of Stars",
    submitter_name: "Mariana",
    comment: "RPG em pixel art inspirado nos clássicos dos anos 90 como Chrono Trigger. Trilha sonora incrível!",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/e/e0/Sea_of_Stars_cover_art.jpg",
    platforms: ["PC", "Switch", "PlayStation", "Xbox"],
    votes: 5,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

// Utility function to fetch cover art from Wikipedia
async function fetchWikipediaCover(gameTitle) {
  if (!gameTitle || !gameTitle.trim()) return null;
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(gameTitle.trim() + " video game")}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData.query?.search;
    if (!results || results.length === 0) return null;
    
    const pageTitle = results[0].title;
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

// Image compression helper
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}

const AVAILABLE_PLATFORMS = ["PC", "Switch", "PlayStation", "Xbox", "Mobile", "Outro"];

export default function IndieRecommendations() {
  const [user, setUser] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("votes"); // 'votes' | 'recent' | 'title'
  
  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  // Form state
  const [gameTitle, setGameTitle] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [comment, setComment] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["PC"]);
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);
  const [formError, setFormError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
          // Verify if table exists or throws error
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

  const isAdmin = user?.role === "admin";

  // Create Mutation
  const addMutation = useMutation({
    mutationFn: async (newItem) => {
      if (isUsingFallback) {
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = [newItem, ...currentList];
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return newItem;
      } else {
        return db.entities.IndieRecommendation.create(newItem);
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
      setFormError(`Erro ao salvar recomendação: ${err.message || "Tente novamente."}`);
    }
  });

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: async ({ id, delta }) => {
      const item = recommendations.find(r => r.id === id);
      const currentVotes = (item?.votes || 0) + delta;
      
      if (isUsingFallback) {
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = currentList.map(r => r.id === id ? { ...r, votes: Math.max(0, currentVotes) } : r);
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return { id, votes: currentVotes };
      } else {
        return db.entities.IndieRecommendation.update(id, { votes: Math.max(0, currentVotes) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (isUsingFallback) {
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = currentList.filter(r => r.id !== id);
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return { success: true };
      } else {
        return db.entities.IndieRecommendation.delete(id);
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
      if (isUsingFallback) {
        const local = localStorage.getItem("__indie_recommendations__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_RECOMMENDATIONS;
        const updatedList = currentList.map(r => r.id === updated.id ? updated : r);
        localStorage.setItem("__indie_recommendations__", JSON.stringify(updatedList));
        return updated;
      } else {
        return db.entities.IndieRecommendation.update(updated.id, updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indieRecommendations"] });
      setShowEditDialog(false);
      setEditingItem(null);
      toast({ title: "Recomendação atualizada com sucesso!" });
    }
  });

  // Auto-search cover on title blur or button click
  const handleAutoFetchCover = async (titleToFetch = gameTitle) => {
    if (!titleToFetch.trim()) return;
    setIsSearchingWiki(true);
    try {
      const wikiImage = await fetchWikipediaCover(titleToFetch);
      if (wikiImage) {
        setCoverUrl(wikiImage);
        toast({ title: "Capa oficial encontrada!", description: "Imagem atualizada via Wikipedia." });
      } else {
        toast({ title: "Capa não encontrada", description: "Insira uma URL ou faça upload da imagem." });
      }
    } catch {
      toast({ title: "Falha na busca", description: "Tente novamente ou envie uma imagem." });
    } finally {
      setIsSearchingWiki(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploadRes = await db.integrations.Core.UploadFile({ file }).catch(() => null);
      if (uploadRes?.file_url && !uploadRes.file_url.startsWith("blob:")) {
        setCoverUrl(uploadRes.file_url);
      } else {
        const compressed = await compressImage(file);
        setCoverUrl(compressed);
      }
    } catch {
      const compressed = await compressImage(file);
      setCoverUrl(compressed);
    } finally {
      setIsUploading(false);
    }
  };

  const togglePlatform = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

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
      cover_image: coverUrl.trim() || null,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ["PC"],
      votes: 1, // Author starts with 1 vote automatically
      created_at: new Date().toISOString()
    };

    // Auto add to voted list
    const newVoted = [...votedIds, newItem.id];
    setVotedIds(newVoted);
    localStorage.setItem("__voted_indies__", JSON.stringify(newVoted));

    addMutation.mutate(newItem);
  };

  const resetForm = () => {
    setGameTitle("");
    setComment("");
    setCoverUrl("");
    setSelectedPlatforms(["PC"]);
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
    <div className="min-h-screen bg-ps-dark-canvas text-white pb-20 ckpnt-pattern">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-purple-950/60 via-ps-dark-elevated/90 to-ps-dark-canvas border-b border-white/10 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Glow Effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-purple-600/20 via-ps-blue/20 to-pink-500/20 blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Mês dos Jogos Indies • Clube Checkpoint</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                Indicação de Jogos Indies 🕹️
              </h1>
              
              <p className="text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed font-medium">
                O próximo mês do clube será focado em **Jogos Indies**! Deixe a sua recomendação abaixo para que a comunidade possa votar e definir o nosso próximo jogo principal. 
                <span className="block mt-1 text-purple-300 font-bold">✨ Aberto a todos — Não é preciso fazer login para indicar!</span>
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-ps-blue hover:from-purple-500 hover:to-ps-blue-pressed text-white font-bold py-6 px-6 rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all text-sm sm:text-base flex items-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Recomendar um Jogo</span>
              </Button>

              <Button
                onClick={handleCopyShareLink}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold py-6 px-5 rounded-2xl transition-all flex items-center gap-2 text-sm"
                title="Copiar link para enviar a amigos"
              >
                {showShareSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-purple-300" />
                    <span>Copiar Link</span>
                  </>
                )}
              </Button>
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Total de Indicações</p>
                <p className="text-xl font-black text-white">{recommendations.length} {recommendations.length === 1 ? 'Jogo' : 'Jogos'}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Votos da Comunidade</p>
                <p className="text-xl font-black text-white">{totalVotesCount} {totalVotesCount === 1 ? 'Voto' : 'Votos'}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-md col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-ps-blue/20 border border-ps-blue/30 flex items-center justify-center text-ps-blue">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Acesso Direto</p>
                <p className="text-xs font-bold text-white/80">Link Privado / Sem Login</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Search and Sort Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar por jogo ou por quem recomendou..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-ps-dark-card border-white/15 focus:border-purple-500 rounded-xl text-sm text-white placeholder:text-white/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-ps-dark-card border border-white/15 p-1 rounded-xl shrink-0">
            <span className="text-xs font-bold text-white/40 px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Ordenar:
            </span>
            <button
              onClick={() => setSortBy("votes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "votes" ? "bg-purple-600 text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Mais Votados 🔥
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "recent" ? "bg-purple-600 text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Recentes ⏱️
            </button>
            <button
              onClick={() => setSortBy("title")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "title" ? "bg-purple-600 text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              A-Z 🔤
            </button>
          </div>

        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-ps-dark-card border border-white/10 rounded-2xl p-5 animate-pulse h-64 flex flex-col justify-between">
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-white/10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-10 bg-white/5 rounded w-full mt-2" />
                  </div>
                </div>
                <div className="h-8 bg-white/10 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : sortedRecommendations.length === 0 ? (
          /* Empty State */
          <div className="bg-ps-dark-card border border-white/10 rounded-3xl p-10 text-center max-w-lg mx-auto my-12 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Nenhuma recomendação encontrada</h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              {searchQuery 
                ? "Nenhum jogo indie corresponde à sua busca. Tente buscar por outro termo."
                : "Ainda não temos jogos na lista! Seja a primeira pessoa a fazer uma indicação."}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setShowAddDialog(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Indicar Jogo Indie Agora
            </Button>
          </div>
        ) : (
          /* Recommendations Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRecommendations.map((item) => {
              const hasVoted = votedIds.includes(item.id);
              
              return (
                <div
                  key={item.id}
                  className="group relative bg-ps-dark-card border border-white/10 hover:border-purple-500/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/20 flex flex-col justify-between"
                >
                  {/* Top Part: Cover + Info */}
                  <div>
                    <div className="flex gap-4">
                      {/* Game Cover Art */}
                      <div className="w-24 h-32 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 relative shadow-md group-hover:scale-[1.02] transition-transform">
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
                          className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-purple-900/40 to-slate-900 text-purple-300"
                          style={{ display: item.cover_image ? 'none' : 'flex' }}
                        >
                          <Gamepad2 className="w-6 h-6 mb-1 opacity-70" />
                          <span className="text-[10px] font-black uppercase tracking-wider line-clamp-2 leading-tight">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      {/* Info & Submitter */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors" title={item.title}>
                          {item.title}
                        </h3>

                        {/* Submitter Name */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold truncate max-w-full">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">Indicação de <strong>{item.submitter_name}</strong></span>
                        </div>

                        {/* Platforms */}
                        {item.platforms && item.platforms.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {item.platforms.map((plat) => (
                              <span key={plat} className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                                {plat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submitter Comment / Recommendation Reason */}
                    {item.comment && (
                      <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 leading-relaxed italic relative">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400 absolute -top-2 left-3 bg-ps-dark-card px-0.5" />
                        <p className="line-clamp-3">"{item.comment}"</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar: Upvote Button + Date + Admin Actions */}
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    
                    {/* Upvote Button */}
                    <button
                      onClick={() => handleToggleVote(item.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                        hasVoted
                          ? "bg-rose-600 text-white shadow-md shadow-rose-950/40"
                          : "bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 border border-white/10 hover:border-rose-500/40"
                      }`}
                      title={hasVoted ? "Clique para remover seu voto" : "Votar nesta indicação"}
                    >
                      <Heart className={`w-4 h-4 ${hasVoted ? "fill-current" : ""}`} />
                      <span>{item.votes || 0} {item.votes === 1 ? "Voto" : "Votos"}</span>
                    </button>

                    {/* Date or Admin options */}
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setGameTitle(item.title || "");
                              setSubmitterName(item.submitter_name || "");
                              setComment(item.comment || "");
                              setCoverUrl(item.cover_image || "");
                              setSelectedPlatforms(item.platforms || ["PC"]);
                              setShowEditDialog(true);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                            title="Editar indicação (Admin)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remover "${item.title}" das recomendações?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            title="Excluir indicação (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <span className="text-[10px] text-white/40 font-mono">
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

      {/* Add Recommendation Modal */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-ps-dark-elevated text-white border border-white/15 max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2.5 text-white">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Recomendar Jogo Indie
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              Qual jogo indie você quer ver o clube jogando no próximo mês? Não precisa de login!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400">
                {formError}
              </div>
            )}

            {/* Game Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                Nome do Jogo Indie *
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ex: Celeste, Hades, Undertale, Tunic..."
                  value={gameTitle}
                  onChange={(e) => {
                    setGameTitle(e.target.value);
                    setFormError("");
                  }}
                  className="bg-ps-dark-card border-white/15 focus:border-purple-500 text-white rounded-xl"
                  required
                />
                <Button
                  type="button"
                  onClick={() => handleAutoFetchCover(gameTitle)}
                  disabled={isSearchingWiki || !gameTitle.trim()}
                  variant="outline"
                  className="border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold shrink-0 rounded-xl"
                  title="Buscar capa oficial automaticamente"
                >
                  {isSearchingWiki ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Submitter Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                Seu Nome ou Apelido *
              </label>
              <Input
                type="text"
                placeholder="Como quer ser identificado na indicação?"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                className="bg-ps-dark-card border-white/15 focus:border-purple-500 text-white rounded-xl"
                required
              />
            </div>

            {/* Comment / Why Recommend */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                Por que você indica esse jogo? (Opcional)
              </label>
              <Textarea
                placeholder="Conte brevemente o que faz esse jogo ser especial para o nosso clube..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-ps-dark-card border-white/15 focus:border-purple-500 text-white rounded-xl text-sm min-h-[80px]"
              />
            </div>

            {/* Platform Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                Plataformas Onde Está Disponível
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PLATFORMS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => togglePlatform(plat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-purple-600 border-purple-400 text-white shadow-md"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cover URL / Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                Capa do Jogo (URL ou Arquivo - Opcional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="bg-ps-dark-card border-white/15 focus:border-purple-500 text-white rounded-xl text-xs flex-1"
                />
                <label className="cursor-pointer bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 transition-all">
                  {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Enviar</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Card Live Preview inside Form */}
            {(gameTitle || coverUrl) && (
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Prévia do Cartão:</p>
                <div className="p-3 rounded-2xl bg-ps-dark-card border border-white/10 flex items-center gap-3">
                  <div className="w-12 h-16 rounded-lg bg-white/10 overflow-hidden shrink-0">
                    {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{gameTitle || "Título do Jogo"}</p>
                    <p className="text-xs text-purple-300 font-medium truncate">Indicado por {submitterName || "Seu Nome"}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 pt-4 border-t border-white/10 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddDialog(false)}
                className="text-white/60 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 rounded-xl flex-1"
              >
                {addMutation.isPending ? "Salvando..." : "Enviar Indicação"}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal (For Admin) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-ps-dark-elevated text-white border border-white/15 max-w-lg rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">Editar Recomendação (Admin)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-white/80 mb-1">Título</label>
              <Input
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="bg-ps-dark-card border-white/15 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-white/80 mb-1">Quem indicou</label>
              <Input
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                className="bg-ps-dark-card border-white/15 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-white/80 mb-1">Comentário</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-ps-dark-card border-white/15 text-white min-h-[70px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-white/80 mb-1">URL da Capa</label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="bg-ps-dark-card border-white/15 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => {
                  editMutation.mutate({
                    ...editingItem,
                    title: gameTitle,
                    submitter_name: submitterName,
                    comment,
                    cover_image: coverUrl,
                    platforms: selectedPlatforms
                  });
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
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
