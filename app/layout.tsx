import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { ParticlesBackground } from "@/components/particles-background"
import { Toaster } from "sonner"
// Import Firebase to ensure initialization
import "@/lib/firebase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Issaerium-23",
  description: "Modern web application for business management"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ParticlesBackground />
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster 
            theme="system" 
            className="!bg-background !text-foreground !border-border [&>[data-type='error']]:!bg-destructive [&>[data-type='error']]:!text-destructive-foreground"
            position="top-center"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
