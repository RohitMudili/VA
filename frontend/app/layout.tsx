import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./animations.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FloatingMicButton } from "@/components/floating-mic-button"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "PolymAIths | Customised AI Ecosystems for Real Estate, Healthcare & Hospitality",
  description:
    "We Are The PolymAIths. We deliver Momentum. You get Leverage. Restructuring overwhelmed industries with customised B2B and B2C AI ecosystems. Products: Evernest, Tenent, Keynest, Echovest, Opencare, Healdesk.",
  keywords:
    "AI ecosystems, real estate AI, healthcare AI, hospitality AI, property management, tenant support, voice agents, AI automation, custom AI solutions",
  authors: [{ name: "PolymAIths" }],
  creator: "PolymAIths",
  publisher: "PolymAIths",
  robots: "index, follow",
  openGraph: {
    title: "PolymAIths | Customised AI Ecosystems for Real Estate, Healthcare & Hospitality",
    description:
      "We deliver Momentum. You get Leverage. Restructuring overwhelmed industries with intelligent AI ecosystems.",
    type: "website",
    locale: "en_US",
    siteName: "PolymAIths",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolymAIths | Customised AI Ecosystems for Real Estate, Healthcare & Hospitality",
    description:
      "We deliver Momentum. You get Leverage. Restructuring overwhelmed industries with intelligent AI ecosystems.",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://polymaiths.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main role="main">{children}</main>
          <FloatingMicButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
