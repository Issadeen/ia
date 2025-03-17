"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { SessionWarning } from "@/components/session-warning"

type AuthContextType = {
  user: User | null
  loading: boolean
  userInfo: {
    displayName: string
    joinDate: string | null
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userInfo: {
    displayName: "User",
    joinDate: null
  }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState({
    displayName: "User",
    joinDate: null as string | null
  })

  useEffect(() => {
    // Check for stored user info first for instant UI update
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo))
      } catch (e) {
        console.error('Error parsing stored user info:', e)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      if (user) {
        // Store the user auth state in localStorage to help with session persistence
        localStorage.setItem('authUser', 'true');
        
        const displayName = user.email ? user.email.split('@')[0] : "User"
        const joinDate = user.metadata.creationTime || null
        
        // Store user info in localStorage
        const userInfo = {
          displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          joinDate: joinDate
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        setUserInfo(userInfo)
      } else {
        // Only clear if not a page refresh
        if (document.visibilityState !== 'hidden') {
          localStorage.removeItem('authUser');
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, userInfo }}>
      {children}
      <SessionWarning />
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
