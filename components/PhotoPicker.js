"use client";

import { useRef, useState } from "react";
import { Btn } from "./ui";

function normalizeToJPEG(dataUrl, maxDim = 480, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Não foi possível processar a imagem."));
    img.src = dataUrl;
  });
}

export default function PhotoPicker({ value, onChange, round = true }) {
  const ref = useRef();
  const [erro, setErro] = useState("");

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center overflow-hidden shrink-0 bg-paperDeep"
        style={{ width: 56, height: 56, borderRadius: round ? "50%" : 4, border: "1px solid #D3D8D0" }}
      >
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">foto</span>}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setErro("");
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const jpeg = await normalizeToJPEG(reader.result);
              onChange(jpeg);
            } catch {
              setErro("Não foi possível processar essa imagem.");
            }
          };
          reader.readAsDataURL(f);
        }}
      />
      <Btn type="button" kind="subtle" onClick={() => ref.current?.click()}>Escolher foto</Btn>
      {erro && <span className="text-xs text-rust">{erro}</span>}
    </div>
  );
}
