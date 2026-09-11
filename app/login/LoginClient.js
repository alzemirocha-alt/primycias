"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  loginAction,
  registerAction,
  forgotPasswordAction,
  criarIgrejaAction,
  devLoginAction,
} from "./actions";
import { Btn, Field, Input, Select } from "@/components/ui";
import PhotoPicker from "@/components/PhotoPicker";
import CEPLookup from "@/components/CEPLookup";
import DocPicker from "@/components/DocPicker";

function SubmitButton({ children, kind = "primary", className = "", disabled }) {
  const { pending } = useFormStatus();
  return (
    <Btn type="submit" kind={kind} disabled={pending || disabled} className={className}>
      {pending ? "Enviando…" : children}
    </Btn>
  );
}

function Card({ children }) {
  return <div className="bg-white border border-line rounded-sm p-6">{children}</div>;
}

export default function LoginClient({ igrejas }) {
  const [tab, setTab] = useState("igreja"); // igreja | desenvolvedor

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-11 h-11 flex items-center justify-center bg-ink rounded">
            <span className="text-white font-serif text-lg">P</span>
          </div>
          <div>
            <div className="text-sm font-medium text-ink">Primycias</div>
            <div className="text-xs text-gray-500">Gestão de Dízimos e Ofertas</div>
          </div>
        </div>

        <div className="flex mb-4 border-b border-line">
          <button
            className="flex-1 text-sm py-2 border-b-2 transition-colors"
            style={{ borderColor: tab === "igreja" ? "#1E5631" : "transparent", color: tab === "igreja" ? "#1E5631" : "#6b7280" }}
            onClick={() => setTab("igreja")}
          >
            Acesso Igreja
          </button>
          <button
            className="flex-1 text-sm py-2 border-b-2 transition-colors"
            style={{ borderColor: tab === "desenvolvedor" ? "#1E5631" : "transparent", color: tab === "desenvolvedor" ? "#1E5631" : "#6b7280" }}
            onClick={() => setTab("desenvolvedor")}
          >
            Acesso Desenvolvedor
          </button>
        </div>

        {tab === "igreja" ? <IgrejaAccess igrejas={igrejas} /> : <DevAccess />}
      </div>
    </div>
  );
}

