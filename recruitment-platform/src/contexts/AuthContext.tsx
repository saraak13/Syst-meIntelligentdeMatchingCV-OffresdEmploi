import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, Role } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: Role) => Promise<boolean>
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: Role,
    phoneNumber?: string,
    avatarUrl?: string,
    company?: string,
    location?: string,
    image_base64?: string
  ) => Promise<boolean>
  logout: () => void
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('recruitai_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = async (email: string, password: string, role: Role): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      if (data.user) {
        const loggedUser: User = {
          id: data.user.id,
          name: `${data.user.first_name} ${data.user.last_name}`,
          email: data.user.email,
          role: data.user.role as Role,
          company: data.user.company || undefined,
          location: data.user.location || undefined,
          avatar: data.user.avatar_url || undefined,
          createdAt: data.user.created_at || new Date().toISOString()
        }
        setUser(loggedUser)
        localStorage.setItem('recruitai_user', JSON.stringify(loggedUser))
        return true
      }
      return false
    } catch (err) {
      console.error("Login error:", err)
      return false
    }
  }

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: Role,
    phoneNumber?: string,
    avatarUrl?: string,
    company?: string,
    location?: string,
    image_base64?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          role,
          phone_number: phoneNumber,
          avatar_url: avatarUrl,
          company,
          location,
          image_base64: image_base64
        }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      if (data.user) {
        const registeredUser: User = {
          id: data.user.id,
          name: `${data.user.first_name} ${data.user.last_name}`,
          email: data.user.email,
          role: data.user.role as Role,
          company: data.user.company || undefined,
          location: data.user.location || undefined,
          avatar: data.user.avatar_url || undefined,
          createdAt: data.user.created_at || new Date().toISOString()
        }
        setUser(registeredUser)
        localStorage.setItem('recruitai_user', JSON.stringify(registeredUser))
        return true
      }
      return false
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('recruitai_user')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('recruitai_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}