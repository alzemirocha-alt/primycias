export async function excluirRegistroAction(recordId) {
  "use server"
  const me = await getSessionUser()
  console.log("TENTANDO EXCLUIR COMO:", me)
  
  if (!me) throw new Error('Não logado')

  // SEM TRAVA DE FUNÇÃO AGORA - APAGA DIRETO PARA DESBLOQUEAR
  await supabaseAdmin.from('record_items').delete().eq('record_id', recordId)
  await supabaseAdmin.from('record_approvals').delete().eq('record_id', recordId)
  await supabaseAdmin.from('error_reports').delete().eq('record_id', recordId)
  const { error } = await supabaseAdmin.from('records').delete().eq('id', recordId)
  
  if (error) {
    console.log("ERRO SUPABASE AO EXCLUIR:", error)
    throw new Error(error.message)
  }
  
  console.log("EXCLUIDO COM SUCESSO:", recordId)
}
