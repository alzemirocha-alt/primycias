import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',textAlign:'center'}}>
      <h2 style={{fontSize:'20px',fontWeight:'600'}}>Registro não encontrado</h2>
      <p style={{fontSize:'14px',color:'#71717a',marginTop:'8px'}}>Este dízimo/oferta foi excluído ou não existe mais.</p>
      <Link href="/registros" style={{marginTop:'24px',padding:'8px 16px',background:'#1a3d23',color:'white',borderRadius:'6px'}}>
        Voltar para Dízimos e Ofertas
      </Link>
    </div>
  );
}