function IgrejaAccess({ igrejas }) {
  const [mode, setMode] = useState("login"); // login | register | forgot | nova-igreja
  const [loginState, loginFormAction] = useFormState(loginAction, {});
  const [registerState, registerFormAction] = useFormState(registerAction, {});
  const [forgotState, forgotFormAction] = useFormState(forgotPasswordAction, {});
  const [novaIgrejaState, novaIgrejaFormAction] = useFormState(criarIgrejaAction, {});

  const [foto, setFoto] = useState(null);
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [docCnpj, setDocCnpj] = useState(null);
  const [docResponsavel, setDocResponsavel] = useState(null);

  return (
    <>
      {mode === "login" && (
        <Card>
          <h2 className="text-lg font-serif text-ink mb-4">Acessar</h2>
          <form action={loginFormAction}>
            <Field label="CPF">
              <Input name="cpf" placeholder="000.000.000-00" required />
            </Field>
            <Field label="Senha (4 dígitos)">
              <Input name="senha" type="password" inputMode="numeric" maxLength={4} placeholder="••••" required />
            </Field>
            {loginState?.error && <p className="text-xs text-rust mb-3">{loginState.error}</p>}
            <SubmitButton className="w-full">Entrar</SubmitButton>
          </form>
          <div className="flex items-center justify-between mt-4">
            <button className="text-xs underline text-gray-600" onClick={() => setMode("register")}>
              Ainda não tenho cadastro
            </button>
            <button className="text-xs underline text-gray-600" onClick={() => setMode("forgot")}>
              Esqueci minha senha
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-paperDeep text-center">
            <button className="text-xs underline text-gray-500" onClick={() => setMode("nova-igreja")}>
              Cadastrar minha igreja na plataforma
            </button>
          </div>
        </Card>
      )}

      {mode === "register" && (
        <Card>
          <h2 className="text-lg font-serif text-ink mb-4">Solicitar cadastro</h2>
          <form action={registerFormAction}>
            <input type="hidden" name="foto" value={foto || ""} />
            <input type="hidden" name="cep" value={cep} />
            <Field label="Minha igreja">
              <Select name="igrejaId" required defaultValue="">
                <option value="" disabled>Selecione a igreja…</option>
                {igrejas.map((ig) => (
                  <option key={ig.id} value={ig.id}>{ig.nome}</option>
                ))}
              </Select>
            </Field>
            <Field label="Foto">
              <PhotoPicker value={foto} onChange={setFoto} />
            </Field>
            <Field label="CPF">
              <Input name="cpf" placeholder="000.000.000-00" required />
            </Field>
            <Field label="Nome completo">
              <Input name="nome" required />
            </Field>
            <Field label="Data de nascimento">
              <Input name="dataNascimento" type="date" />
            </Field>
            <Field label="Endereço de residência">
              <CEPLookup onApply={(end, cepVal) => { setEndereco(end); setCep(cepVal); }} />
              <Input name="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Complete com número e complemento" />
            </Field>
            <Field label="Telefone">
              <Input name="telefone" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Crie uma senha (4 dígitos)">
                <Input name="senha" type="password" inputMode="numeric" maxLength={4} required />
              </Field>
              <Field label="Confirme a senha">
                <Input name="senha2" type="password" inputMode="numeric" maxLength={4} required />
              </Field>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              4 dígitos, sem sequência, no máximo 2 repetidos, e diferente do ano ou do dia/mês de nascimento.
            </p>
            {registerState?.error && <p className="text-xs text-rust mb-3">{registerState.error}</p>}
            {registerState?.success && <p className="text-xs text-sage mb-3">{registerState.success}</p>}
            <div className="flex gap-2">
              <SubmitButton className="flex-1">Enviar cadastro</SubmitButton>
              <Btn type="button" kind="ghost" onClick={() => setMode("login")}>Voltar</Btn>
            </div>
          </form>
        </Card>
      )}

      {mode === "forgot" && (
        <Card>
          <h2 className="text-lg font-serif text-ink mb-4">Esqueci minha senha</h2>
          <p className="text-xs text-gray-500 mb-4">
            Informe seu CPF e cadastre uma nova senha. O pedido será enviado ao Pastor e/ou ao Secretário
            do Conselho, que poderão liberar ou negar.
          </p>
          <form action={forgotFormAction}>
            <Field label="CPF">
              <Input name="cpf" placeholder="000.000.000-00" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nova senha (4 dígitos)">
                <Input name="senha" type="password" inputMode="numeric" maxLength={4} required />
              </Field>
              <Field label="Confirme a nova senha">
                <Input name="senha2" type="password" inputMode="numeric" maxLength={4} required />
              </Field>
            </div>
            {forgotState?.error && <p className="text-xs text-rust mb-3">{forgotState.error}</p>}
            {forgotState?.success && <p className="text-xs text-sage mb-3">{forgotState.success}</p>}
            <div className="flex gap-2">
              <SubmitButton className="flex-1" disabled={!!forgotState?.success}>Enviar solicitação</SubmitButton>
              <Btn type="button" kind="ghost" onClick={() => setMode("login")}>Voltar</Btn>
            </div>
          </form>
        </Card>
      )}

      {mode === "nova-igreja" && (
        <Card>
          <h2 className="text-lg font-serif text-ink mb-1">Cadastrar minha igreja</h2>
          <p className="text-xs text-gray-500 mb-4">
            Sua igreja passa a existir na plataforma depois que o Desenvolvedor aprovar os documentos enviados.
          </p>
          <form action={novaIgrejaFormAction}>
            <input type="hidden" name="docCnpj" value={docCnpj || ""} />
            <input type="hidden" name="docResponsavel" value={docResponsavel || ""} />

            <Field label="Nome da igreja"><Input name="nomeIgreja" required /></Field>
            <Field label="CNPJ"><Input name="cnpj" placeholder="00.000.000/0000-00" required /></Field>
            <Field label="Nome do Pastor responsável"><Input name="nomePastor" required /></Field>
            <Field label="CPF do Pastor"><Input name="cpfPastor" placeholder="000.000.000-00" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="E-mail"><Input name="email" type="email" required /></Field>
              <Field label="Telefone"><Input name="telefone" /></Field>
            </div>
            <Field label="Endereço"><Input name="endereco" /></Field>

            <Field label="Cartão CNPJ (PDF, JPG ou PNG)">
              <DocPicker value={docCnpj} onChange={setDocCnpj} label="Anexar Cartão CNPJ" />
            </Field>
            <Field label="Documento do Pastor — RG ou CNH, frente e verso (PDF, JPG ou PNG)">
              <DocPicker value={docResponsavel} onChange={setDocResponsavel} label="Anexar documento do Pastor" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Crie uma senha (login do Pastor, 4 dígitos)">
                <Input name="senha" type="password" inputMode="numeric" maxLength={4} required />
              </Field>
              <Field label="Confirme a senha">
                <Input name="senha2" type="password" inputMode="numeric" maxLength={4} required />
              </Field>
            </div>

            {novaIgrejaState?.error && <p className="text-xs text-rust mb-3">{novaIgrejaState.error}</p>}
            {novaIgrejaState?.success && <p className="text-xs text-sage mb-3">{novaIgrejaState.success}</p>}

            <div className="flex gap-2">
              <SubmitButton className="flex-1" disabled={!!novaIgrejaState?.success}>Enviar cadastro da igreja</SubmitButton>
              <Btn type="button" kind="ghost" onClick={() => setMode("login")}>Voltar</Btn>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

function DevAccess() {
  const [devState, devFormAction] = useFormState(devLoginAction, {});
  return (
    <Card>
      <h2 className="text-lg font-serif text-ink mb-1">Acesso Desenvolvedor da Plataforma</h2>
      <p className="text-xs text-gray-500 mb-4">Restrito ao desenvolvedor responsável pela plataforma.</p>
      <form action={devFormAction}>
        <Field label="E-mail">
          <Input name="email" type="email" placeholder="seu-email@exemplo.com" required />
        </Field>
        <Field label="Senha">
          <Input name="senha" type="password" required />
        </Field>
        {devState?.error && <p className="text-xs text-rust mb-3">{devState.error}</p>}
        <SubmitButton className="w-full">Entrar</SubmitButton>
      </form>
    </Card>
  );
}
