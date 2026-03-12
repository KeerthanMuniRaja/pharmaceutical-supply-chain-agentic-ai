'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthProvider, useAuth } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={inter.className}>
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token, isLoading } = useAuth()
  const publicRoutes = ['/login', '/signup']
  
  useEffect(() => {
    if (isLoading) return; // Wait for initial load
    
    const isPublic = publicRoutes.includes(pathname)
    const authed = !!token

    if (!authed && !isPublic) {
      router.replace('/login')
    } else if (authed && isPublic) {
      router.replace('/')
    }
  }, [pathname, router, token, isLoading])

  // Loading state during auth check
  if (isLoading && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex bg-gray-950 h-screen w-full items-center justify-center relative overflow-hidden">
         <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),rgba(0,0,0,1))]"></div>
        <div className="flex flex-col items-center space-y-4 z-10">
          <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-l-2 border-blue-500 animate-spin" />
          <span className="text-sm text-blue-400 font-medium tracking-widest">INITIALIZING...</span>
        </div>
      </div>
    )
  }

  // Public pages — no sidebar/header
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // Authenticated app layout
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}