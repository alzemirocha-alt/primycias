"use client";
import { useState } from "react";
import { atualizarMeusDadosAction, atualizarRestritoAction, alterarSenhaAction } from "./actions";

export default function PerfilForm({ me, podeAlterarRestrito }) {
  const [dados, setDados] = useState({
    telefone: me.telefone || '',
    endereco: me.endereco || '',
    cep: me.cep || '',
    cpf: me.cpf || '',
    mandato: me.mandato || me.data_vencimento_mandato || '',
  });
  const [senha, setSenha] = useState({ atual: '', nova: '', nova2: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarCEP = async (cep) => {
    const clean = cep.replace(/\D/g,'');
    setDados(d => ({ ...d, cep: clean }));
    if (clean.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`).then(res=>res.json());
        if (!r.erro) {
          setDados(d => ({ ...d, endereco: `${r.logradouro}, ${r.bairro}, ${r.localidade}/${r.uf}` }));
        }
      } catch {}
    }
  };

  const handleDados = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set('telefone', dados.telefone);
    fd.set('endereco', dados.endereco);
    fd.set('cep', dados.cep);
    const res = await atualizarMeusDadosAction(fd);
    setMsg(res.message);
    setLoading(false);
  };

  const handleRestrito = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set('cpf', dados.cpf);
    fd.set('mandato', dados.mandato);
    const res = await atualizarRestritoAction(fd);
    setMsg(res.message);
    setLoading(false);
  };

  const handleSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set('senha_atual', senha.atual);
    fd.set('nova_senha', senha.nova);
    fd.set('nova_senha2', senha.nova2);
    const res = await alterarSenhaAction(fd);
    setMsg(res.message);
    if (res.ok) setSenha({ atual: '', nova: '', nova2: '' });
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* DADOS LIBERADOS */}
      <form onSubmit={handleDados} className="bg-white border border-line rounded-sm p-4 space-y-3">
        <div className="text-sm font-medium text-ink">Alterar meus dados</div>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs">Telefone
            <input value={dados.telefone} onChange={e=>setDados({...dados, telefone:e.target.value})} className="w-full border rounded p-2 mt-1 text-sm" placeholder="(81) 99999-9999" />
          </label>
          <label className="text-xs">CEP
            <input value={dados.cep} onChange={e=>buscarCEP(e.target.value)} className="w-full border rounded p-2 mt-1 text-sm" placeholder="50000000" />
          </label>
        </div>
        
        <label className="text-xs">Endereço
          <input value={dados.endereco} onChange={e=>setDados({...dados, endereco:e.target.value})} className="w-full border rounded p-2 mt-1 text-sm" />
        </label>

        <button disabled={loading} className="bg-[#1E5631] text-white px-4 py-2 rounded text-sm">Salvar Telefone / Endereço / CEP</button>
      </form>

      {/* DADOS RESTRITOS */}
      <form onSubmit={handleRestrito} className="bg-white border border-line rounded-sm p-4 space-y-3">
        <div className="text-sm font-medium text-ink">Mandato e CPF {!podeAlterarRestrito && <span className="text-xs text-gray-400 font-normal">(só Pastor ou Secretário)</span>}</div>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs">CPF
            <input disabled={!podeAlterarRestrito} value={dados.cpf} onChange={e=>setDados({...dados, cpf:e.target.value})} className="w-full border rounded p-2 mt-1 text-sm disabled:bg-gray-100" />
          </label>
          <label className="text-xs">Mandato
            <input disabled={!podeAlterarRestrito} value={dados.mandato} onChange={e=>setDados({...dados, mandato:e.target.value})} className="w-full border rounded p-2 mt-1 text-sm disabled:bg-gray-100" />
          </label>
        </div>

        {podeAlterarRestrito && <button disabled={loading} className="bg-ink text-white px-4 py-2 rounded text-sm">Salvar CPF / Mandato</button>}
      </form>

      {/* TROCA DE SENHA */}
      <form onSubmit={handleSenha} className="bg-white border border-line rounded-sm p-4 space-y-3">
        <div className="text-sm font-medium text-ink">Alterar senha - 4 dígitos</div>
        <div className="text-xs text-gray-500">Confirme com a atual. Não precisa aprovação do Pastor. Mantém histórico.</div>

        <input type="password" maxLength={4} placeholder="Senha atual" value={senha.atual} onChange={e=>setSenha({...senha, atual:e.target.value})} className="w-full border rounded p-2 text-sm" required />
        <div className="grid grid-cols-2 gap-3">
          <input type="password" maxLength={4} placeholder="Nova senha (4 dígitos)" value={senha.nova} onChange={e=>setSenha({...senha, nova:e.target.value})} className="w-full border rounded p-2 text-sm" required />
          <input type="password" maxLength={4} placeholder="Repita nova senha" value={senha.nova2} onChange={e=>setSenha({...senha, nova2:e.target.value})} className="w-full border rounded p-2 text-sm" required />
        </div>

        <button disabled={loading} className="bg-black text-white px-4 py-2 rounded text-sm">Alterar Senha</button>
      </form>

      {msg && <div className="text-sm p-3 bg-paper border rounded">{msg}</div>}
    </div>
  );
}
