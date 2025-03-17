"use client"

import { useState, useEffect } from "react"
import { User, Mail, Calendar } from "lucide-react"
import { auth } from "@/lib/firebase"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function UserProfile() {
  const [joinDate, setJoinDate] = useState<Date | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (user?.metadata.creationTime) {
      setJoinDate(new Date(user.metadata.creationTime))
    }
  }, [])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-6 w-6 text-emerald-500" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
            Profile
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Account</p>
              <p className="text-sm text-muted-foreground">{auth.currentUser?.email?.split('@')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{auth.currentUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Joined</p>
              <p className="text-sm text-muted-foreground">
                {joinDate?.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
