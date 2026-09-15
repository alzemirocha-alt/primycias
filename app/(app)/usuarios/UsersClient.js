"use client";

import { useState, useTransition } from "react";
import { Btn, Field, Input, Select, Tag } from "@/components/ui";
import PhotoPicker from "@/components/PhotoPicker";
import { officeLabel, formatCPF, FUNC_DIACONO, FUNC_PRESBITERO, fmtDate, fmtDateTime } from "@/lib/constants";
import {
  approveUserAction,
  rejectUserAction,
  updateUserAction,
  setPasswordAction,
  decidePasswordResetAction,
  criarUsuarioAction,
} from "./actions";

export default function UsersClient({ me, church, users, resetRequests }) {
  const [editing, setEditing] = useState(null);
  const [showNovo, setShowNovo] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pending = users.filter((u) => u.status === "pendente");
  const active = users.filter((u) => u.status!== "pendente");

  return (
    <div>
      <div className="flex justify-between items-start mb-1">
        <h2 className="text-xl font-serif text-ink mb-1">Usuários</h2>
        <Btn kind="subtle" onClick={() => setShowNovo(true)}>+ Novo usuário</Btn>
      </div>
      <p className="text-xs text-gray-500 mb-5">Aprovação, edição e senhas — Pastor e Secretário do Conselho.</p>

      {resetRequests.length > 0 && (
        <div className="bg-white border rounded-sm p-4 mb-6" style={{ borderColor: "#6E736E" }}>
          <div className="text-sm font-medium text-ink mb-2">Solicitações de nova senha ({resetRequests.length})</div>
          {resetRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-paperDeep text-sm">
              <span>{r.users?.nome} solicitou nova senha</span>
              <div className="flex gap-1.5">
                <Btn kind="subtle" disabled={isPending} onClick={() => startTransition(() => decidePasswordResetAction(r.id, true))}>Liberar</Btn>
                <Btn kind="ghost" disabled={isPending} onClick={() => startTransition(() => decidePasswordResetAction(r.id, false))}>Negar</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-white border border-line rounded-sm p-4 mb-6">
          <div className="text-sm font-medium text-ink mb-2">Aguardando aprovação ({pending.length})</div>
          {pending.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-paperDeep text-sm">
              <div>
                <div className="font-medium">{u.nome}</div>
                <div className="text-xs text-gray-500">CPF: {formatCPF(u.cpf)}</div>
              </div>
              <div className="flex gap-1.5">
                <Btn kind="subtle" disabled={isPending} onClick={() => startTransition(() => approveUserAction(u.id))}>Aprovar</Btn>
                <Btn kind="ghost" disabled={isPending} onClick={() => startTransition(() => rejectUserAction(u.id))}>Recusar</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="text-sm font-medium text-ink mb-2">Corpo de liderança e membros</div>
        {active.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-2 border-b border-paperDeep">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-paperDeep">
              {u.foto && <img src={u.foto} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{u.nome}</div>
              <div className="text-xs text-gray-500 truncate">{officeLabel(u)} · CPF: {formatCPF(u.cpf)}</div>
            </div>
            {church.tesoureiro_user_id === u.id && <Tag tone="gold">Tesoureiro da Igreja</Tag>}
            {u.status === "inativo" && <Tag>Inativo</Tag>}
            <Btn kind="subtle" onClick={() => setEditing(u)}>Editar</Btn>
          </div>
        ))}
      </div>

      {editing && (
        <UserEditor
          u={editing}
          users={users}
          church={church}
          onClose={() => setEditing(null)}
        />
      )}

      {showNovo && (
        <NovoUsuarioEditor
          users={users}
          church={church}
          onClose={() => setShowNovo(false)}
        />
      )}
    </div>
  );
}

// SEU ORIGINAL PRESERVADO
function UserEditor({ u, users, church, onClose }) {
  const [oficio, setOficio] = useState(u.oficio);
  const [funcaoDiacono, setFuncaoDiacono] = useState(u.funcao_diacono || "");
  const [funcaoPresbitero, setFuncaoPresbitero] = useState(u.funcao_presbitero || "");
  const [status, setStatus] = useState(u.status);
  const [isTesoureiro, setIsTesoureiro] = useState(church.tesoureiro_user_id === u.id);
  const [vencimento, setVencimento] = useState(u.data_vencimento_mandato || "");
  const [foto, setFoto] = useState(u.foto || null);
  const [novaSenha, setNovaSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const diaconoTaken = (f) => users.some((x) => x.id!== u.id && x.oficio === "diacono" && x.funcao_diacono === f && x.status === "ativo");
  const presbiteroTaken = (f) => users.some((x) => x.id!== u.id && x.oficio === "presbitero" && x.funcao_presbitero === f && x.status === "ativo");
  const treasurerTaken = church.tesoureiro_user_id && church.tesoureiro_user_id!== u.id;

  const salvar = () => {
    startTransition(async () => {
      await updateUserAction(u.id, {
        oficio,
        funcao_diacono: oficio === "diacono"? funcaoDiacono : null,
        funcao_presbitero: oficio === "presbitero"? funcaoPresbitero : null,
        status,
        data_vencimento_mandato: vencimento || null,
        isTesoureiro,
        foto,
      });
      setMsg("Salvo.");
    });
  };

  const atualizarSenha = () => {
    startTransition(async () => {
      const res = await setPasswordAction(u.id, novaSenha, u.data_nascimento);
      setMsg(res?.error || "Senha atualizada.");
      if (!res?.error) setNovaSenha("");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="max-w-lg w-full bg-paper rounded-sm p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-serif text-ink mb-1">Editar — {u.nome}</h3>
        <div className="text-xs text-gray-500 mb-4">CPF: {formatCPF(u.cpf)}</div>

        <Field label="Foto">
          <PhotoPicker value={foto} onChange={setFoto} />
        </Field>

        <Field label="Ofício">
          <Select value={oficio} onChange={(e) => setOficio(e.target.value)}>
            <option value="pastor">Pastor</option>
            <option value="presbitero">Presbítero</option>
            <option value="diacono">Diácono</option>
            <option value="membro">Membro</option>
          </Select>
        </Field>

        {oficio === "diacono" && (
          <Field label="Função na Junta Diaconal">
            <Select value={funcaoDiacono} onChange={(e) => setFuncaoDiacono(e.target.value)}>
              <option value="">Sem função específica</option>
              {Object.entries(FUNC_DIACONO).map(([k, v]) => (
                <option key={k} value={k} disabled={diaconoTaken(k)}>{v}{diaconoTaken(k)? " (ocupada)" : ""}</option>
              ))}
            </Select>
          </Field>
        )}

        {oficio === "presbitero" && (
          <Field label="Função no Conselho da Igreja">
            <Select value={funcaoPresbitero} onChange={(e) => setFuncaoPresbitero(e.target.value)}>
              <option value="">Sem função específica</option>
              {Object.entries(FUNC_PRESBITERO).map(([k, v]) => (
                <option key={k} value={k} disabled={presbiteroTaken(k)}>{v}{presbiteroTaken(k)? " (ocupada)" : ""}</option>
              ))}
            </Select>
          </Field>
        )}

        {oficio!== "pastor" && (
          <Field label="Tesoureiro da Igreja">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isTesoureiro} disabled={treasurerTaken &&!isTesoureiro} onChange={(e) => setIsTesoureiro(e.target.checked)} />
              É o Tesoureiro da Igreja {treasurerTaken &&!isTesoureiro && <Tag tone="rust">função já ocupada</Tag>}
            </label>
          </Field>
        )}

        <Field label="Vencimento do mandato">
          <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </Field>

        <Field label="Situação do cadastro">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </Select>
        </Field>

        <div className="p-3 mb-3 bg-paperDeep rounded-sm">
          <div className="text-xs text-gray-600 mb-2">Senha — visível/editável apenas por Pastor e Secretário</div>
          <div className="flex gap-2 items-end">
            <Input
              placeholder="Nova senha (4 dígitos)"
              value={novaSenha}
              maxLength={4}
              onChange={(e) => setNovaSenha(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-32"
            />
            <Btn kind="subtle" disabled={isPending || novaSenha.length!== 4} onClick={atualizarSenha}>Atualizar senha</Btn>
          </div>
        </div>

        {msg && <div className="text-xs text-sage mb-3">{msg}</div>}

        <div className="flex gap-2">
          <Btn disabled={isPending} onClick={salvar}>Salvar alterações</Btn>
          <Btn kind="ghost" onClick={onClose}>Fechar</Btn>
        </div>
      </div>
    </div>
  );
}

// NOVO - CRIAÇÃO COM TODOS OS CAMPOS QUE PEDIU
function NovoUsuarioEditor({ users, church, onClose }) {
  const [foto, setFoto] = useState(null);
  const [oficio, setOficio] = useState("membro");
  const [funcaoDiacono, setFuncaoDiacono] = useState("");
  const [funcaoPresbitero, setFuncaoPresbitero] = useState("");
  const [isTesoureiro, setIsTesoureiro] = useState(false);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mandato, setMandato] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const diaconoTaken = (f) => users.some((x) => x.funcao_diacono === f && x.status === "ativo" && f);
  const presbiteroTaken = (f) => users.some((x) => x.funcao_presbitero === f && x.status === "ativo" && f);
  const treasurerTaken =!!church.tesoureiro_user_id;

  const handleCriar = () => {
    if (!nome ||!cpf) { setMsg("Nome e CPF são obrigatórios."); return; }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("nome", nome);
        fd.set("cpf", cpf);
        fd.set("cep", cep);
        fd.set("endereco", endereco);
        fd.set("telefone", telefone);
        fd.set("mandato", mandato);
        fd.set("oficio", oficio);
        fd.set("foto", foto || "");
        // junta funções no padrão que seu actions.js espera
        if (oficio === "diacono") fd.set("funcao_junta", funcaoDiacono);
        if (oficio === "presbitero") fd.set("funcao_conselho", funcaoPresbitero);
        if (isTesoureiro) fd.set("funcao_tesouraria", "tesoureiro_igreja");
        // campo unificado também
        const funcaoFinal = funcaoDiacono || funcaoPresbitero || (isTesoureiro? "tesoureiro_igreja" : "");
        fd.set("funcao", funcaoFinal);

        const res = await criarUsuarioAction(fd);
        setMsg(`Usuário criado! Senha padrão: ${res.senha} (últimos 4 dígitos do CPF)`);
        setTimeout(()=>{ onClose(); location.reload(); }, 1500);
      } catch (e) {
        setMsg(e.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="max-w-2xl w-full bg-paper rounded-sm p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-serif text-ink mb-1">Novo usuário</h3>
        <p className="text-xs text-gray-500 mb-4">Exclusivo Pastor e Secretário. Todos os campos do cadastro. Ofício pode repetir, função só 1 por igreja.</p>

        <Field label="Foto"><PhotoPicker value={foto} onChange={setFoto} /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome completo*"><Input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: João Silva" /></Field>
          <Field label="CPF*"><Input value={cpf} onChange={e=>setCpf(e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="Apenas números" /></Field>
          <Field label="CEP"><Input value={cep} onChange={e=>setCep(e.target.value)} placeholder="50000-000" /></Field>
          <Field label="Telefone"><Input value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(81) 99999-9999" /></Field>
        </div>

        <Field label="Endereço completo"><Input value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Rua, número, bairro" /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ofício*">
            <Select value={oficio} onChange={(e)=>setOficio(e.target.value)}>
              <option value="membro">Membro da igreja</option>
              <option value="diacono">Diácono</option>
              <option value="presbitero">Presbítero</option>
              <option value="pastor">Pastor</option>
            </Select>
          </Field>
          <Field label="Mandato / Vencimento"><Input type="date" value={mandato} onChange={e=>setMandato(e.target.value)} /></Field>
        </div>

        {oficio === "diacono" && (
          <Field label="Função na Junta Diaconal - só 1 por função">
            <Select value={funcaoDiacono} onChange={(e)=>setFuncaoDiacono(e.target.value)}>
              <option value="">Sem função / Membro da Junta (pode repetir)</option>
              {Object.entries(FUNC_DIACONO).map(([k,v])=>(
                <option key={k} value={k} disabled={diaconoTaken(k)}>{v}{diaconoTaken(k)?" (ocupada - retire do outro para liberar)":""}</option>
              ))}
              <option value="membro_junta">Membro da Junta Diaconal</option>
            </Select>
          </Field>
        )}

        {oficio === "presbitero" && (
          <Field label="Função no Conselho - só 1 por função">
            <Select value={funcaoPresbitero} onChange={(e)=>setFuncaoPresbitero(e.target.value)}>
              <option value="">Sem função / Membro do Conselho (pode repetir)</option>
              {Object.entries(FUNC_PRESBITERO).map(([k,v])=>(
                <option key={k} value={k} disabled={presbiteroTaken(k)}>{v}{presbiteroTaken(k)?" (ocupada - retire do outro para liberar)":""}</option>
              ))}
              <option value="membro_conselho">Membro do Conselho</option>
            </Select>
          </Field>
        )}

        <Field label="Tesoureiro da Igreja - só 1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isTesoureiro} disabled={treasurerTaken} onChange={e=>setIsTesoureiro(e.target.checked)} />
            É Tesoureiro da Igreja {treasurerTaken && <Tag tone="rust">já ocupado</Tag>}
          </label>
          {treasurerTaken && <div className="text-[11px] text-gray-500 mt-1">Para cadastrar outro, edite o atual tesoureiro e remova a função para liberar.</div>}
        </Field>

        <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[11px] mb-3">
          Senha padrão será gerada automaticamente com os <b>4 últimos dígitos do CPF</b> (critério já usado no sistema). Ex: CPF 09385980408 → senha 0408
        </div>

        {msg && <div className="text-xs text-ink bg-paperDeep p-2 rounded mb-3">{msg}</div>}

        <div className="flex gap-2">
          <Btn disabled={isPending} onClick={handleCriar}>Criar usuário</Btn>
          <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );
}
