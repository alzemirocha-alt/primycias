import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const body = await req.json()
  const { selecionado, familiaIds, igrejaDestino, forma, ataNumero, dataReuniao } = body

  function getFormaIndividual(membro, formaComungante){
    const tipo = (membro.tipo_membro || membro.categoria_membro || '').toLowerCase()
    const isNao = tipo.includes('nao') || tipo.includes('não')
    if(isNao) return 'Transferência a pedido dos Pais ou Responsáveis e, na falta destes, a Juízo do Conselho - Art. 19, parágrafo único CI/IPB'
    return formaComungante
  }

  try {
    // BUSCA DADOS DINÂMICOS ANTES - CORREÇÃO DO SECRETÁRIO + EMAIL MULTI-IGREJA
    const { data: dadosIgreja } = await supabase
     .from('vw_igreja_completa')
     .select('*')
     .eq('igreja_id', selecionado.igreja_id)
     .single()

    // NOVO: Busca email/telefone direto da tabela igrejas (multi-igreja real)
    let emailIgreja = dadosIgreja?.igreja_email || dadosIgreja?.email || null
    let telefoneIgreja = dadosIgreja?.igreja_telefone || dadosIgreja?.telefone || null

    try {
      const { data: ig } = await supabase.from('igrejas').select('email, telefone, nome').eq('id', selecionado.igreja_id).single()
      if(ig){
        if(ig.email) emailIgreja = ig.email
        if(ig.telefone) telefoneIgreja = ig.telefone
      }
    } catch(e){}

    // 1. Cria a carta - AGORA JÁ COM IGREJA ORIGEM, PASTOR, SECRETARIO + EMAIL
    const { data: carta, error: errCarta } = await supabase.from('cartas_transferencia').insert({
      igreja_id: selecionado.igreja_id,
      igreja_destino: igrejaDestino,
      forma_transferencia: forma,
      ata_numero: ataNumero,
      data_reuniao_conselho: dataReuniao,
      data_emissao: new Date().toISOString().split('T')[0],
      igreja_origem: dadosIgreja?.igreja_nome,
      pastor_nome_completo: dadosIgreja?.pastor_nome_completo,
      secretario_nome_completo: dadosIgreja?.secretario_nome_completo,
      // MULTI-IGREJA: salva email da igreja na carta
      igreja_email: emailIgreja,
      igreja_telefone: telefoneIgreja
    }).select().single()

    if(errCarta) throw errCarta

    // 2. Busca todos os membros COM TODAS AS COLUNAS DA FICHA
    const ids = [selecionado.id,...(familiaIds||[])].filter(Boolean)
    const { data: membros } = await supabase.from('membros_oficial').select('*').in('id', ids)

    let lista = membros && membros.length>0? membros : [selecionado]
    if(ids.length>1 && lista.length===1){
      const map = new Map(lista.map(m=>[String(m.id), m]))
      lista = ids.map(id => map.get(String(id)) || (String(id)===String(selecionado.id)? selecionado : null)).filter(Boolean)
    }

    // 3. Insere cada um e demite - SALVANDO TODA A FICHA
    for(const mem of lista){
      const formaInd = getFormaIndividual(mem, forma)
      const tipoLower = (mem.tipo_membro || mem.categoria_membro || '').toLowerCase()
      const isNao = tipoLower.includes('nao') || tipoLower.includes('não')
      const formaDemissao =!isNao
       ? 'Carta de Transferência - Art. 23, alínea "d" CI/IPB'
        : 'Carta dos Pais/Resp. a juízo do Conselho - Art. 24, alínea "a"'

      await supabase.from('cartas_membros').insert({
        carta_id: carta.id,
        membro_id: mem.id,
        nome_completo: mem.nome_completo,
        tipo_membro: mem.tipo_membro || mem.categoria_membro,
        oficial_tipo: mem.oficial_tipo,
        categoria_membro: mem.categoria_membro,
        data_admissao: mem.data_admissao,
        forma_admissao: mem.forma_admissao || mem.forma_admissao_comungante || mem.forma_admissao_nao_comungante || mem.forma_de_admissao,
        local_admissao: mem.local_admissao,
        data_batismo: mem.data_batismo,
        local_batismo: mem.local_batismo,
        pastor_batismo: mem.pastor_batismo,
        data_profissao_fe: mem.data_profissao_fe,
        local_profissao_fe: mem.local_profissao_fe,
        pastor_profissao_fe: mem.pastor_profissao_fe,
        data_ordenacao: mem.data_ordenacao,
        forma_transferencia_individual: formaInd
      })

      await supabase.from('membros_oficial').update({
        status: 'demitido',
        situacao: 'demitido',
        status_membro: 'demitido',
        data_demissao: carta.data_emissao,
        forma_demissao: formaDemissao,
        motivo_demissao: `Transferido para ${igrejaDestino}`,
        data_transferencia: carta.data_emissao
      }).eq('id', mem.id)
    }

    // 4. Retorna já com dados dinâmicos para o PDF usar
    return Response.json({
      ok: true,
      cartaId: carta.id,
      igrejaOrigem: dadosIgreja?.igreja_nome,
      pastorOrigem: dadosIgreja?.pastor_nome_completo,
      pastorCargo: dadosIgreja?.pastor_cargo || 'Pastor Titular',
      secretarioNome: dadosIgreja?.secretario_nome_completo,
      cidade: dadosIgreja?.cidade,
      igrejaEmail: emailIgreja,
      igrejaTelefone: telefoneIgreja
    })
  } catch(e){
    console.error(e)
    return Response.json({ error: e.message }, { status: 400 })
  }
}
