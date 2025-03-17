"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Truck, Briefcase, Plus, Wallet, LogOut, Moon, Sun, User, Info, ShoppingCart, BarChart3, ClipboardList, FileText, FileUp } from "lucide-react"
import { useTheme } from "next-themes"
import { auth } from "@/lib/firebase"
import { motion } from "framer-motion"
import { UserProfile } from "@/components/user-profile"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/auth-provider"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const navigationCards = [
  { 
    icon: ShoppingCart, 
    title: "Orders", 
    description: "Manage and create new orders", 
    href: "/dashboard/orders" 
  },
  { 
    icon: BarChart3, 
    title: "Reports", 
    description: "View analytics and reports", 
    href: "/dashboard/reports" 
  },
  { 
    icon: ClipboardList, 
    title: "Summary", 
    description: "Overview and statistics", 
    href: "/dashboard/summary" 
  },
  { 
    icon: FileText, 
    title: "Delivery & Invoice", 
    description: "Track deliveries and manage invoices", 
    href: "/dashboard/delivery-invoice" 
  },
  { 
    icon: FileUp, 
    title: "Document Upload", 
    description: "Upload truck documents", 
    href: "/documents" 
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { userInfo } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="fixed top-0 left-0 right-0 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-2xl md:text-3xl font-bold text-transparent">
            Issaerium-23
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
            ) : (
              <Moon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            )}
          </Button>
          <UserProfile />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Spinner className="text-blue-500" />
            ) : (
              <LogOut className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            )}
          </Button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto mt-20 md:mt-24 p-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-3xl md:text-5xl font-bold text-transparent mb-2 md:mb-4 text-center"
        >
          Welcome back, {userInfo.displayName}!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-lg md:text-xl font-medium text-transparent mb-8 md:mb-12 text-center"
        >
          Your Issaerium-23 dashboard awaits.
        </motion.p>

        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
          {navigationCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link href={card.href}>
                <Card className="h-[200px] md:h-[250px] transition-all hover:border-primary hover:shadow-md bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 group hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-blue-500/10">
                  <CardHeader className="flex flex-col items-center text-center gap-4 pt-8">
                    <card.icon className="h-12 w-12 md:h-14 md:w-14 text-emerald-500 group-hover:text-blue-500 transition-colors" />
                    <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground/80 text-center">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
      <footer className="fixed bottom-4 right-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur hover:bg-background/90"
            >
              <Info className="h-5 w-5 text-muted-foreground/80" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Session Information</h4>
              <p className="text-sm text-muted-foreground">
                Login time: {new Date().toLocaleString()}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </footer>
    </div>
  )
}

