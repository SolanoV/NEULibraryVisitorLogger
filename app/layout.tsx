import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from '@/components/Navbar'
import Background from '@/components/Background'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] })

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | NEU Library Visitor Logger",
    default: "NEU Library Visitor Logger"
  },
  description: "Made by Vinz Solano",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Background>
            
            <Navbar />
            
            <main className="flex-1 flex flex-col w-full">
              {children}
            </main>
            
          </Background>
        </ThemeProvider>
      </body>
    </html>
  )
}
