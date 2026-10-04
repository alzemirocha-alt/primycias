import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const body = await req.json()
  const { selecionado, familiaIds, igrejaDestino, forma } = body

  function getFormaIndividual(membro, formaComungante){
    const tipo = (membro.tipo_membro || membro.categoria_membro || '').toLowerCase()
    const isComungante = tipo.includes('comungante') &&!tipo.includes('nao') &&!tipo.includes('não')
    if(isComungante) return formaComungante
    return 'Transferência a pedido dos Pais ou Responsáveis e, na falta destes, a Juízo do Conselho - Art. 19, parágrafo único CI/IPB'
  }

  try {
    // 1. Cria a carta
    const { data: carta, error: errCarta } = await supabase.from('cartas_transferencia').insert({
      igreja_id: selecionado.igreja_id,
      igreja_destino: igrejaDestino,
      forma_transferencia: forma,
      data_emissao: new Date().toISOString().split('T')[0]
    }).select().single()

    if(errCarta) throw errCarta

    // 1.1 - NOVO: Busca dados dinâmicos da igreja/pastor pela view
    const { data: dadosIgreja } = await supabase
     .from('vw_igreja_completa')
     .select('*')
     .eq('igreja_id', selecionado.igreja_id)
     .single()

    // 2. Busca todos os membros
    const ids = [selecionado.id,...(familiaIds||[])].filter(Boolean)
    const { data: membros } = await supabase.from('membros_oficial').select('*').in('id', ids)

    let lista = membros && membros.length>0? membros : [selecionado]
    if(ids.length>1 && lista.length===1){
      const map = new Map(lista.map(m=>[String(m.id), m]))
      lista = ids.map(id => map.get(String(id)) || (String(id)===String(selecionado.id)? selecionado : null)).filter(Boolean)
    }

    // 3. Insere cada um e demite
    for(const mem of lista){
      const formaInd = getFormaIndividual(mem, forma)
      const isComungante = formaInd === forma
      const formaDemissao = isComungante
       ? 'Carta de Transferência - Art. 23, alínea "d" CI/IPB'
        : 'Carta dos Pais/Resp. a juízo do Conselho - Art. 24, alínea "a"'

      await supabase.from('cartas_membros').insert({
        carta_id: carta.id,
        membro_id: mem.id,
        nome_completo: mem.nome_completo,
        tipo_membro: mem.tipo_membro || mem.categoria_membro,
        forma_transferencia_individual: formaInd
      })

      await supabase.from('membros_oficial').update({
        status: 'demitido',
        situacao: 'demitido',
        status_membro: 'demitido',
        data_demissao: carta.data_emissao,
        forma_demissao: formaDemissao,
        data_transferencia: carta.data_emissao
      }).eq('id', mem.id)
    }

    // 4. Retorna já com dados dinâmicos para o PDF usar
    return Response.json({
      ok: true,
      cartaId: carta.id,
      igrejaOrigem: dadosIgreja?.igreja_nome,
      pastorOrigem: dadosIgreja?.pastor_nome_completo, // AGORA DINÂMICO - Glaucio, Alzemir, etc vem daqui
      pastorCargo: dadosIgreja?.pastor_cargo
    })
  } catch(e){
    return Response.json({ error: e.message }, { status: 400 })
  }
}
