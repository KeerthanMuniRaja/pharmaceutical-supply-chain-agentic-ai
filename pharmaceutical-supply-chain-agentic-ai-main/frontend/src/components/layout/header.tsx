'use client'

import { Bell, Search, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Header() {
  return (
    <header className="sticky top-0 z-10 px-8 py-5 flex items-center justify-between transition-all duration-300 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex items-center">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors duration-300" />
          </div>
          <Input
            type="text"
            placeholder="Search across the system..."
            className="pl-11 pr-4 w-96 rounded-full border border-gray-800 bg-gray-900/50 hover:border-emerald-500/30 focus:bg-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 shadow-inner text-gray-200 placeholder-gray-500 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 border border-transparent hover:border-gray-700/50"
        >
          <Bell className="h-5 w-5 text-gray-400 hover:text-emerald-400 transition-colors" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
        </Button>

        <div className="h-8 w-px bg-gray-800" />

        <div className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-800/40 p-1.5 rounded-full pr-4 transition-all duration-300 border border-transparent hover:border-gray-700/50">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-300 group-hover:scale-105 border-2 border-gray-800">
            <User className="h-5 w-5 text-gray-100" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-200 leading-tight group-hover:text-emerald-400 transition-colors">Keerthan</span>
            <span className="text-xs font-semibold text-emerald-500">Clinical Admin</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 ml-1 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </header>
  )
}
