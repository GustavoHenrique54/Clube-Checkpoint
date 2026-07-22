import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, 
  Gamepad2, Users, Radio, Star, Clock, MapPin, Pencil, Trash2, X, Check, Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EVENT_TYPES = {
  game_period: { 
    label: "Período de Jogo", 
    color: "bg-ps-blue text-white border-ps-blue/40", 
    badgeColor: "bg-ps-blue", 
    dayBg: "bg-ps-blue/20 border-ps-blue/50",
    icon: Gamepad2 
  },
  meeting: { 
    label: "Reunião", 
    color: "bg-emerald-600 text-white border-emerald-500/40", 
    badgeColor: "bg-emerald-600", 
    dayBg: "bg-emerald-950/35 border-emerald-500/40",
    icon: CalendarIcon 
  },
  play_together: { 
    label: "Jogar Junto", 
    color: "bg-purple-600 text-white border-purple-500/40", 
    badgeColor: "bg-purple-600", 
    dayBg: "bg-purple-950/35 border-purple-500/40",
    icon: Users 
  },
  live: { 
    label: "Live Especial", 
    color: "bg-rose-600 text-white border-rose-500/40", 
    badgeColor: "bg-rose-600", 
    dayBg: "bg-rose-950/35 border-rose-500/40",
    icon: Radio 
  },
  special: { 
    label: "Evento Especial", 
    color: "bg-amber-600 text-white border-amber-500/40", 
    badgeColor: "bg-amber-600", 
    dayBg: "bg-amber-950/35 border-amber-500/40",
    icon: Star 
  },
};

const INITIAL_SAMPLE_EVENTS = [
  {
    id: "sample-1",
    title: "Castlevania: Symphony of the Night",
    event_type: "game_period",
    start_date: "2026-07-15",
    end_date: "2026-08-10",
    description: "Período oficial de gameplay do clássico de PS1 no Clube Checkpoint!",
    location: "Canal do Clube",
    color: "#0070d1"
  },
  {
    id: "sample-2",
    title: "Reunião de Alinhamento: Castlevania",
    event_type: "meeting",
    start_date: "2026-07-25",
    end_date: "2026-07-25",
    time: "18:00",
    description: "Discussão das primeiras impressões e exploração do castelo.",
    location: "Discord #voice-1",
    color: "#10b981"
  }
];

