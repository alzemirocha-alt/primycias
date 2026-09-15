"use client";
import { useEffect, useState } from "react";

export default function ComunicacoesHome() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/avisos");
        const json = await res.json();
        const lista = Array.isArray(json)? json : json.data || [];
        setAvisos(lista.slice(0, 3)); // só os 3 últimos no Início
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;
  if (!avisos.length) return null;

  return (
    <div className="bg-white border border-line rounded-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-ink">Comunicações</div>
        <span className="text-[10px] bg-[#0F3A1F] text-white px-2 py-1 rounded-sm">{avisos.length} novo(s)</span>
      </div>
      <div className="space-y-3">
        {avisos.map((a) => (
          <div key={a.id} className="p-3 rounded-sm bg-[#faf9f6] border-l-4 border-[#0F3A1F]">
            <div className="font-medium text-sm text-ink">{a.titulo}</div>
            <div className="text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">{a.mensagem || a.conteudo}</div>
            {a.imagem_url && <img src={a.imagem_url} className="mt-2 max-h-32 border rounded-sm" />}
            <div className="flex gap-2 mt-1">
              {a.arquivo_url && <a href={a.arquivo_url} target="_blank" className="text-xs text-blue-600 underline">📎 Anexo</a>}
              {a.video_url && <a href={a.video_url} target="_blank" className="text-xs text-blue-600 underline">▶️ Vídeo</a>}
              {a.link_url && <a href={a.link_url} target="_blank" className="text-xs text-blue-600 underline">🔗 Link</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
