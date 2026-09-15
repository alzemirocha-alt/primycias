"use client";
import { useState } from "react";
import { criarUsuarioAction } from "./actions";

export default function NovoUsuarioModal({ podeCriar }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState(null);

  if (!podeCriar) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    try {
      const res = await criarUsuarioAction(fd);
      setSenhaGerada(res.senha);
      alert(`Usuário criado! Senha padrão de 4 dígitos: ${res.senha}`);
      setOpen(false);
      e.target.reset();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} className="bg-[#1E5631] text-white px-4 py-2 rounded-sm text-sm mb-4">
        + Novo usuário
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <form onSubmit={onSubmit} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-2xl rounded-sm p-5 max-h-[90vh] overflow-auto space-y-3">
            <h3 className="font-serif text-lg">Novo usuário - todos os campos do cadastro</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs col-span-2">Foto (URL ou upload depois)<input name="foto_url" placeholder="https://..." className="w-full border rounded p-2 mt-1 text-sm" /></label>
              <label className="text-xs col-span-2">Nome completo<input name="nome" required className="w-full border rounded p-2 mt-1 text-sm" /></label>
              <label className="text-xs">CPF<input name="cpf" required placeholder="000.000.000-00" className="w-full border rounded p-2 mt-1 text-sm" /></label>
              <label className="text-xs">Telefone<input name="telefone" required className="w-full border rounded p-2 mt-1 text-sm" /></label>
              <label className="text-xs">CEP<input name="cep" className="w-full border rounded p-2 mt-1 text-sm" /></label>
              <label className="text-xs">Mandato<input name="mandato" placeholder="2024-2028" className="w-full border rounded p-2 mt-1 text-sm" /></label>
              <label className="text-xs col-span-2">Endereço<input name="endereco" required className="w-full border rounded p-2 mt-1 text-sm" /></label>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <label className="text-xs">Ofício (pode repetir)
                <select name="oficio" required className="w-full border rounded p-2 mt-1 text-sm">
                  <option value="">Selecione</option>
                  <option value="diacono">Diácono</option>
                  <option value="presbitero">Presbítero</option>
                  <option value="pastor">Pastor</option>
                  <option value="membro">Membro da igreja</option>
                </select>
              </label>

              <label className="text-xs">Função no Conselho
                <select name="funcao_conselho" className="w-full border rounded p-2 mt-1 text-sm">
                  <option value="">Nenhuma / Membro</option>
                  <option value="presidente_conselho">Presidente do Conselho</option>
                  <option value="vice_presidente_conselho">Vice-presidente do Conselho</option>
                  <option value="secretario_conselho">Secretário do Conselho</option>
                  <option value="membro_conselho">Membro do Conselho</option>
                </select>
              </label>

              <label className="text-xs">Função na Junta Diaconal
                <select name="funcao_junta" className="w-full border rounded p-2 mt-1 text-sm">
                  <option value="">Nenhuma / Membro</option>
                  <option value="presidente_junta_diagonal">Presidente</option>
                  <option value="vice_presidente_junta_diagonal">Vice-presidente</option>
                  <option value="secretario_junta_diagonal">Secretário</option>
                  <option value="tesoureiro_junta_diagonal">Tesoureiro da Junta</option>
                  <option value="membro_junta">Membro da Junta</option>
                </select>
              </label>

              <label className="text-xs">Tesouraria
                <select name="funcao_tesouraria" className="w-full border rounded p-2 mt-1 text-sm">
                  <option value="">Nenhuma</option>
                  <option value="tesoureiro_igreja">Tesoureiro da Igreja</option>
                </select>
              </label>
            </div>

            {/* campo hidden que junta as 3 funções em uma só para o banco */}
            <input type="hidden" name="funcao" id="funcao_final" />

            <p className="text-[11px] text-gray-500">Regra: Ofício pode ter várias pessoas. Função de diretoria (presidente, vice, secretário, tesoureiro) só pode ter 1 por igreja. Se tentar cadastrar função já ocupada, o sistema bloqueia e mostra quem ocupa. Para liberar, o Pastor/Secretário deve editar o usuário atual e remover a função.</p>

            <div className="flex gap-2 pt-2">
              <button disabled={loading} onClick={()=>{
                // junta a função escolhida com maior prioridade: conselho > junta > tesoureiro
                const f = document.querySelector('[name=funcao_conselho]').value || document.querySelector('[name=funcao_junta]').value || document.querySelector('[name=funcao_tesouraria]').value || '';
                document.getElementById('funcao_final').value = f;
              }} className="bg-[#1E5631] text-white px-4 py-2 rounded text-sm flex-1">{loading?'Salvando...':'Criar usuário - senha será os 4 últimos dígitos do CPF'}</button>
              <button type="button" onClick={()=>setOpen(false)} className="border px-4 py-2 rounded text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
