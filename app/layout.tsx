import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })


export const metadata: Metadata = {
  title: "Africash - Gestion de Dépôts et Retraits",
  description: "Plateforme de gestion de transactions pour paris sportifs",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
