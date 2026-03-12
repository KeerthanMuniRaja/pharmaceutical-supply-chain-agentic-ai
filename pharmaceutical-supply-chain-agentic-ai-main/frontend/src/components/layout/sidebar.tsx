'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  Package,
  MapPin,
  AlertTriangle,
  Home,
  HeartPulse,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Demand Forecasting', href: '/forecasting', icon: TrendingUp },
  { name: 'Inventory Management', href: '/inventory', icon: Package },
  { name: 'Route Optimization', href: '/routes', icon: MapPin },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex flex-col w-72 bg-gray-950/95 backdrop-blur-xl text-gray-300 shadow-2xl border-r border-gray-800 transition-all duration-300 z-20 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-center h-20 px-6 border-b border-gray-800/80 bg-gray-900/50 relative z-10">
        <div className="flex items-center space-x-3 w-full justify-start pl-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <HeartPulse className="text-white h-5 w-5 font-bold" />
          </div>
          <h1 className="text-white text-xl font-extrabold tracking-wide">Pharma<span className="text-emerald-400">Chain</span></h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto bg-transparent relative z-10 hidden-scrollbar">
        <div className="px-3 pb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
          Menu Overview
        </div>
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
              <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] border border-emerald-500/20'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-emerald-300 border border-transparent hover:border-gray-700/50'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-md transition-all duration-300 blur-[1px]" />
              )}
              <Icon className={cn(
                "mr-3.5 h-5 w-5 transition-transform duration-300",
                isActive ? "text-emerald-400 scale-110" : "group-hover:text-emerald-300 group-hover:scale-110"
              )} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800/80 bg-gray-900/50 relative z-10 space-y-3">
        {/* User info */}
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 shadow-sm backdrop-blur-md">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="font-extrabold text-emerald-400 text-xs text-center">{user?.name ? user.name.substring(0,2).toUpperCase() : 'AI'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-200 truncate">{user?.name || 'Dr. Admin'}</p>
            <p className="text-xs text-emerald-400 truncate font-semibold flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
              {user?.role || 'admin'} · Agent
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 text-sm font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-gray-800 hover:border-red-500/30 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}