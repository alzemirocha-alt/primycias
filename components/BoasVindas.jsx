"use client";
import { useState, useEffect } from "react";

export default function BoasVindas({ nome, cargo }) {
  const [visivel, setVisivel] = useState(false);
  const primeiroNome = nome? nome.split(" ")[0] : "";

  useEffect(() => {
    // só mostra se ainda NÃO mostrou nessa sessão de login
    const jaMostrou = sessionStorage.getItem("boas_vindas_mostrada");
    if (!jaMostrou) {
      setVisivel(true);
    }

    const fechar = () => {
      setVisivel(false);
      sessionStorage.setItem("boas_vindas_mostrada", "1");
      document.removeEventListener("click", fechar);
    };

    // delay pra não fechar no clique que fez login
    const t = setTimeout(() => {
      if (!jaMostrou) document.addEventListener("click", fechar);
    }, 800);

    return () => {
      clearTimeout(t);
      document.removeEventListener("click", fechar);
    };
  }, []);

  if (!visivel) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm shadow-2xl border border-line max-w-md w-full p-6 text-center"
      >
        <div className="text-3xl mb-2">🙏</div>
        <p className="text-lg font-serif font-bold text-ink">
          Bem vindo ao Primycias, {cargo} {primeiroNome}!
        </p>

        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-[13px] text-gray-700 italic leading-relaxed">
            "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens,
            cientes de que recebereis do Senhor a recompensa da herança. A Cristo, o Senhor, é que estais servindo..."
          </p>
          <p className="text-xs font-bold text-green-800 mt-2">Colossenses 3:23-24</p>
        </div>

        <button
          onClick={() => {
            setVisivel(false);
            sessionStorage.setItem("boas_vindas_mostrada", "1");
          }}
          className="mt-5 px-6 py-2 bg-[#1E5631] text-white text-sm rounded-sm"
        >
          Continuar
        </button>
        <p className="text-[10px] text-gray-400 mt-2">clique em qualquer lugar para fechar</p>
      </div>
    </div>
  );
}
