import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Intelix Agent",
    template: "%s | Intelix Agent",
  },
  description:
    "Plataforma fullstack de suporte tecnico com agentes autonomos, RAG e gestao de chamados para ERP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster
          closeButton
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast:
                "rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xl",
            },
          }}
        />
      </body>
    </html>
  );
}
