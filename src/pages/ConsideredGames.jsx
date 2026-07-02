import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { Search, Plus, Trash2, Library, Key, ExternalLink, RefreshCw, AlertCircle, AlertTriangle, Check, X, Pencil, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import ps1CaseImg from "@/assets/ps1-case.png";

// Default placeholder games in case the database table doesn't exist yet
const INITIAL_FALLBACK_GAMES = [
  {
    id: "mario-odyssey",
    title: "Super Mario Odyssey",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey_Cover_Art.jpg",
    release_year: "2017"
  },
  {
    id: "zelda-oot",
    title: "The Legend of Zelda: Ocarina of Time",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/5/57/The_Legend_of_Zelda_Ocarina_of_Time.jpg",
    release_year: "1998"
  },
  {
    id: "alan-wake-remastered",
    title: "Alan Wake Remastered",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/c/c5/Alan_Wake_box_art.jpg",
    release_year: "2021"
  },
  {
    id: "portal-2",
    title: "Portal 2",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/f/f9/Portal2cover.jpg",
    release_year: "2011"
  },
  {
    id: "gta-v",
    title: "Grand Theft Auto V",
    cover_image: "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png",
    release_year: "2013"
  }
];

// Utility function to fetch official game cover art from Wikipedia
async function fetchWikipediaCover(gameTitle) {
  if (!gameTitle || !gameTitle.trim()) return null;
  try {
    // 1. Search Wikipedia for the game title + " video game"
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(gameTitle.trim() + " video game")}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData.query?.search;
    if (!results || results.length === 0) return null;
    
    // Find the best matching page title. Usually the first search result is correct.
    const pageTitle = results[0].title;
    
    // 2. Get the page image (thumbnail) for that page
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=600&pilicense=any&format=json&origin=*`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = imgData.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    const thumbnail = pages[pageId]?.thumbnail?.source;
    return thumbnail || null;
  } catch (e) {
    console.error("Erro ao buscar capa no Wikipedia para:", gameTitle, e);
    return null;
  }
}

// Utility to compress and resize image files to keep them light (~50KB or less)
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
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}

// Visual 3D Game Card Box Component
function GameCard({ game, isAdmin, onEdit, onDelete }) {
  const suffix = game.cover_image?.split('#')[1];
  const [detectedLayout, setDetectedLayout] = useState('vertical');

  useEffect(() => {
    if (game.cover_image && !suffix) {
      const cleanUrl = game.cover_image.split('#')[0];
      if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
        setDetectedLayout('vertical');
        return;
      }
      const img = new Image();
      img.src = cleanUrl;
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 1.25) {
          setDetectedLayout('horizontal');
        } else if (ratio < 0.85) {
          setDetectedLayout('vertical');
        } else {
          setDetectedLayout('square');
        }
      };
    }
  }, [game.cover_image, suffix]);

  const layout = suffix || detectedLayout;

  const getMockupClass = () => {
    if (layout === 'horizontal') return 'case-mockup-cardboard game-box-3d-horizontal';
    if (layout === 'square') return 'case-mockup-cd';
    return 'case-mockup-dvd';
  };

  const getAspectRatio = () => {
    if (layout === 'horizontal') return '1.4 / 1';
    if (layout === 'square') return '1 / 1';
    return '1 / 1.4';
  };

  return (
    <div className="group relative flex flex-col transition-all duration-300 cursor-default">
      {/* 3D Cover Wrapper */}
      <div className="game-box-3d-wrap w-full relative">
        {game.cover_image ? (
          layout === 'square' ? (
            /* PS1 CD Jewel Case Mockup using the uploaded transparent PNG */
            <div 
              className="game-box-3d case-mockup-cd overflow-hidden"
              style={{ aspectRatio: "1 / 1" }}
            >
              {/* Mockup Frame PNG background */}
              <img 
                src={ps1CaseImg} 
                alt="CD Jewel Case Frame" 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
              />
              
              {/* Cover Image warped in 3D perspective */}
              <img 
                src={game.cover_image.split('#')[0]} 
                alt={game.title} 
                className="absolute object-fill z-10"
                style={{ 
                  left: "14.26%",
                  top: "2.48%",
                  width: "102.6%",
                  height: "95.14%",
                  transformOrigin: "left center",
                  transform: "perspective(600px) rotateY(21.5deg)"
                }}
              />
              
              <div className="game-box-reflection z-30" />
              
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200 rounded-md z-40">
                  <Button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="bg-ps-blue hover:bg-ps-blue-pressed text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Editar Jogo"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Excluir Jogo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* DVD/Cardboard mockups */
            <div 
              className={`game-box-3d overflow-hidden ${getMockupClass()}`}
              style={{ aspectRatio: getAspectRatio() }}
            >
              <img 
                src={game.cover_image.split('#')[0]} 
                alt={game.title} 
                className="w-full h-full object-fill rounded-md"
              />
              <div className="game-box-reflection" />
              
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200 rounded-md z-10">
                  <Button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="bg-ps-blue hover:bg-ps-blue-pressed text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Editar Jogo"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Excluir Jogo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )
        ) : (
          layout === 'square' ? (
            /* CD Jewel Case fallback when cover image is empty */
            <div 
              className="game-box-3d case-mockup-cd overflow-hidden"
              style={{ aspectRatio: "1 / 1" }}
            >
              <img 
                src={ps1CaseImg} 
                alt="CD Jewel Case Frame" 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
              />
              <div 
                className="absolute bg-white/5 border border-white/10 rounded-md flex flex-col items-center justify-center gap-2 text-white/20 z-10"
                style={{ 
                  left: "14.26%",
                  top: "2.48%",
                  width: "102.6%",
                  height: "95.14%",
                  transformOrigin: "left center",
                  transform: "perspective(600px) rotateY(21.5deg)"
                }}
              >
                <Library className="w-10 h-10" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Sem Capa</span>
              </div>
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200 rounded-md z-40">
                  <Button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="bg-ps-blue hover:bg-ps-blue-pressed text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Editar Jogo"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Excluir Jogo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* General DVD/Cardboard fallback */
            <div 
              className={`game-box-3d bg-white/5 border border-white/10 rounded-md flex flex-col items-center justify-center gap-2 text-white/20 overflow-hidden ${getMockupClass()}`}
              style={{ aspectRatio: getAspectRatio() }}
            >
              <Library className="w-10 h-10" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sem Capa</span>
              
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200 rounded-md z-10">
                  <Button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="bg-ps-blue hover:bg-ps-blue-pressed text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Editar Jogo"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                    title="Excluir Jogo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )
        )}
        <div className="game-box-shadow" />
      </div>

      {/* Game Metadata details */}
      <div className="pt-3 text-center">
        <div>
          <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-ps-blue transition-colors duration-200" title={game.title}>
            {game.title}
          </h3>
          {game.release_year && (
            <p className="text-[9px] text-white/40 font-bold uppercase mt-0.5 font-mono">{game.release_year}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConsideredGames() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);
  const [wikiSearchStatus, setWikiSearchStatus] = useState("");
  const [rawgKey, setRawgKey] = useState(() => localStorage.getItem("rawg_api_key") || "");
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Add Game Form State
  const [searchGameName, setSearchGameName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualCover, setManualCover] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [layoutOption, setLayoutOption] = useState("auto");
  const [isUploadingAdd, setIsUploadingAdd] = useState(false);

  // Edit Game Form State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editCover, setEditCover] = useState("");
  const [editLayoutOption, setEditLayoutOption] = useState("auto");
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  // Batch Form State
  const [activeAddTab, setActiveAddTab] = useState("single"); // "single" or "batch"
  const [batchText, setBatchText] = useState("");
  const [shouldSearchRawg, setShouldSearchRawg] = useState(() => {
    const activeKey = localStorage.getItem("rawg_api_key") || import.meta.env.VITE_RAWG_API_KEY || "";
    return !!activeKey.trim();
  });
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, logs: [] });

  const queryClient = useQueryClient();

  // Load current user
  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch games
  const { data: games = [], isLoading, error: queryError } = useQuery({
    queryKey: ["consideredGames"],
    queryFn: async () => {
      try {
        const list = await db.entities.ConsideredGame.list();
        // If we get an error or empty return due to missing table, this is handled in catch block
        if (!list || list.length === 0) {
          // Double check if table throws error
          const test = await db.entities.ConsideredGame.filter().catch(e => { throw e; });
        }
        setIsUsingFallback(false);
        return list || [];
      } catch (e) {
        console.warn("Supabase table 'considered_games' not found or inaccessible. Falling back to local storage.", e);
        setIsUsingFallback(true);
        const local = localStorage.getItem("__considered_games__");
        if (local) {
          try {
            return JSON.parse(local);
          } catch {
            return INITIAL_FALLBACK_GAMES;
          }
        } else {
          localStorage.setItem("__considered_games__", JSON.stringify(INITIAL_FALLBACK_GAMES));
          return INITIAL_FALLBACK_GAMES;
        }
      }
    }
  });

  // Auto-upgrade RAWG images to Wikipedia covers for the admin (or fallback)
  useEffect(() => {
    if (isLoading || games.length === 0) return;
    
    const gamesToUpgrade = games.filter(g => 
      g.cover_image && g.cover_image.includes("media.rawg.io")
    );
    
    if (gamesToUpgrade.length === 0) return;
    
    const upgradeGames = async () => {
      let updatedAny = false;
      for (const game of gamesToUpgrade) {
        console.log("Auto-upgrading cover for:", game.title);
        const wikiCover = await fetchWikipediaCover(game.title);
        if (wikiCover && wikiCover !== game.cover_image) {
          try {
            if (isUsingFallback) {
              const local = localStorage.getItem("__considered_games__");
              if (local) {
                const list = JSON.parse(local);
                const idx = list.findIndex(g => g.id === game.id);
                if (idx !== -1) {
                  list[idx].cover_image = wikiCover;
                  localStorage.setItem("__considered_games__", JSON.stringify(list));
                  updatedAny = true;
                }
              }
            } else {
              await db.entities.ConsideredGame.update(game.id, { cover_image: wikiCover });
              updatedAny = true;
            }
            console.log("Successfully upgraded cover for:", game.title);
          } catch (e) {
            console.error("Failed to auto-upgrade cover for:", game.title, e);
          }
        }
        // Delay 300ms to respect rate limit
        await new Promise(r => setTimeout(r, 300));
      }
      if (updatedAny) {
        queryClient.invalidateQueries({ queryKey: ["consideredGames"] });
      }
    };
    
    upgradeGames();
  }, [games, isLoading, isUsingFallback, queryClient]);

  const isAdmin = user?.role === "admin";

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (newGame) => {
      if (isUsingFallback) {
        const local = localStorage.getItem("__considered_games__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_GAMES;
        const updatedList = [newGame, ...currentList];
        localStorage.setItem("__considered_games__", JSON.stringify(updatedList));
        return newGame;
      } else {
        return db.entities.ConsideredGame.create(newGame);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consideredGames"] });
      resetForm();
      setShowAdminDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (isUsingFallback) {
        const local = localStorage.getItem("__considered_games__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_GAMES;
        const updatedList = currentList.filter(g => g.id !== id);
        localStorage.setItem("__considered_games__", JSON.stringify(updatedList));
        return { success: true };
      } else {
        return db.entities.ConsideredGame.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consideredGames"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedGame) => {
      if (isUsingFallback) {
        const local = localStorage.getItem("__considered_games__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_GAMES;
        const updatedList = currentList.map(g => g.id === updatedGame.id ? updatedGame : g);
        localStorage.setItem("__considered_games__", JSON.stringify(updatedList));
        return updatedGame;
      } else {
        return db.entities.ConsideredGame.update(updatedGame.id, updatedGame);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consideredGames"] });
      resetEditForm();
      setShowEditDialog(false);
    }
  });

  const handleSaveKey = (val) => {
    setRawgKey(val);
    localStorage.setItem("rawg_api_key", val);
  };

  const handleSearchApi = async () => {
    if (!searchGameName.trim()) return;
    setFormError("");
    setSearchResults([]);
    setSelectedResult(null);

    const activeKey = rawgKey.trim() || import.meta.env.VITE_RAWG_API_KEY || "";
    if (!activeKey) {
      setFormError("É necessária uma Chave de API do RAWG para a busca automática. Insira sua chave ou preencha manualmente abaixo.");
      return;
    }

    setIsSearchingApi(true);
    try {
      const res = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(searchGameName)}&key=${activeKey}`);
      if (!res.ok) {
        throw new Error("Erro na resposta da API.");
      }
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results.slice(0, 5));
      } else {
        setFormError("Nenhum jogo encontrado com esse nome na API.");
      }
    } catch (e) {
      console.error(e);
      setFormError("Falha na comunicação com a API. Verifique sua chave ou tente novamente.");
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleSelectGameResult = async (game) => {
    setSelectedResult(game);
    setManualTitle(game.name);
    setManualYear(game.released ? game.released.substring(0, 4) : "");
    setManualCover(game.background_image || "");

    // Search Wikipedia for a better cover (official box art)
    if (game.name) {
      setIsSearchingWiki(true);
      setWikiSearchStatus("Buscando capa oficial...");
      try {
        const wikiCover = await fetchWikipediaCover(game.name);
        if (wikiCover) {
          setManualCover(wikiCover);
          setWikiSearchStatus("Capa oficial encontrada!");
        } else {
          setWikiSearchStatus("Usando capa do RAWG");
        }
      } catch (e) {
        console.error(e);
        setWikiSearchStatus("Erro ao buscar no Wikipedia");
      } finally {
        setIsSearchingWiki(false);
        setTimeout(() => setWikiSearchStatus(""), 3000);
      }
    }
  };

  const handleAddGame = () => {
    if (!manualTitle.trim()) {
      setFormError("Título do jogo é obrigatório.");
      return;
    }
    const newId = Math.random().toString(36).substring(2, 11);
    
    // Process cover image layout hash suffix
    const cleanCover = manualCover.trim().split('#')[0];
    const finalCover = cleanCover && layoutOption !== 'auto' 
      ? `${cleanCover}#${layoutOption}` 
      : (cleanCover || null);

    const newGame = {
      id: newId,
      title: manualTitle.trim(),
      cover_image: finalCover,
      release_year: manualYear.trim() || null
    };
    addMutation.mutate(newGame);
  };

  const resetForm = () => {
    setSearchGameName("");
    setSearchResults([]);
    setSelectedResult(null);
    setManualTitle("");
    setManualYear("");
    setManualCover("");
    setFormError("");
    setBatchText("");
    setActiveAddTab("single");
    setIsProcessingBatch(false);
    setBatchProgress({ current: 0, total: 0, logs: [] });
    setLayoutOption("auto");
  };

  const handleOpenEditDialog = (game) => {
    setEditingGame(game);
    setEditTitle(game.title || "");
    setEditYear(game.release_year || "");
    
    // Parse layout option from suffix
    const suffix = game.cover_image?.split('#')[1] || "auto";
    const cleanCover = game.cover_image?.split('#')[0] || "";
    setEditCover(cleanCover);
    setEditLayoutOption(suffix);
    setFormError("");
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      setFormError("Título do jogo é obrigatório.");
      return;
    }
    
    const cleanCover = editCover.trim().split('#')[0];
    const finalCover = cleanCover && editLayoutOption !== 'auto'
      ? `${cleanCover}#${editLayoutOption}`
      : (cleanCover || null);

    const updatedGame = {
      ...editingGame,
      title: editTitle.trim(),
      cover_image: finalCover,
      release_year: editYear.trim() || null
    };
    updateMutation.mutate(updatedGame);
  };

  const resetEditForm = () => {
    setEditingGame(null);
    setEditTitle("");
    setEditYear("");
    setEditCover("");
    setEditLayoutOption("auto");
    setFormError("");
  };

  const handleAddFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingAdd(true);
    setFormError("");
    try {
      const uploadRes = await db.integrations.Core.UploadFile({ file }).catch(() => null);
      if (uploadRes?.file_url && !uploadRes.file_url.startsWith("blob:")) {
        setManualCover(uploadRes.file_url);
      } else {
        const compressed = await compressImage(file);
        setManualCover(compressed);
      }
    } catch (err) {
      console.error(err);
      try {
        const compressed = await compressImage(file);
        setManualCover(compressed);
      } catch (innerErr) {
        setFormError("Erro ao processar imagem.");
      }
    } finally {
      setIsUploadingAdd(false);
    }
  };

  const handleEditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingEdit(true);
    setFormError("");
    try {
      const uploadRes = await db.integrations.Core.UploadFile({ file }).catch(() => null);
      if (uploadRes?.file_url && !uploadRes.file_url.startsWith("blob:")) {
        setEditCover(uploadRes.file_url);
      } else {
        const compressed = await compressImage(file);
        setEditCover(compressed);
      }
    } catch (err) {
      console.error(err);
      try {
        const compressed = await compressImage(file);
        setEditCover(compressed);
      } catch (innerErr) {
        setFormError("Erro ao processar imagem.");
      }
    } finally {
      setIsUploadingEdit(false);
    }
  };

  const handleBatchAdd = async () => {
    // Parser de Lote Inteligente
    let gameTitles = [];
    
    // Check if the input has no newlines but contains commas or semicolons
    if (!batchText.includes("\n") && (batchText.includes(",") || batchText.includes(";"))) {
      const separator = batchText.includes(";") ? ";" : ",";
      gameTitles = batchText.split(separator);
    } else {
      gameTitles = batchText.split("\n");
    }

    gameTitles = gameTitles
      .map(item => {
        let cleaned = item.trim();
        // Clean leading list markers like: "- ", "* ", "• ", "1. ", "1 - ", etc.
        cleaned = cleaned.replace(/^[-*•]\s+/, ""); // remove bullet points
        cleaned = cleaned.replace(/^\d+[\s.-]+/, ""); // remove numbers like "1. ", "1 - "
        return cleaned.trim();
      })
      .filter(Boolean);

    if (gameTitles.length === 0) {
      setFormError("Insira pelo menos um nome de jogo.");
      return;
    }
    setFormError("");
    setIsProcessingBatch(true);
    setBatchProgress({ current: 0, total: gameTitles.length, logs: [] });

    const activeKey = rawgKey.trim() || import.meta.env.VITE_RAWG_API_KEY || "";

    // 1. FAST BATCH ADD (No RAWG Search)
    if (!shouldSearchRawg) {
      const newGames = gameTitles.map(title => ({
        id: Math.random().toString(36).substring(2, 11),
        title,
        cover_image: null,
        release_year: null
      }));

      try {
        setBatchProgress(prev => ({
          ...prev,
          current: gameTitles.length,
          logs: gameTitles.map(title => ({
            title,
            status: "success",
            message: "Adicionado instantaneamente à lista"
          }))
        }));

        if (isUsingFallback) {
          const local = localStorage.getItem("__considered_games__");
          const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_GAMES;
          localStorage.setItem("__considered_games__", JSON.stringify([...newGames, ...currentList]));
        } else {
          await db.entities.ConsideredGame.createMany(newGames);
        }
      } catch (err) {
        console.error("Error creating games in batch:", err);
        setFormError(`Erro ao salvar jogos: ${err.message || err}`);
        setBatchProgress(prev => ({
          ...prev,
          logs: gameTitles.map(title => ({
            title,
            status: "error",
            message: `Falha ao salvar: ${err.message || err}`
          }))
        }));
      } finally {
        queryClient.invalidateQueries({ queryKey: ["consideredGames"] });
        setIsProcessingBatch(false);
      }
      return;
    }

    // 2. SEARCH & ADD (With RAWG Search)
    const newGamesToAdd = [];

    for (let i = 0; i < gameTitles.length; i++) {
      const gameTitle = gameTitles[i];
      let cover = null;
      let year = null;
      let success = false;

      // Update log to show we are searching
      setBatchProgress(prev => ({
        ...prev,
        current: i + 1,
        logs: [...prev.logs, { title: gameTitle, status: "searching", message: "Buscando informações online..." }]
      }));

      if (activeKey) {
        try {
          const res = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(gameTitle)}&key=${activeKey}`);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const bestMatch = data.results[0];
              cover = bestMatch.background_image || null;
              year = bestMatch.released ? bestMatch.released.substring(0, 4) : null;
              success = true;
            }
          }
        } catch (e) {
          console.error(`Error searching ${gameTitle}:`, e);
        }
      }

      // Try to fetch official box art from Wikipedia
      try {
        const wikiCover = await fetchWikipediaCover(gameTitle);
        if (wikiCover) {
          cover = wikiCover;
          success = true;
        }
      } catch (e) {
        console.error(`Wikipedia search failed for ${gameTitle}:`, e);
      }

      const newGame = {
        id: Math.random().toString(36).substring(2, 11),
        title: gameTitle,
        cover_image: cover,
        release_year: year
      };

      newGamesToAdd.push(newGame);

      setBatchProgress(prev => {
        const newLogs = [...prev.logs];
        newLogs[newLogs.length - 1] = {
          title: gameTitle,
          status: "success",
          message: success ? `Adicionado com sucesso (${year})` : "Adicionado sem capa (busca falhou/sem chave)"
        };
        return { ...prev, logs: newLogs };
      });

      // Small delay of 200ms to avoid hammering RAWG API
      await new Promise(r => setTimeout(r, 200));
    }

    // Finally, save all gathered games in one single write/query!
    try {
      if (isUsingFallback) {
        const local = localStorage.getItem("__considered_games__");
        const currentList = local ? JSON.parse(local) : INITIAL_FALLBACK_GAMES;
        localStorage.setItem("__considered_games__", JSON.stringify([...newGamesToAdd, ...currentList]));
      } else {
        await db.entities.ConsideredGame.createMany(newGamesToAdd);
      }
    } catch (err) {
      console.error("Error finalizing batch creation:", err);
      setFormError(`Erro ao salvar no banco de dados: ${err.message || err}`);
    }

    queryClient.invalidateQueries({ queryKey: ["consideredGames"] });
    setIsProcessingBatch(false);
  };

  const filteredGames = games.filter(g => 
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.release_year?.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Library className="w-6 h-6 text-ps-blue" />
            Prateleira de Jogos
          </h1>
          <p className="text-white/60 text-sm mt-1">Todos os jogos analisados, jogados ou considerados no Clube Checkpoint</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar na prateleira..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-ps-blue rounded-full h-9"
            />
          </div>

          {isAdmin && (
            <Dialog open={showAdminDialog} onOpenChange={(open) => { setShowAdminDialog(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold text-xs uppercase tracking-wider rounded-full h-9 px-4 border-none shadow-md flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Adicionar Jogo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
                    Adicionar Jogo à Prateleira
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 my-2">
                  {/* Setup RAWG Key */}
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" /> Chave de API RAWG (Opcional)
                      </label>
                      <button 
                        onClick={() => setShowKeyInfo(!showKeyInfo)} 
                        className="text-[10px] text-ps-blue hover:underline"
                        type="button"
                      >
                        Como obter?
                      </button>
                    </div>
                    {showKeyInfo && (
                      <p className="text-[10px] text-white/50 leading-relaxed bg-black/40 p-2 rounded">
                        Cadastre-se gratuitamente em <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer" className="text-ps-blue hover:underline">rawg.io/apidocs <ExternalLink className="w-2.5 h-2.5 inline" /></a> para obter uma chave e buscar capas e anos automaticamente.
                      </p>
                    )}
                    <Input
                      value={rawgKey}
                      onChange={(e) => handleSaveKey(e.target.value)}
                      placeholder="Cole sua chave de API RAWG aqui..."
                      type="password"
                      className="bg-black/20 border-white/10 text-white text-xs h-8 placeholder:text-white/30"
                    />
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => { setActiveAddTab("single"); setFormError(""); }}
                      className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeAddTab === "single" ? "border-ps-blue text-white" : "border-transparent text-white/50 hover:text-white"}`}
                    >
                      Unitário
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveAddTab("batch"); setFormError(""); }}
                      className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeAddTab === "batch" ? "border-ps-blue text-white" : "border-transparent text-white/50 hover:text-white"}`}
                    >
                      Em Lote (Lista)
                    </button>
                  </div>

                  {activeAddTab === "single" ? (
                    <>
                      {/* Auto Search Form */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Busca Automática</label>
                        <div className="flex gap-2">
                          <Input
                            value={searchGameName}
                            onChange={(e) => setSearchGameName(e.target.value)}
                            placeholder="Pesquisar título do jogo online..."
                            className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/40"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchApi()}
                          />
                          <Button 
                            onClick={handleSearchApi} 
                            disabled={isSearchingApi}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-9"
                            type="button"
                          >
                            {isSearchingApi ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Buscar"}
                          </Button>
                        </div>
                      </div>

                      {/* Search Results list */}
                      {searchResults.length > 0 && (
                        <div className="bg-black/30 border border-white/10 rounded-lg overflow-hidden divide-y divide-white/5">
                          {searchResults.map((game) => (
                            <button
                              key={game.id}
                              onClick={() => handleSelectGameResult(game)}
                              className={`w-full flex items-center gap-3 p-2 text-left hover:bg-white/5 transition-colors ${selectedResult?.id === game.id ? "bg-ps-blue/20" : ""}`}
                              type="button"
                            >
                              <div className="w-8 h-10 bg-white/10 rounded overflow-hidden flex-shrink-0">
                                {game.background_image ? (
                                  <img src={game.background_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px]">🎮</div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white leading-tight">{game.name}</p>
                                <p className="text-[10px] text-white/55 mt-0.5">{game.released ? game.released.substring(0, 4) : "Ano desconhecido"}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Manual Fields preview / Entry */}
                      <div className="border-t border-white/5 pt-3 space-y-3">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider block">Confirmar Dados do Jogo</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Título</label>
                            <Input
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              placeholder="Ex: Super Mario"
                              className="bg-white/5 border-white/10 text-white text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Ano</label>
                            <Input
                              value={manualYear}
                              onChange={(e) => setManualYear(e.target.value)}
                              placeholder="Ex: 2017"
                              className="bg-white/5 border-white/10 text-white text-xs h-8"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Proporção da Capa</label>
                            <select
                              value={layoutOption}
                              onChange={(e) => setLayoutOption(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-sm h-8 px-2 text-xs text-white [color-scheme:dark]"
                            >
                              <option value="auto">Automático (Detectar)</option>
                              <option value="vertical">Vertical (PS2)</option>
                              <option value="square">Quadrado (PS1)</option>
                              <option value="horizontal">Horizontal (SNES)</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Upload de Capa (Local)</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleAddFileChange}
                                disabled={isUploadingAdd}
                                className="bg-white/5 border-white/10 text-white text-[10px] h-8 py-0.5 file:bg-white/15 file:border-none file:text-white file:text-[9px] file:font-bold file:uppercase file:px-1.5 file:py-0.5 file:rounded file:cursor-pointer cursor-pointer"
                              />
                              {isUploadingAdd && <RefreshCw className="w-3.5 h-3.5 animate-spin text-ps-blue" />}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Ou URL da Imagem de Capa</label>
                            {manualTitle.trim() && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsSearchingWiki(true);
                                  setWikiSearchStatus("Buscando...");
                                  const wikiCover = await fetchWikipediaCover(manualTitle);
                                  if (wikiCover) {
                                    setManualCover(wikiCover);
                                    setWikiSearchStatus("Encontrada!");
                                  } else {
                                    setWikiSearchStatus("Não encontrada");
                                  }
                                  setIsSearchingWiki(false);
                                  setTimeout(() => setWikiSearchStatus(""), 3000);
                                }}
                                disabled={isSearchingWiki}
                                className="text-[9px] font-bold text-ps-blue hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                {isSearchingWiki ? "Buscando..." : wikiSearchStatus || "Buscar capa (Wikipedia)"}
                              </button>
                            )}
                          </div>
                          <Input
                            value={manualCover}
                            onChange={(e) => setManualCover(e.target.value)}
                            placeholder="https://..."
                            className="bg-white/5 border-white/10 text-white text-xs h-8"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Batch text area */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Inserir Lista de Jogos</label>
                          <span className="text-[10px] text-white/40">Linhas, vírgulas ou tópicos</span>
                        </div>
                        <Textarea
                          value={batchText}
                          onChange={(e) => setBatchText(e.target.value)}
                          placeholder={`Super Mario Odyssey\nAlan Wake 2\n- Grand Theft Auto V\n- Hades, Hollow Knight`}
                          rows={6}
                          disabled={isProcessingBatch}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs font-mono"
                        />
                        <p className="text-[10px] text-white/40 leading-normal">
                          Marcadores de lista (como <code>-</code>, <code>*</code> ou números) e espaços extras serão limpos automaticamente.
                        </p>
                      </div>

                      {/* RAWG Search Toggle Checkbox */}
                      <div className="flex items-center gap-2.5 py-1 select-none">
                        <input
                          type="checkbox"
                          id="search-rawg-checkbox"
                          checked={shouldSearchRawg}
                          onChange={(e) => setShouldSearchRawg(e.target.checked)}
                          disabled={isProcessingBatch}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-ps-blue focus:ring-ps-blue focus:ring-offset-0 focus:ring-1 cursor-pointer accent-ps-blue disabled:opacity-50"
                        />
                        <label 
                          htmlFor="search-rawg-checkbox" 
                          className="text-xs font-bold text-white/70 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          Buscar capas e ano de lançamento automaticamente (RAWG)
                        </label>
                      </div>

                      {/* Progress and logs */}
                      {batchProgress.total > 0 && (
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-white/60 font-bold uppercase text-[10px]">
                            <span>Progresso da Importação</span>
                            <span>{batchProgress.current} / {batchProgress.total}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-ps-blue h-full transition-all duration-300"
                              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                            />
                          </div>
                          {/* Logs list */}
                          <div className="max-h-36 overflow-y-auto space-y-1.5 mt-2 font-mono text-[10px] divide-y divide-white/5 pr-1">
                            {batchProgress.logs.map((log, idx) => (
                              <div key={idx} className="flex justify-between items-start pt-1.5 first:pt-0 gap-2">
                                <span className="text-white font-bold truncate max-w-[200px]">{log.title}</span>
                                {log.status === "searching" && (
                                  <span className="text-ps-blue flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Buscando...</span>
                                )}
                                {log.status === "success" && (
                                  <span className="text-green-400 flex items-center gap-1"><Check className="w-2.5 h-2.5 flex-shrink-0" /> {log.message}</span>
                                )}
                                {log.status === "error" && (
                                  <span className="text-red-400 flex items-center gap-1"><X className="w-2.5 h-2.5 flex-shrink-0" /> {log.message}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {formError && (
                    <div className="text-red-400 text-xs flex items-center gap-1.5 bg-red-500/10 p-2.5 rounded-lg border border-red-500/25">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t border-white/5 pt-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setShowAdminDialog(false); resetForm(); }} 
                    className="text-white hover:bg-white/5"
                    disabled={isProcessingBatch}
                  >
                    {isProcessingBatch ? "Executando..." : "Cancelar"}
                  </Button>
                  {activeAddTab === "single" ? (
                    <Button onClick={handleAddGame} disabled={addMutation.isPending} className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold">
                      Adicionar Jogo
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleBatchAdd} 
                      disabled={isProcessingBatch} 
                      className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold"
                    >
                      {isProcessingBatch ? <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importando...</span> : "Importar Lista"}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Game Dialog (Admin Only) */}
          {isAdmin && (
            <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if(!open) resetEditForm(); }}>
              <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
                    Editar Jogo
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 my-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase">Título</label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Ex: Super Mario"
                        className="bg-white/5 border-white/10 text-white text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase">Ano</label>
                      <Input
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        placeholder="Ex: 2017"
                        className="bg-white/5 border-white/10 text-white text-xs h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase">Proporção da Capa</label>
                      <select
                        value={editLayoutOption}
                        onChange={(e) => setEditLayoutOption(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-sm h-8 px-2 text-xs text-white [color-scheme:dark]"
                      >
                        <option value="auto">Automático (Detectar)</option>
                        <option value="vertical">Vertical (PS2)</option>
                        <option value="square">Quadrado (PS1)</option>
                        <option value="horizontal">Horizontal (SNES)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase">Upload de Capa (Local)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleEditFileChange}
                          disabled={isUploadingEdit}
                          className="bg-white/5 border-white/10 text-white text-[10px] h-8 py-0.5 file:bg-white/15 file:border-none file:text-white file:text-[9px] file:font-bold file:uppercase file:px-1.5 file:py-0.5 file:rounded file:cursor-pointer cursor-pointer"
                        />
                        {isUploadingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin text-ps-blue" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Ou URL da Imagem de Capa</label>
                    <Input
                      value={editCover}
                      onChange={(e) => setEditCover(e.target.value)}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10 text-white text-xs h-8"
                    />
                  </div>

                  {formError && (
                    <div className="text-red-400 text-xs flex items-center gap-1.5 bg-red-500/10 p-2.5 rounded-lg border border-red-500/25">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t border-white/5 pt-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setShowEditDialog(false); resetEditForm(); }} 
                    className="text-white hover:bg-white/5"
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveEdit} 
                    disabled={updateMutation.isPending} 
                    className="bg-ps-blue hover:bg-ps-blue-pressed text-white font-bold"
                  >
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Fallback storage alert notice */}
      {isUsingFallback && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-sm">Banco de dados no Supabase não configurado</p>
              <p className="text-xs text-yellow-400/80 leading-relaxed mt-0.5">
                A tabela <code className="bg-black/30 px-1 py-0.5 rounded font-mono">considered_games</code> não foi criada no Supabase. Os jogos estão sendo armazenados localmente no seu navegador.
              </p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 text-xs font-bold shrink-0 self-start sm:self-center">
                Ver Código SQL
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-xl rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase">Criar tabela no Supabase</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-white/60 leading-relaxed my-2">
                Execute o comando SQL abaixo no console SQL do painel do seu projeto no Supabase para criar a tabela de jogos permanente:
              </p>
              <pre className="bg-black/50 p-4 rounded-lg text-xs font-mono overflow-x-auto text-green-400 border border-white/10 select-all max-h-60">
{`CREATE TABLE public.considered_games (
    id text PRIMARY KEY,
    title text NOT NULL,
    cover_image text,
    release_year text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.considered_games ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow public read access" ON public.considered_games FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.considered_games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.considered_games FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.considered_games FOR DELETE USING (true);`}
              </pre>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Game shelf list view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-ps-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Carregando Prateleira...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-20 bg-ps-dark-card border border-white/10 rounded-xl space-y-2">
          <Library className="w-12 h-12 text-white/20 mx-auto" />
          <p className="text-white/60 font-bold text-lg">Prateleira vazia</p>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            {searchQuery ? "Nenhum jogo encontrado com esse termo de busca." : "Nenhum jogo foi adicionado à lista ainda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-end">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isAdmin={isAdmin}
              onEdit={() => handleOpenEditDialog(game)}
              onDelete={() => {
                if (confirm(`Deseja remover ${game.title} da prateleira?`)) {
                  deleteMutation.mutate(game.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
