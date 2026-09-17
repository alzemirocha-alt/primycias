"use client";
import { useState, useEffect } from "react";

export default function BoasVindas({ nome }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const jaViuHoje = sessionStorage.getItem("boas_vindas_hoje");
    const hoje = new Date().toDateString();
    if (jaViuHoje!== hoje) {
      setVisivel(true);
      // some quando clicar em qualquer lugar
      const fechar = () => {
        setVisivel(false);
        sessionStorage.setItem("boas_vindas_hoje", hoje);
        document.removeEventListener("click", fechar);
      };
      setTimeout(() => document.addEventListener("click", fechar), 1000);
    }
  }, []);

  if (!visivel) return null;

  return (
    <div className="bg-green-50 border-l-4 border-green-700 p-4 mb-4 rounded-r-lg animate-fade-in">
      <p className="text-sm font-semibold text-green-900">Bem-vindo(a), {nome}! 🙏</p>
      <p className="text-[13px] text-gray-700 mt-1 italic">
        "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens,
        cientes de que recebereis do Senhor a recompensa da herança. A Cristo, o Senhor, é que estais servindo..."
      </p>
      <p className="text-xs font-bold text-green-800 mt-1">Colossenses 3:23-24</p>
      <p className="text-[11px] text-gray-500 mt-2">Clique em qualquer lugar para continuar</p>
    </div>
  );
}
