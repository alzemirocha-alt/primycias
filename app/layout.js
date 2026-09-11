import "./globals.css";

export const metadata = {
  title: "Primycias",
  description: "Gestão de dízimos e ofertas — Primycias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
