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
    dotColor: "bg-ps-blue shadow-[0_0_8px_rgba(0,112,209,0.8)]",
    badgeColor: "bg-ps-blue text-white",
    icon: Gamepad2 
  },
  meeting: { 
    label: "Reunião", 
    dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    badgeColor: "bg-emerald-600 text-white",
    icon: CalendarIcon 
  },
  play_together: { 
    label: "Jogar Junto", 
    dotColor: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    badgeColor: "bg-purple-600 text-white",
    icon: Users 
  },
  live: { 
    label: "Live Especial", 
    dotColor: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
    badgeColor: "bg-rose-600 text-white",
    icon: Radio 
  },
  special: { 
    label: "Evento Especial", 
    dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    badgeColor: "bg-amber-600 text-white",
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
  
  // Default selected date to Today's date string
  const defaultSelectedStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [selectedDay, setSelectedDay] = useState(defaultSelectedStr);
  
  // Dialog states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formError, setFormError] = useState("");
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    event_type: "game_period",
    start_date: defaultSelectedStr,
    end_date: defaultSelectedStr,
    time: "18:00",
    description: "",
    location: "",
  });

  // Query events from global Supabase store (syncs across all users & devices)
  const { data: events = [] } = useQuery({
    queryKey: ["clubEvents"],
    queryFn: async () => {
      try {
        const store = await db.entities.ClubLink.get("calendar_events_store");
        if (store && store.description) {
          const parsed = JSON.parse(store.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem("__club_events__", JSON.stringify(parsed));
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Global calendar_events_store fetch failed, using fallback.", e);
      }

      // Check local storage fallback
      const local = localStorage.getItem("__club_events__");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }

      return INITIAL_SAMPLE_EVENTS;
    }
  });

  // Mutations with global Supabase + LocalStorage sync
  const saveMutation = useMutation({
    mutationFn: async (eventData) => {
      let currentEvents = [];
      try {
        const store = await db.entities.ClubLink.get("calendar_events_store");
        if (store && store.description) {
          const parsed = JSON.parse(store.description);
          if (Array.isArray(parsed)) currentEvents = parsed;
        }
      } catch {}

      if (currentEvents.length === 0) {
        currentEvents = [...events];
      }

      if (eventData.id) {
        currentEvents = currentEvents.map(e => e.id === eventData.id ? eventData : e);
      } else {
        const newId = Math.random().toString(36).substring(2, 11);
        const payload = { ...eventData, id: newId };
        currentEvents = [payload, ...currentEvents];
      }

      const storePayload = {
        id: "calendar_events_store",
        title: "__CLUB_CALENDAR_EVENTS__",
        url: "https://clubecheckpoint.com",
        description: JSON.stringify(currentEvents),
        emoji: "📅"
      };

      try {
        await db.entities.ClubLink.update("calendar_events_store", storePayload);
      } catch {
        try {
          await db.entities.ClubLink.create(storePayload);
        } catch (e) {
          console.warn("Error persisting calendar events to Supabase", e);
        }
      }

      localStorage.setItem("__club_events__", JSON.stringify(currentEvents));
      return currentEvents;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubEvents"] });
      setShowEventModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (idToDelete) => {
      let currentEvents = [];
      try {
        const store = await db.entities.ClubLink.get("calendar_events_store");
        if (store && store.description) {
          const parsed = JSON.parse(store.description);
          if (Array.isArray(parsed)) currentEvents = parsed;
        }
      } catch {}

      if (currentEvents.length === 0) {
        currentEvents = [...events];
      }

      currentEvents = currentEvents.filter(e => e.id !== idToDelete);

      const storePayload = {
        id: "calendar_events_store",
        title: "__CLUB_CALENDAR_EVENTS__",
        url: "https://clubecheckpoint.com",
        description: JSON.stringify(currentEvents),
        emoji: "📅"
      };

      try {
        await db.entities.ClubLink.update("calendar_events_store", storePayload);
      } catch {
        try {
          await db.entities.ClubLink.create(storePayload);
        } catch (e) {
          console.warn("Error persisting deleted event to Supabase", e);
        }
      }

      localStorage.setItem("__club_events__", JSON.stringify(currentEvents));
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
    setSelectedDay(defaultSelectedStr);
  };

  const openCreateModal = (dateStr = null) => {
    const defaultDate = dateStr || selectedDay || defaultSelectedStr;
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
    <div className="bg-ps-dark-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 space-y-6 shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ps-blue/20 flex items-center justify-center text-ps-blue border border-ps-blue/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              Calendário do Clube
            </h2>
            <p className="text-xs text-white/50 font-medium hidden sm:block">Grade orgânica minimalista e eventos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => openCreateModal()}
              className="bg-ps-blue hover:bg-ps-blue-pressed text-white text-xs font-black uppercase tracking-wider rounded-full px-4 h-9 border-none shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Evento</span>
            </Button>
          )}
        </div>
      </div>

      {/* Month Navigation Controls */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg font-black text-white uppercase tracking-wide capitalize">
            {monthName}
          </span>
          <Button
            onClick={handleToday}
            variant="outline"
            className="text-[10px] font-bold text-white/80 border-white/20 bg-white/5 hover:bg-white/15 rounded-full px-3 h-6"
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category Dots Legend */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
        {Object.entries(EVENT_TYPES).map(([key, info]) => (
          <div key={key} className="flex items-center gap-1.5 text-white/75 font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${info.dotColor}`} />
            <span>{info.label}</span>
          </div>
        ))}
      </div>

      {/* ULTRA MINIMALIST FRAMELESS CALENDAR GRID */}
      <div className="space-y-3">
        {/* Weekday Labels (No grid borders) */}
        <div className="grid grid-cols-7 text-center">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => (
            <div key={dayName} className="text-[11px] font-extrabold text-white/35 uppercase tracking-wider py-1">
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid (Seamless, Frameless) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {/* Empty padding slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="py-3" />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDateKey(currentYear, currentMonth, dayNum);
            const dayActivities = getDayActivities(dateStr);
            const hasGamePeriod = dayActivities.some(a => a.event_type === "game_period");
            const singleEvents = dayActivities.filter(a => a.event_type !== "game_period");

            const isToday = 
              today.getDate() === dayNum && 
              today.getMonth() === currentMonth && 
              today.getFullYear() === currentYear;

            const isSelected = selectedDay === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(dateStr)}
                className={`py-2 sm:py-3 px-1 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative ${
                  isSelected ? "bg-white/10 shadow-lg scale-105" : "hover:bg-white/5"
                }`}
              >
                {/* Day Number Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isToday
                    ? "bg-ps-blue text-white shadow-md shadow-ps-blue/40 ring-2 ring-ps-blue/60"
                    : isSelected
                    ? "bg-white text-ps-dark font-extrabold shadow-md"
                    : "text-white/80 group-hover:text-white"
                }`}>
                  {dayNum}
                </div>

                {/* Minimalist Organic Indicators (Under Day Number) */}
                <div className="h-3 flex items-center justify-center gap-1 mt-1">
                  {/* Game Period Indicator (Glowing Bar) */}
                  {hasGamePeriod && (
                    <span 
                      className="w-5 h-1.5 rounded-full bg-ps-blue shadow-[0_0_8px_rgba(0,112,209,0.8)]"
                      title="Período de Jogo Ativo"
                    />
                  )}

                  {/* Single Event Dots */}
                  {singleEvents.slice(0, hasGamePeriod ? 1 : 3).map((ev) => {
                    const info = EVENT_TYPES[ev.event_type] || EVENT_TYPES.special;
                    return (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${info.dotColor}`}
                        title={ev.title}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SELECTED DAY ORGANIC AGENDA PANEL (Mobile & Desktop Optimized) --- */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-ps-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {selectedDay ? (
                new Date(parseDateStr(selectedDay)).toLocaleDateString("pt-BR", {
                  weekday: "long", day: "numeric", month: "long"
                })
              ) : "Selecione um dia"}
            </h3>
          </div>

          {isAdmin && selectedDay && (
            <button
              onClick={() => openCreateModal(selectedDay)}
              className="text-xs font-bold text-ps-blue hover:text-ps-blue-pressed flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Evento
            </button>
          )}
        </div>

        {/* Selected Day Activities List */}
        <div className="space-y-3">
          {selectedDayActivities.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-xs italic flex flex-col items-center gap-1.5">
              <Info className="w-6 h-6 opacity-30" />
              <span>Nenhum evento agendado para este dia.</span>
            </div>
          ) : (
            selectedDayActivities.map((act) => {
              const info = EVENT_TYPES[act.event_type] || EVENT_TYPES.special;
              const Icon = info.icon;
              return (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-ps-dark-elevated/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${info.badgeColor} shrink-0 mt-0.5 sm:mt-0 shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${info.badgeColor}`}>
                          {info.label}
                        </span>
                        {act.time && (
                          <span className="text-xs font-bold text-white/60 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-white/40" /> {act.time}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm leading-snug">{act.title}</h4>

                      {act.event_type === "game_period" && (
                        <p className="text-xs text-ps-blue font-semibold">
                          Período: {new Date(parseDateStr(act.start_date)).toLocaleDateString("pt-BR")} até {new Date(parseDateStr(act.end_date)).toLocaleDateString("pt-BR")}
                        </p>
                      )}

                      {act.location && (
                        <p className="text-xs text-white/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-white/40" /> {act.location}
                        </p>
                      )}

                      {act.description && (
                        <p className="text-xs text-white/50 pt-1 leading-relaxed">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => openEditModal(act)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                        title="Editar Evento"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(act.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 transition-all"
                        title="Excluir Evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- ADMIN CREATE / EDIT EVENT MODAL --- */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="bg-ps-dark-elevated border-white/10 text-white max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
              {editingEvent ? "Editar Evento / Período" : "Novo Evento / Período"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div className="space-y-3 my-2">
            <div>
              <Label className="text-xs font-bold text-white/80 uppercase">Tipo de Evento *</Label>
              <select
                value={form.event_type}
                onChange={(e) => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold [color-scheme:dark]"
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
                className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-xl placeholder:text-white/30"
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
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs [color-scheme:dark]"
                />
              </div>

              {form.event_type === "game_period" ? (
                <div>
                  <Label className="text-xs font-bold text-white/80 uppercase">Data Final *</Label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs [color-scheme:dark]"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-bold text-white/80 uppercase">Horário (opcional)</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                    className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-xl [color-scheme:dark]"
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
                className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-xl placeholder:text-white/30"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-white/80 uppercase">Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes ou regras do encontro/evento..."
                rows={3}
                className="mt-1 bg-white/5 border-white/15 text-white text-xs rounded-xl placeholder:text-white/30 resize-none"
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
