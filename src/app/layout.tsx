import { Check } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { SwRegister } from "@/components/sw-register";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "saludlog",
  description: "Registro personal de salud: comidas, entrenos, hábitos y peso.",
};

export const viewport: Viewport = {
  themeColor: "#0c110c",
};

const themeScript = `try {
  var t = localStorage.getItem('theme') || 'dark';
  var el = document.documentElement;
  el.classList.toggle('light', t === 'light');
  el.classList.toggle('dark', t !== 'light');
} catch (e) {}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <div className="flex min-h-screen">
          <aside className="flex w-56 shrink-0 flex-col gap-4 border-r border-border bg-sidebar py-5">
            <span className="flex items-center gap-2 px-6 text-lg font-semibold tracking-tight">
              <span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              saludlog
            </span>
            <AppNav />
            <div className="mt-auto px-3">
              <ThemeToggle />
            </div>
          </aside>
          <main className="flex-1 px-8 py-6">{children}</main>
        </div>
        <SwRegister />
      </body>
    </html>
  );
}
