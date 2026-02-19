import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Reading Memo Bookshelf",
  description: "読書メモ管理アプリ — 著者の主張・自分の洞察・具体アクションを構造化して記録",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100`}>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
