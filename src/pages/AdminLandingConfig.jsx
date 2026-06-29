import { db } from "@/api/supabaseClient";

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Save, Type, Palette, AlignLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-white" />
        <h2 className="font-black text-white uppercase text-sm tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-white/70 text-xs font-bold uppercase tracking-wide mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function ColorInput({ value, onChange, defaultValue }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || defaultValue}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent"
      />
      <Input
        value={value || defaultValue}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-sm"
      />
    </div>
  );
}

export default function AdminLandingConfig() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState({});

  const { data: configRecords = [] } = useQuery({
    queryKey: ["landingConfig"],
    queryFn: () => db.entities.LandingConfig.list(),
  });
  const config = configRecords[0];

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async (data) => {
      if (config?.id) return db.entities.LandingConfig.update(config.id, data);
      return db.entities.LandingConfig.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landingConfig"] }),
  });

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const setFromInput = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFontUpload = async (e, urlKey, nameKey) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(u => ({ ...u, [urlKey]: true }));
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    const fontName = file.name.replace(/\.[^/.]+$/, "");
    setForm(f => ({ ...f, [urlKey]: file_url, [nameKey]: fontName }));
    setUploading(u => ({ ...u, [urlKey]: false }));
  };

  const handleSave = () => saveConfig.mutate(form);

  // Font face injections for preview
  const fontFaces = [
    form.subtitle_font_url && `@font-face { font-family: 'PrevSubtitle'; src: url('${form.subtitle_font_url}'); }`,
    form.title_font_url && `@font-face { font-family: 'PrevTitle'; src: url('${form.title_font_url}'); }`,
    form.body_font_url && `@font-face { font-family: 'PrevBody'; src: url('${form.body_font_url}'); }`,
  ].filter(Boolean).join("\n");

  const gradientFrom = form.gradient_from || "#0f2566";
  const gradientMid = form.gradient_mid || "#1d4ed8";
  const gradientTo = form.gradient_to || "#3b82f6";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {fontFaces && <style>{fontFaces}</style>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AdminDashboard")} className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black text-white uppercase" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            Visual da Página Inicial
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saveConfig.isPending} className="bg-white text-blue-700 hover:bg-blue-50 font-black">
          <Save className="w-4 h-4 mr-1.5" />
          {saveConfig.isPending ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>

      {/* Live Preview */}
      <div className="rounded-2xl border border-white/15 overflow-hidden">
        <div className="text-xs font-black text-white/40 uppercase tracking-widest px-4 py-2 bg-white/5 border-b border-white/10">Preview ao vivo</div>
        <div
          className="text-center py-10 px-6"
          style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientMid} 60%, ${gradientTo} 100%)` }}
        >
          <p
            className="italic font-light text-white/80"
            style={{
              fontFamily: form.subtitle_font_url ? "'PrevSubtitle', serif" : "'Georgia', serif",
              fontSize: form.subtitle_size || "1.5rem",
            }}
          >
            {form.hero_subtitle || "clube"}
          </p>
          <h1
            className="font-black text-white uppercase mt-1"
            style={{
              fontFamily: form.title_font_url ? "'PrevTitle', sans-serif" : undefined,
              fontSize: form.title_size || "4rem",
              textShadow: "3px 3px 0 rgba(0,0,0,0.3)",
              letterSpacing: "-0.02em",
            }}
          >
            {form.hero_title || "CHECKPOINT"}
          </h1>
          <p
            className="mt-2 font-bold uppercase tracking-widest text-white text-sm"
            style={{ fontFamily: form.body_font_url ? "'PrevBody', sans-serif" : undefined }}
          >
            {form.hero_tagline || 'O CLUBE "DO LIVRO" DE GAMES'}
          </p>
          <p className="mt-3 text-white/70 text-sm max-w-sm mx-auto" style={{ fontFamily: form.body_font_url ? "'PrevBody', sans-serif" : undefined }}>
            {form.hero_description || "Jogue junto, discuta seus games favoritos..."}
          </p>
        </div>
      </div>

      {/* Cores */}
      <Section title="Cores do Fundo (Gradiente)" icon={Palette}>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Cor Inicial">
            <ColorInput value={form.gradient_from} onChange={set("gradient_from")} defaultValue="#0f2566" />
          </Field>
          <Field label="Cor do Meio">
            <ColorInput value={form.gradient_mid} onChange={set("gradient_mid")} defaultValue="#1d4ed8" />
          </Field>
          <Field label="Cor Final">
            <ColorInput value={form.gradient_to} onChange={set("gradient_to")} defaultValue="#3b82f6" />
          </Field>
        </div>
      </Section>

      {/* Fontes */}
      <Section title="Fontes Customizadas" icon={Type}>
        <p className="text-white/50 text-xs">Formatos suportados: .ttf, .otf, .woff, .woff2</p>
        {[
          { label: 'Fonte do "clube" (subtítulo)', urlKey: "subtitle_font_url", nameKey: "subtitle_font_name" },
          { label: 'Fonte do "CHECKPOINT" (título)', urlKey: "title_font_url", nameKey: "title_font_name" },
          { label: "Fonte dos textos gerais", urlKey: "body_font_url", nameKey: "body_font_name" },
        ].map(({ label, urlKey, nameKey }) => (
          <div key={urlKey} className="space-y-2">
            <Label className="text-white/70 text-xs font-bold uppercase tracking-wide">{label}</Label>
            {form[nameKey] && (
              <div className="flex items-center justify-between px-3 py-2 bg-white/10 rounded-lg border border-white/15">
                <span className="text-white text-sm font-semibold">✓ {form[nameKey]}</span>
                <button onClick={() => setForm(f => ({ ...f, [urlKey]: null, [nameKey]: null }))} className="text-white/40 hover:text-red-400 text-xs font-bold transition-colors">
                  Remover
                </button>
              </div>
            )}
            <label className="cursor-pointer block">
              <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={e => handleFontUpload(e, urlKey, nameKey)} className="hidden" />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-dashed border-white/25 hover:bg-white/15 transition-colors text-white font-bold text-sm justify-center">
                <Upload className="w-4 h-4" />
                {uploading[urlKey] ? "Enviando..." : "Upload de fonte"}
              </div>
            </label>
          </div>
        ))}

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <Field label='Tamanho do título "CHECKPOINT"'>
            <Input value={form.title_size || ""} onChange={setFromInput("title_size")} placeholder="ex: 6rem ou 96px" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label='Tamanho do subtítulo "clube"'>
            <Input value={form.subtitle_size || ""} onChange={setFromInput("subtitle_size")} placeholder="ex: 2rem ou 32px" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
        </div>
      </Section>

      {/* Textos */}
      <Section title="Textos da Página" icon={AlignLeft}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label='Subtítulo (ex: "clube")'>
            <Input value={form.hero_subtitle || ""} onChange={setFromInput("hero_subtitle")} placeholder="clube" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label='Título principal (ex: "CHECKPOINT")'>
            <Input value={form.hero_title || ""} onChange={setFromInput("hero_title")} placeholder="CHECKPOINT" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label="Tagline">
            <Input value={form.hero_tagline || ""} onChange={setFromInput("hero_tagline")} placeholder='O CLUBE "DO LIVRO" DE GAMES' className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label="Descrição do hero">
            <Textarea value={form.hero_description || ""} onChange={setFromInput("hero_description")} placeholder="Jogue junto, discuta seus games favoritos..." rows={2} className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none" />
          </Field>
          <Field label='Título seção "Como Funciona"'>
            <Input value={form.features_title || ""} onChange={setFromInput("features_title")} placeholder="Como Funciona" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label="Subtítulo seção features">
            <Input value={form.features_subtitle || ""} onChange={setFromInput("features_subtitle")} placeholder="Entre no clube, participe..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label="Título seção Notícias">
            <Input value={form.news_section_title || ""} onChange={setFromInput("news_section_title")} placeholder="Últimas Notícias" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label="Título do bloco CTA">
            <Input value={form.cta_title || ""} onChange={setFromInput("cta_title")} placeholder="Pronto para Começar?" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
          <Field label="Descrição do bloco CTA">
            <Textarea value={form.cta_description || ""} onChange={setFromInput("cta_description")} placeholder="Crie seu perfil e comece a colecionar..." rows={2} className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none" />
          </Field>
          <Field label="Texto do botão CTA">
            <Input value={form.cta_button_text || ""} onChange={setFromInput("cta_button_text")} placeholder="Começar Agora" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saveConfig.isPending} className="bg-white text-blue-700 hover:bg-blue-50 font-black px-8">
          <Save className="w-4 h-4 mr-1.5" />
          {saveConfig.isPending ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>
    </div>
  );
}