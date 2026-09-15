"use client";
import { useState } from "react";

export default function AvisosBoard({ me, avisos }) {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horaEvento, setHoraEvento] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [integrar, setIntegrar] = useState(true);
  const [loading, setLoading] = useState(false);

  const oficio = (me.oficio || '').toLowerCase();
  const podePostar = oficio === 'pastor' || me.funcao === 'secretario_conselho' || oficio.includes('secret');

  async function salvar() {
    if (!titulo || !mensagem) { alert("Título e mensagem são obrigatórios"); return; }
    setLoading(true);
    
    let dataHora = null;
    if (dataEvento) {
      dataHora = horaEvento ? `${dataEvento}T${horaEvento}:00` : `${dataEvento}T19:00:00`;
    }

    const res = await fetch("/api/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo, mensagem, imagem_url: imagemUrl, video_url: videoUrl, link_url: linkUrl,
        data_evento: dataHora, integrar_calendario: integrar && !!dataHora
      })
    });
    setLoading(false);
    if (res.ok) { location.reload(); } 
    else { const e = await res.text(); alert("Erro ao salvar: " + e); }
  }

  return (
    <div className="bg-white border border-line rounded-sm p-4 mb-6">
      <div className="text-sm font-medium text-ink mb-3">Avisos da Liderança</div>
      
      {podePostar && (
        <div className="border border-paperDeep p-3 rounded-sm mb-4 bg-[#faf9f6]">
          <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título do aviso (ex: Culto de Santa Ceia)" className="w-full border p-2 text-sm mb-2" />
          <textarea value={mensagem} onChange={e=>setMensagem(e.target.value)} placeholder="Escreva o aviso... pode colar link, texto" className="w-full border p-2 text-sm mb-2 h-20" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <input type="date" value={dataEvento} onChange={e=>setDataEvento(e.target.value)} className="border p-2 text-sm" />
            <input type="time" value={horaEvento} onChange={e=>setHoraEvento(e.target.value)} className="border p-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 gap-2 mb-2">
            <input value={imagemUrl} onChange={e=>setImagemUrl(e.target.value)} placeholder="URL da Imagem (opcional)" className="border p-2 text-sm" />
            <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="Link do Vídeo YouTube (opcional)" className="border p-2 text-sm" />
            <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="Link externo (opcional)" className="border p-2 text-sm" />
          </div>

          <label className="flex items-center gap-2 text-xs mb-3">
            <input type="checkbox" checked={integrar} onChange={e=>setIntegrar(e.target.checked)} /> Integrar com Agenda (criar no Calendário com dia e hora)
          </label>
          
          <button onClick={salvar} disabled={loading} className="bg-[#0F3A1F] text-white px-4 py-2 text-sm rounded-sm">
            {loading? "Salvando..." : "Publicar Aviso"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {avisos?.length === 0 && <div className="text-sm text-gray-500">Nenhum aviso ainda.</div>}
        {avisos?.map(a => (
          <div key={a.id} className="border-b border-paperDeep pb-3">
            <div className="font-medium text-sm">{a.titulo} {a.data_evento && <span className="text-xs text-gray-500">- {new Date(a.data_evento).toLocaleString('pt-BR')}</span>}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{a.mensagem}</div>
            {a.imagem_url && <img src={a.imagem_url} className="mt-2 max-h-48 rounded-sm border" />}
            {a.video_url && <a href={a.video_url} target="_blank" className="text-xs text-blue-600 underline block mt-1">▶️ Assistir vídeo</a>}
            {a.link_url && <a href={a.link_url} target="_blank" className="text-xs text-blue-600 underline block mt-1">🔗 {a.link_url}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
