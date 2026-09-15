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
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [integrar, setIntegrar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);

  const oficio = (me?.oficio || '').toLowerCase();
  // seu original já libera Pastor e Secretário do Conselho nos mesmos moldes - preservado
  const podePostar = oficio === 'pastor' || me?.funcao === 'secretario_conselho' || (me?.funcao||'').includes('secret');

  // FIX: tipo fixo que faltava e causava o erro NOT NULL
  const tipo = "lideranca";

  async function uploadArquivo(e) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    setLoading(true);
    const res = await fetch("/api/upload-avisos", { method: "POST", body: fd });
    const data = await res.json();
    setArquivoUrl(data.url);
    if (file.type.startsWith("image/")) setImagemUrl(data.url);
    setLoading(false);
  }

  async function salvar() {
    if (!titulo ||!mensagem) return alert("Título e mensagem obrigatórios");
    setLoading(true);
    const dataHora = dataEvento? (horaEvento? `${dataEvento}T${horaEvento}:00` : `${dataEvento}T19:00:00`) : null;
    const method = editando? "PUT" : "POST";
    const body = {
      id: editando,
      tipo, // << AQUI CORRIGIDO - nunca mais null
      titulo,
      mensagem,
      conteudo: mensagem, // compatível com seu avisos-actions.js antigo
      imagem_url: imagemUrl,
      video_url: videoUrl,
      link_url: linkUrl,
      arquivo_url: arquivoUrl,
      link_youtube: videoUrl,
      link_externo: linkUrl,
      data_evento: dataHora,
      integrar_calendario: integrar &&!!dataHora,
      integrar_com_agenda: integrar &&!!dataHora
    };
    const res = await fetch("/api/avisos", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (res.ok) location.reload(); else alert("Erro: " + await res.text());
  }

  async function excluir(id) {
    if (!confirm("Excluir aviso?")) return;
    await fetch(`/api/avisos?id=${id}`, { method: "DELETE" });
    location.reload();
  }

  function iniciarEdicao(a) {
    setEditando(a.id); setTitulo(a.titulo); setMensagem(a.mensagem || a.conteudo);
    setImagemUrl(a.imagem_url || ""); setVideoUrl(a.video_url || a.video_url || "");
    setLinkUrl(a.link_url || a.link_externo || ""); setArquivoUrl(a.arquivo_url || "");
    if (a.data_evento) { const d = new Date(a.data_evento); setDataEvento(d.toISOString().slice(0,10)); setHoraEvento(d.toTimeString().slice(0,5)); }
    window.scrollTo(0,0);
  }

  return (
    <div className="bg-white border border-line rounded-sm p-4 mb-6">
      <div className="text-sm font-medium text-ink mb-3">Avisos da Liderança</div>
      {podePostar && (
        <div className="border border-paperDeep p-3 rounded-sm mb-4 bg-[#faf9f6]">
          {/* name="tipo" exigido - escondido mas enviado */}
          <input type="hidden" name="tipo" value={tipo} />
          <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título" className="w-full border p-2 text-sm mb-2" />
          <textarea value={mensagem} onChange={e=>setMensagem(e.target.value)} placeholder="Texto do aviso..." className="w-full border p-2 text-sm mb-2 h-20" />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input type="date" value={dataEvento} onChange={e=>setDataEvento(e.target.value)} className="border p-2 text-sm" />
            <input type="time" value={horaEvento} onChange={e=>setHoraEvento(e.target.value)} className="border p-2 text-sm" />
          </div>
          <div className="grid gap-2 mb-2">
            <input value={imagemUrl} onChange={e=>setImagemUrl(e.target.value)} placeholder="URL da Imagem (opcional)" className="border p-2 text-sm" />
            <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="Link YouTube (opcional)" className="border p-2 text-sm" />
            <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="Link externo (opcional)" className="border p-2 text-sm" />
            <div className="flex items-center gap-2">
              <label className="text-xs bg-white border px-3 py-2 cursor-pointer">📎 Anexar arquivos<input type="file" hidden onChange={uploadArquivo} /></label>
              {arquivoUrl && <span className="text-xs text-green-700 truncate">{arquivoUrl.split('/').pop()}</span>}
            </div>
          </div>
          <label className="flex gap-2 text-xs mb-3"><input type="checkbox" checked={integrar} onChange={e=>setIntegrar(e.target.checked)} /> Integrar com Agenda</label>
          <div className="flex gap-2">
            <button onClick={salvar} disabled={loading} className="bg-[#0F3A1F] text-white px-4 py-2 text-sm">{loading? "..." : editando? "Salvar Edição" : "Publicar Aviso"}</button>
            {editando && <button onClick={()=>{setEditando(null); setTitulo(""); setMensagem("")}} className="border px-4 py-2 text-sm">Cancelar</button>}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {avisos?.map(a => (
          <div key={a.id} className="border-b pb-3">
            <div className="flex justify-between">
              <span className="font-medium text-sm">{a.titulo} {a.data_evento && <span className="text-xs text-gray-500">- {new Date(a.data_evento).toLocaleString('pt-BR')}</span>}</span>
              {podePostar && <span className="flex gap-2"><button onClick={()=>iniciarEdicao(a)} className="text-xs text-blue-600">Editar</button><button onClick={()=>excluir(a.id)} className="text-xs text-red-600">Excluir</button></span>}
            </div>
            <div className="text-sm whitespace-pre-wrap">{a.mensagem || a.conteudo}</div>
            {a.imagem_url && <img src={a.imagem_url} className="mt-2 max-h-48 border" />}
            {a.arquivo_url && <a href={a.arquivo_url} target="_blank" className="text-xs text-blue-600 underline mt-1 block">📎 Baixar anexo</a>}
            {a.video_url && <a href={a.video_url} target="_blank" className="text-xs text-blue-600 underline block">▶️ Vídeo</a>}
            {a.link_url && <a href={a.link_url} target="_blank" className="text-xs text-blue-600 underline block">🔗 {a.link_url}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
