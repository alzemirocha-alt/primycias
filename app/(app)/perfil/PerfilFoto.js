"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PhotoPicker from "@/components/PhotoPicker";
import { atualizarMinhaFotoAction } from "./actions";

export default function PerfilFoto({ foto }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [preview, setPreview] = useState(foto);

  const onChange = (dataUrl) => {
    setPreview(dataUrl);
    startTransition(async () => {
      await atualizarMinhaFotoAction(dataUrl);
      router.refresh();
    });
  };

  return <PhotoPicker value={preview} onChange={onChange} />;
}