function formatDateKey(year, month, day) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseDateStr(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length < 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function isDateInRange(targetDateStr, startDateStr, endDateStr) {
  if (!targetDateStr || !startDateStr) return false;
  const target = parseDateStr(targetDateStr);
  const start = parseDateStr(startDateStr);
  const end = parseDateStr(endDateStr || startDateStr);
  if (!target || !start || !end) return false;

  target.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return target >= start && target <= end;
}

export default function ClubCalendar({ isAdmin = false }) {
  const queryClient = useQueryClient();
  const today = new Date();
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Dialog states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formError, setFormError] = useState("");
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    event_type: "game_period",
    start_date: formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
    end_date: formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
    time: "18:00",
    description: "",
    location: "",
  });

  // Query events with robust local fallback
  const { data: events = [] } = useQuery({
    queryKey: ["clubEvents"],
    queryFn: async () => {
      let list = null;
      try {
        list = await db.entities.ClubEvent.list("-start_date");
      } catch (e) {
        console.warn("Table 'club_events' error, using fallback local storage.", e);
      }
      if (!list || list.length === 0) {
        const local = localStorage.getItem("__club_events__");
        if (local) {
          try { return JSON.parse(local); } catch { return INITIAL_SAMPLE_EVENTS; }
        }
        localStorage.setItem("__club_events__", JSON.stringify(INITIAL_SAMPLE_EVENTS));
        return INITIAL_SAMPLE_EVENTS;
      }
      return list;
    }
  });

  // Mutations with dual Supabase + LocalStorage sync
  const saveMutation = useMutation({
    mutationFn: async (eventData) => {
      const local = localStorage.getItem("__club_events__");
      let currentList = local ? JSON.parse(local) : INITIAL_SAMPLE_EVENTS;

      let savedItem = null;
      if (eventData.id) {
        // Edit
        try {
          savedItem = await db.entities.ClubEvent.update(eventData.id, eventData);
        } catch (e) {
          console.warn("Supabase update failed, saving to localStorage.", e);
        }
        const updatedList = currentList.map(e => e.id === eventData.id ? eventData : e);
        localStorage.setItem("__club_events__", JSON.stringify(updatedList));
        return savedItem || eventData;
      } else {
        // Create
        const newId = Math.random().toString(36).substring(2, 11);
        const payload = { ...eventData, id: newId };
        try {
          savedItem = await db.entities.ClubEvent.create(payload);
        } catch (e) {
          console.warn("Supabase create failed, saving to localStorage.", e);
        }
        const updatedList = [payload, ...currentList];
        localStorage.setItem("__club_events__", JSON.stringify(updatedList));
        return savedItem || payload;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubEvents"] });
      setShowEventModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await db.entities.ClubEvent.delete(id);
      } catch (e) {
        console.warn("Supabase delete failed, updating localStorage.", e);
      }
      const local = localStorage.getItem("__club_events__");
      const currentList = local ? JSON.parse(local) : INITIAL_SAMPLE_EVENTS;
      const updatedList = currentList.filter(e => e.id !== id);
      localStorage.setItem("__club_events__", JSON.stringify(updatedList));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubEvents"] });
    }
  });

  // Calendar month/year calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const openCreateModal = (dateStr = null) => {
    const defaultDate = dateStr || formatDateKey(currentYear, currentMonth, today.getDate());
    setEditingEvent(null);
    setForm({
      title: "",
      event_type: "game_period",
      start_date: defaultDate,
      end_date: defaultDate,
      time: "18:00",
      description: "",
      location: "",
    });
    setFormError("");
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || "",
      event_type: event.event_type || "game_period",
      start_date: event.start_date || "",
      end_date: event.end_date || event.start_date || "",
      time: event.time || "18:00",
      description: event.description || "",
      location: event.location || "",
    });
    setFormError("");
    setShowEventModal(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormError("");
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setFormError("O título do evento/período é obrigatório.");
      return;
    }
    if (!form.start_date) {
      setFormError("A data inicial é obrigatória.");
      return;
    }

    const payload = {
      ...(editingEvent ? { id: editingEvent.id } : {}),
      title: form.title.trim(),
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.event_type === "game_period" ? (form.end_date || form.start_date) : form.start_date,
      time: form.time || null,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
    };

    saveMutation.mutate(payload);
  };

  // Get events & game periods for a specific day
  const getDayActivities = (dateStr) => {
    return events.filter(e => isDateInRange(dateStr, e.start_date, e.end_date));
  };

  const selectedDayActivities = selectedDay ? getDayActivities(selectedDay) : [];

  return (
    <div className="bg-ps-dark-card border border-white/10 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ps-blue/20 flex items-center justify-center text-ps-blue border border-ps-blue/30 shadow-inner">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              Calendário do Clube
            </h2>
            <p className="text-xs text-white/55">Períodos de jogo, encontros e eventos especiais</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => openCreateModal()}
              className="bg-ps-blue hover:bg-ps-blue-pressed text-white text-xs font-bold uppercase tracking-wider rounded-full px-4 h-9 border-none shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo Evento / Período
            </Button>
          )}
        </div>
      </div>

      {/* Month Navigation & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-ps-dark-elevated p-3 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white uppercase tracking-wider min-w-[140px] text-center capitalize">
            {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <Button
            onClick={handleToday}
            variant="outline"
            className="text-[11px] font-bold text-white/80 border-white/20 bg-transparent hover:bg-white/10 rounded-full px-3 h-7 ml-2"
          >
            Hoje
          </Button>
        </div>

        {/* Category Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          {Object.entries(EVENT_TYPES).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <div key={key} className="flex items-center gap-1 text-white/80 font-medium">
                <span className={`w-2.5 h-2.5 rounded-full ${info.badgeColor} shadow-sm`} />
                <span>{info.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center border-b border-white/5 pb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => (
          <div key={dayName} className="text-xs font-bold text-white/40 uppercase tracking-wider">
            {dayName}
          </div>
        ))}
      </div>

      {/* 7-Column Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Empty padding slots */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div 
            key={`empty-${i}`} 
            className="h-24 sm:h-28 bg-white/[0.01] rounded-xl border border-transparent" 
          />
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = formatDateKey(currentYear, currentMonth, dayNum);
          const dayActivities = getDayActivities(dateStr);
          const activeGamePeriod = dayActivities.find(a => a.event_type === "game_period");
          const singleEvents = dayActivities.filter(a => a.event_type !== "game_period");

          const isToday = 
            today.getDate() === dayNum && 
            today.getMonth() === currentMonth && 
            today.getFullYear() === currentYear;

          // Determine overall day cell styling based on events
          let cellStyle = "bg-ps-dark-elevated/70 border-white/5 hover:border-white/20 hover:bg-white/5";
          if (isToday) {
            cellStyle = "bg-ps-blue/15 border-ps-blue shadow-[0_0_12px_rgba(0,112,209,0.3)] ring-1 ring-ps-blue/40";
          } else if (activeGamePeriod) {
            cellStyle = EVENT_TYPES.game_period.dayBg + " shadow-sm";
          } else if (singleEvents.length > 0) {
            const primaryType = singleEvents[0].event_type;
            cellStyle = (EVENT_TYPES[primaryType]?.dayBg || "bg-white/10 border-white/20") + " shadow-sm";
          }

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDay(dateStr)}
              className={`h-24 sm:h-28 p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between group hover:scale-[1.02] hover:z-10 shadow-md ${cellStyle}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                  isToday ? "bg-ps-blue text-white shadow-md font-black" : "text-white/80"
                }`}>
                  {dayNum}
                </span>

                {dayActivities.length > 0 && (
                  <span className="text-[9px] font-extrabold text-white/70 bg-black/40 px-1.5 py-0.5 rounded-full border border-white/10">
                    {dayActivities.length}
                  </span>
                )}
              </div>

              {/* Inside Day Items (Strictly inside day square) */}
              <div className="space-y-1 my-auto overflow-hidden">
                {/* Active Game Period Badge (inside square) */}
                {activeGamePeriod && (
                  <div 
                    className="bg-ps-blue text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-1 rounded-md truncate flex items-center gap-1 shadow-sm leading-none"
                    title={`Jogo Ativo: ${activeGamePeriod.title}`}
                  >
                    <Gamepad2 className="w-3 h-3 shrink-0 text-white" />
                    <span className="truncate">{activeGamePeriod.title}</span>
                  </div>
                )}

                {/* Single Day Events (Reuniões, Lives, Jogar Junto, etc.) */}
                {singleEvents.slice(0, activeGamePeriod ? 1 : 2).map((ev) => {
                  const info = EVENT_TYPES[ev.event_type] || EVENT_TYPES.special;
                  const Icon = info.icon;
                  return (
                    <div 
                      key={ev.id} 
                      className={`${info.badgeColor} text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold truncate flex items-center gap-1 shadow-sm leading-none`}
                      title={`${ev.time ? ev.time + ' - ' : ''}${ev.title}`}
                    >
                      <Icon className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{ev.time ? `${ev.time} ` : ""}{ev.title}</span>
                    </div>
                  );
                })}

                {/* Overflow indicator */}
                {singleEvents.length > (activeGamePeriod ? 1 : 2) && (
                  <span className="text-[8px] font-extrabold text-white/60 block px-1">
                    +{singleEvents.length - (activeGamePeriod ? 1 : 2)} eventos
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DAY DETAILS MODAL --- */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-ps-blue" />
              {selectedDay && new Date(parseDateStr(selectedDay)).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 my-2 max-h-[60vh] overflow-y-auto pr-1">
            {selectedDayActivities.length === 0 ? (
              <div className="text-center py-8 text-white/40 italic">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhum evento ou período agendado para este dia.
              </div>
            ) : (
              selectedDayActivities.map((act) => {
                const info = EVENT_TYPES[act.event_type] || EVENT_TYPES.special;
                const Icon = info.icon;
                return (
                  <div 
                    key={act.id} 
                    className="p-4 rounded-lg bg-ps-dark-card border border-white/10 space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-md ${info.badgeColor} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${info.color}`}>
                            {info.label}
                          </span>
                          <h3 className="font-bold text-white text-sm mt-1 leading-snug">{act.title}</h3>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => { setSelectedDay(null); openEditModal(act); }}
                            className="p-1 rounded bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                            title="Editar Evento"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteMutation.mutate(act.id)}
                            className="p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 transition-all"
                            title="Excluir Evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {act.event_type === "game_period" ? (
                      <p className="text-xs text-ps-blue font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-ps-blue" />
                        Período: {new Date(parseDateStr(act.start_date)).toLocaleDateString("pt-BR")} até {new Date(parseDateStr(act.end_date)).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      act.time && (
                        <p className="text-xs text-white/70 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-white/40" /> Horário: {act.time}
                        </p>
                      )
                    )}

                    {act.location && (
                      <p className="text-xs text-white/70 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-white/40" /> {act.location}
                      </p>
                    )}

                    {act.description && (
                      <p className="text-xs text-white/60 leading-relaxed bg-white/5 p-2.5 rounded-md mt-2">
                        {act.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {isAdmin ? (
              <Button
                onClick={() => { const day = selectedDay; setSelectedDay(null); openCreateModal(day); }}
                className="bg-ps-blue hover:bg-ps-blue-pressed text-white text-xs font-bold uppercase rounded-full px-4 h-9 border-none shadow-md"
              >
                + Adicionar neste dia
              </Button>
            ) : <div />}
            <Button
              variant="outline"
              onClick={() => setSelectedDay(null)}
              className="border-white/20 text-white bg-transparent rounded-full px-4 h-9 text-xs font-bold"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ADMIN CREATE / EDIT EVENT MODAL --- */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
              {editingEvent ? "Editar Evento / Período" : "Novo Evento / Período"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div className="space-y-3 my-2">
            <div>
              <Label className="text-xs font-bold text-white/80 uppercase">Tipo de Evento *</Label>
              <select
                value={form.event_type}
                onChange={(e) => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-bold [color-scheme:dark]"
              >
                {Object.entries(EVENT_TYPES).map(([key, info]) => (
                  <option key={key} value={key} className="bg-ps-dark-elevated text-white">
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-white/80 uppercase">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={form.event_type === "game_period" ? "Ex: Castlevania SotN" : "Ex: Reunião do Clube"}
                className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-lg placeholder:text-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-white/80 uppercase">
                  {form.event_type === "game_period" ? "Data Inicial *" : "Data *"}
                </Label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs [color-scheme:dark]"
                />
              </div>

              {form.event_type === "game_period" ? (
                <div>
                  <Label className="text-xs font-bold text-white/80 uppercase">Data Final *</Label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs [color-scheme:dark]"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-bold text-white/80 uppercase">Horário (opcional)</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                    className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-lg [color-scheme:dark]"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold text-white/80 uppercase">Local / Plataforma (opcional)</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Ex: Discord, Twitch, PSN, Steam..."
                className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-lg placeholder:text-white/30"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-white/80 uppercase">Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes ou regras do encontro/evento..."
                rows={3}
                className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-lg placeholder:text-white/30 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEventModal(false)}
              className="border-white/20 text-white bg-transparent rounded-full px-4 text-xs font-bold h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="bg-ps-blue hover:bg-ps-blue-pressed text-white text-xs font-bold uppercase rounded-full px-6 h-9 border-none shadow-md"
            >
              <Check className="w-4 h-4 mr-1" /> {editingEvent ? "Salvar Alterações" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
