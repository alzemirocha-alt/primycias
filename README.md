# Primycias

Plataforma multi-tenant de gestão de dízimos e ofertas para organizações religiosas — Next.js 14 (App Router) + Tailwind + Supabase. Cada igreja é isolada por `igreja_id`; o Desenvolvedor da Plataforma aprova, licencia e administra todas as igrejas.

## Login (duas abas em `/login`)

- **Acesso Igreja** (CPF + senha): login normal, cadastro de membro (escolhendo a igreja), esqueci minha senha, e **"Cadastrar minha igreja na plataforma"** — onboarding de uma nova igreja com upload do Cartão CNPJ e do documento do Pastor, que fica `pendente_pagamento` até o Desenvolvedor aprovar.
- **Acesso Desenvolvedor** (e-mail + senha): restrito a `alzemirocha@gmail.com`, leva direto a `/desenvolvedor` — painel para aprovar/reprovar igrejas, definir tipo de licença (grátis/paga) e prazo, suspender/reativar.

O CPF do desenvolvedor (093.859.804-08) também tem uma conta fixa como **Secretário da Igreja Sucupira** pela Aba 1 — com acesso de secretaria, mas **sem** acesso a Tesouraria/financeiro.

## Fluxo implementado

1. Login por CPF + senha (4 dígitos, com hash bcrypt no banco).
2. Pastor = acesso MASTER (vê e edita tudo).
3. Secretário do Conselho e Pastor administram usuários (aprovar cadastro, editar função, senha, foto).
4. Tesoureiro da Igreja valida os registros e pode reportar erro.
5. Fluxo do registro de culto: **Diácono lança → Secretário do Conselho confirma → Tesoureiro da Igreja valida** (ou reporta erro, que devolve para o diácono corrigir e reenviar).
6. Histórico de senha, histórico de aprovações por registro, e relatório de erro ficam guardados.
7. Dados da Igreja Presbiteriana em Sucupira já preparados no script de migração.

## Módulos completos

- **Usuários**: aprovação, edição, foto (normalizada para JPEG no upload), CEP com busca automática de endereço, senha (histórico, redefinição com liberação do Pastor/Secretário).
- **Dízimos e Ofertas**: lançamento, confirmação, validação, exclusão com regras por papel.
- **Relatórios**: relatório de dízimos/ofertas em PDF (gerado no servidor com `pdf-lib`, incluindo o logotipo da igreja de verdade).
- **Controle Financeiro da Tesouraria** (exclusivo Pastor/Secretário/Tesoureiro):
  - Lançamentos manuais de entrada/saída — imediatos, futuros ou recorrentes (semanal/mensal/anual).
  - Fluxo de revisão: quem lança aprova o próprio registro; depois de aprovado, só reporta erro dentro de 30 dias (depois disso só o Pastor mexe); exclusão segue as mesmas regras de fase.
  - Bloqueio de lançamento de saída com mais de 90 dias no passado, salvo liberação do Pastor/Secretário.
  - Saldo inicial do fluxo de caixa (uma vez, depois só muda com liberação).
  - Fluxo de Caixa com extrato e saldo corrente.
  - Relatórios em PDF: entradas, saídas, fluxo de caixa (realizado e futuro), balancete, recibo de dizimista, recibo de pagamento (com campo de assinatura).
  - Relatórios de Gestão: gráficos de entradas × saídas por mês, evolução do saldo, saídas por categoria.
- **Calendário de Atividades**: agenda pessoal + eventos para todos (Pastor/Secretário).
- **Avisos** na página inicial: texto, imagem, link ou vídeo (Pastor/Secretário publicam; todos veem).
- **Quadros de liderança** na página inicial: Conselho da Igreja, Junta Diaconal (com "Membro da Junta Diaconal" para quem não tem função específica) e Tesoureiro da Igreja.
- **Aniversários**: mensagem para o próprio aniversariante e aviso aos demais no dia.
- **Dados da Igreja**: edição completa (nome, CNPJ, CEP, endereço, contato, logotipo) pelo Pastor/Secretário, a qualquer momento.
- **Meus dados**: cada usuário vê seu próprio CPF, mandato e histórico de senha, e pode trocar sua própria foto.

## 1. Configurar o Supabase

