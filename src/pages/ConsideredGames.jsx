import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { Search, Plus, Trash2, Library, Key, ExternalLink, RefreshCw, AlertCircle, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// Default placeholder games in case the database table doesn't exist yet
const INITIAL_FALLBACK_GAMES = [
  {
    id: "mario-odyssey",
    title: "Super Mario Odyssey",
    cover_image: "https://media.rawg.io/media/games/7a2/7a211ae2e2c5e1112724c326d24f07b8.jpg",
    release_year: "2017"
  },
  {
    id: "zelda-oot",
    title: "The Legend of Zelda: Ocarina of Time",
    cover_image: "https://media.rawg.io/media/games/fd6/fd6a1e58f1e041796120e2ef58ad7b46.jpg",
    release_year: "1998"
  },
  {
    id: "alan-wake-remastered",
    title: "Alan Wake Remastered",
    cover_image: "https://media.rawg.io/media/games/5cf/5cf7b583d5836a94f6f70d98ca57c6b9.jpg",
    release_year: "2021"
  },
  {
    id: "portal-2",
    title: "Portal 2",
    cover_image: "https://media.rawg.io/media/games/328/32836170ad2f4109138b8a5192ddb452.jpg",
    release_year: "2011"
  },
  {
    id: "gta-v",
    title: "Grand Theft Auto V",
    cover_image: "https://media.rawg.io/media/games/456/456fc5a1178a2fd9e11c8555584e3895.jpg",
    release_year: "2013"
  }
];

export default function ConsideredGames() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSelectGameResult = (game) => {
    setSelectedResult(game);
    setManualTitle(game.name);
    setManualYear(game.released ? game.released.substring(0, 4) : "");
    setManualCover(game.background_image || "");
  };

  const handleAddGame = () => {
    if (!manualTitle.trim()) {
      setFormError("Título do jogo é obrigatório.");
      return;
    }
    const newId = Math.random().toString(36).substring(2, 11);
    const newGame = {
      id: newId,
      title: manualTitle.trim(),
      cover_image: manualCover.trim() || null,
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
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase">URL da Imagem de Capa</label>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredGames.map((game) => (
            <div 
              key={game.id} 
              className="group relative flex flex-col rounded-xl overflow-hidden bg-ps-dark-card border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-default"
            >
              {/* Cover container */}
              <div className="aspect-[2/3] w-full bg-white/5 relative overflow-hidden flex items-center justify-center border-b border-white/5 flex-shrink-0">
                {game.cover_image ? (
                  <img 
                    src={game.cover_image} 
                    alt={game.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/20">
                    <Library className="w-10 h-10" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sem Capa</span>
                  </div>
                )}

                {/* Dark overlay with delete option in admin mode */}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <Button
                      onClick={() => {
                        if (confirm(`Deseja remover ${game.title} da prateleira?`)) {
                          deleteMutation.mutate(game.id);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full h-9 w-9 flex items-center justify-center border-none shadow-md"
                      title="Excluir Jogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Game Metadata details */}
              <div className="p-3 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-ps-blue transition-colors duration-200" title={game.title}>
                    {game.title}
                  </h3>
                  {game.release_year && (
                    <p className="text-[10px] text-white/50 font-bold uppercase mt-1 font-mono">{game.release_year}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