1. Abra o projeto em https://supabase.com/dashboard, vá em **SQL Editor**.
2. Cole e rode o conteúdo de `supabase/schema.sql` (cria as tabelas e bloqueia o acesso público — RLS fechado, só a service role acessa).
3. Vá em **Project Settings > API** e copie a **service_role key** (é secreta — nunca coloque no código do cliente nem em variável `NEXT_PUBLIC_*`).

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://ebqvtoqpoxaklhheaeve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Bl5CIfdk2CIstEc78-P0-Q_MvwIYYUC
SUPABASE_SERVICE_ROLE_KEY=   <- cole aqui a service_role key
SESSION_SECRET=              <- qualquer string longa/aleatória (ex.: openssl rand -hex 32)
```

## 3. Instalar e migrar os dados do backup

```bash
npm install
npm run seed
```

O `npm run seed` lê `data/backup-dizimos-ofertas-2026-09-09.json` (já incluso no projeto) e:

- Cria a igreja (Igreja Presbiteriana em Sucupira).
- Cria os 10 usuários do backup, **com o mesmo PIN de 4 dígitos que cada um já usava** — só que agora salvo com hash (bcrypt), não mais em texto puro.
- Migra o histórico de senha de cada um.
- Migra o registro de culto existente (itens, aprovações e o relatório de erro de oferta), adaptando para o novo fluxo de 3 etapas.

Pode rodar de novo sem duplicar: usuários e igreja são atualizados por CPF, não recriados.

## 4. Rodar localmente

```bash
npm run dev
```

Acesse http://localhost:3000 — vai cair na tela de login. Use o CPF e o PIN de qualquer usuário do backup (ex.: Glaucio Luciano, CPF 865.666.604-53, PIN igual ao que já era usado).

## 5. Publicar na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab) **ou** arraste a pasta direto no projeto `Primycias` que você já criou na Vercel.
2. Em **Project Settings > Environment Variables** na Vercel, cadastre as mesmas 4 variáveis do `.env.local`.
3. Deploy. O comando de build já é o padrão do Next.js (`next build`) — nada a mudar.
4. Depois do primeiro deploy, rode `npm run seed` **uma vez**, localmente ou via Vercel CLI (`vercel env pull` para baixar as variáveis, depois `npm run seed`), para popular o banco de produção com os dados reais.

## Módulos multi-tenant novos

- **Painel do Desenvolvedor (`/desenvolvedor`)**: lista igrejas por status (pendentes, ativas, suspensas, expiradas, reprovadas), mostra os 2 documentos enviados lado a lado (via signed URL do bucket privado `documentos-licencas`), aprova (grátis/paga + prazo indeterminado ou em dias), reprova, suspende, reativa e edita o prazo depois.
- **Cadastro de nova igreja**: em `/login`, aba "Acesso Igreja" → "Cadastrar minha igreja na plataforma". Sobe os documentos, cria a igreja como `pendente_pagamento` e o Pastor como usuário `pendente`, e envia e-mail automático para o desenvolvedor (via Gmail SMTP — configure `GMAIL_USER`/`GMAIL_APP_PASSWORD` no `.env.local`, veja `.env.example`). Quando o desenvolvedor aprova a igreja, o Pastor é liberado automaticamente.
- **Orçamento Anual (`/igreja/[id]/orcamento-anual`)**: Pastor e Tesoureiro definem o valor previsto por categoria no ano; o realizado é calculado automaticamente a partir dos dízimos/ofertas e lançamentos validados. O Secretário só visualiza. Tem gráfico Previsto × Realizado por mês (Recharts), relatório em PDF e exportação em Excel.
- **Exportar Excel**: em todos os relatórios financeiros (Dízimos/Ofertas, Entradas, Saídas, Fluxo de Caixa, Balancete, Orçamento Anual) há um botão verde "📥 Exportar Excel" ao lado do "Baixar PDF", que exporta exatamente o período/filtro que está na tela, nas colunas Data | Membro | Tipo | Valor | Forma Pagamento | Categoria | Igreja. **Observação:** o app ainda não coleta a forma de pagamento (dinheiro/PIX/cartão) em nenhum lançamento, então essa coluna sai sempre como "—" até esse campo passar a existir nos formulários.

### E-mail (Gmail em vez de um serviço transacional)

O envio do e-mail de "nova igreja cadastrada" usa `nodemailer` com SMTP do Gmail, autenticando com uma **Senha de app** (não a senha normal da conta):

1. Ative a verificação em 2 etapas em `alzemirocha@gmail.com`.
2. Gere uma senha de app em `myaccount.google.com/apppasswords`.
3. Configure `GMAIL_USER` e `GMAIL_APP_PASSWORD` no `.env.local` (e nas variáveis de ambiente da Vercel).

Sem essas variáveis, o cadastro da igreja continua funcionando normalmente — só o e-mail não é enviado (fica registrado um aviso no log do servidor).

## Observação importante sobre segurança

As tabelas do Supabase ficam com **RLS ativado e sem nenhuma policy pública** — de propósito. Isso significa que a chave anônima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) não consegue ler nem escrever nada sozinha; toda operação passa pelas Server Actions do Next.js, que usam a `SUPABASE_SERVICE_ROLE_KEY` (mantida só no servidor). Isso é importante porque o banco guarda CPF e foto de pessoas reais.

## Rodando o SQL do schema de novo

Como este projeto cresceu, o `supabase/schema.sql` agora também cria as tabelas de Tesouraria, calendário e avisos. Se você já tinha rodado uma versão anterior do schema, rode o arquivo inteiro de novo — todos os `create table if not exists` são seguros de repetir, não apagam nada que já existe.
