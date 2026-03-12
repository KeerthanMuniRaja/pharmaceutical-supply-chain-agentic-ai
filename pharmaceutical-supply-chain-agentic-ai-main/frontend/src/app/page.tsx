'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  ShieldCheck,
  Wifi
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { formatLastUpdated } from '@/lib/realtime'

interface KPIMetrics {
  total_forecast_accuracy: number
  inventory_turnover: number
  delivery_on_time: number
  stockout_reduction: number
  cost_savings: number
  alerts_critical: number
  alerts_warning: number
  system_health: string
}

export default function Dashboard() {

  const [metrics, setMetrics] = useState<KPIMetrics>({
    total_forecast_accuracy: 0,
    inventory_turnover: 0,
    delivery_on_time: 0,
    stockout_reduction: 0,
    cost_savings: 0,
    alerts_critical: 0,
    alerts_warning: 0,
    system_health: 'healthy'
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [liveTime, setLiveTime] = useState('')

  const loadMetrics = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/v1/dashboard/kpis')

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        setMetrics({
          total_forecast_accuracy: 94.2,
          inventory_turnover: 12.8,
          delivery_on_time: 97.5,
          stockout_reduction: 78.3,
          cost_savings: 245000,
          alerts_critical: 3,
          alerts_warning: 12,
          system_health: 'healthy'
        })
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [])

  useEffect(() => {
    loadMetrics()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [loadMetrics])

  // Live clock
  useEffect(() => {
    const tick = () => setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  const kpiCards = [
    {
      title: 'Forecast Accuracy',
      value: `${metrics.total_forecast_accuracy}%`,
      trend: '+2.4%',
      isPositive: true,
      description: 'Demand models accuracy',
      icon: TrendingUp,
    },
    {
      title: 'Inventory Turnover',
      value: `${metrics.inventory_turnover}`,
      trend: '+0.8',
      isPositive: true,
      description: 'Cycles per year',
      icon: Package,
    },
    {
      title: 'On-Time Delivery',
      value: `${metrics.delivery_on_time}%`,
      trend: '+1.2%',
      isPositive: true,
      description: 'Timely supply rate',
      icon: Truck,
    },
    {
      title: 'Stockout Reduction',
      value: `${metrics.stockout_reduction}%`,
      trend: '-5.4%',
      isPositive: true,
      description: 'Shortage incident drop',
      icon: CheckCircle,
    }
  ]

  const alerts = [
    {
      type: 'critical',
      title: 'Urgent Stock Shortage',
      message: 'Metformin stock at the central branch is less than 2 days',
      time: '10 mins ago',
      branch: 'Central Branch',
      dotColor: 'bg-red-500'
    },
    {
      type: 'warning',
      title: 'Delivery Delay',
      message: 'Delivery route to the north branch delayed by 2 hours',
      time: '30 mins ago',
      branch: 'North Branch',
      dotColor: 'bg-amber-500'
    },
    {
      type: 'info',
      title: 'Demand Forecast Completed',
      message: 'Next month\'s demand forecast calculated for 50 medicines',
      time: '1 hour ago',
      branch: 'System',
      dotColor: 'bg-blue-500'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4">
        <div className="h-8 w-8 rounded-full border-b-2 border-l-2 border-emerald-400 animate-spin shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        <span className="text-gray-400 text-sm font-medium">Loading Dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 bg-gray-950 min-h-screen text-gray-100 p-6 rounded-2xl relative overflow-hidden">
      {/* Background Gradients for Premium Look */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 tracking-tight flex items-center">
            System Overview
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time metrics and supply chain performance.</p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2 relative z-10">
          {/* Live time */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-md shadow-sm">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-mono font-semibold text-gray-300">{liveTime}</span>
          </div>

          {/* System health */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-md shadow-sm">
            <div className={`h-2 w-2 rounded-full ${metrics.system_health === 'healthy' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              {metrics.system_health === 'healthy' ? 'System Normal' : 'Degraded'}
            </span>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">Updated {formatLastUpdated(lastUpdated)}</span>
            </div>
          )}

          <Button
            onClick={loadMetrics}
            disabled={isRefreshing}
            variant="outline"
            className="text-sm h-8 px-3 bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <RefreshCw className={`h-3 w-3 mr-2 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>


      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={idx} className="border border-gray-800 shadow-xl bg-gray-900/60 backdrop-blur-md rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold tracking-wider text-gray-400 uppercase">{card.title}</CardTitle>
                  <Icon className="h-5 w-5 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-baseline space-x-2 mt-1">
                  <div className="text-3xl font-extrabold text-white">
                    {card.value}
                  </div>
                  <div className={`flex items-center text-xs font-bold ${card.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {card.isPositive ? <ArrowUpRight className="h-4 w-4 mr-0.5" /> : <ArrowDownRight className="h-4 w-4 mr-0.5" />}
                    {card.trend}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Cost Savings Card */}
        <Card className="lg:col-span-2 border border-gray-800 shadow-2xl bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="p-5 border-b border-gray-800/80">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-emerald-400" />
                  Cumulative Financial Impact
                </CardTitle>
                <CardDescription className="text-xs text-gray-400 mt-1">
                  Total savings generated from optimized operations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div>
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 tracking-tight">
                  ${metrics.cost_savings.toLocaleString()}
                </div>
                <div className="flex items-center text-sm font-semibold text-gray-400 mt-3">
                  <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" /> 
                  Projected ~$300k this quarter
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none bg-gray-800/50 p-5 rounded-xl border border-gray-700/50">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Route Gen</div>
                  <div className="text-xl font-extrabold text-white">+$42.1k</div>
                </div>
                <div className="flex-1 md:flex-none bg-gray-800/50 p-5 rounded-xl border border-gray-700/50">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Stock Ovg</div>
                  <div className="text-xl font-extrabold text-white">+$84.3k</div>
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>

        {/* Priority Alerts Feed */}
        <Card className="border border-gray-800 shadow-2xl bg-gray-900/60 backdrop-blur-xl flex flex-col h-full rounded-2xl overflow-hidden relative">
          <CardHeader className="p-5 border-b border-gray-800/80 bg-gray-900/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                Priority Alerts
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                {alerts.length} New
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto hidden-scrollbar">
            <div className="divide-y divide-gray-800">
              {alerts.map((alert, idx) => (
                <div key={idx} className="p-5 hover:bg-gray-800/50 transition-colors group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-emerald-500 transition-colors" />
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] opacity-80 ${alert.dotColor}`} />
                      <h4 className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">{alert.title}</h4>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap ml-2">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-400 mb-2.5 leading-relaxed ml-5.5 pl-1">{alert.message}</p>
                  <div className="flex items-center text-xs font-semibold text-gray-500 ml-5.5 pl-1 group-hover:text-gray-400 transition-colors">
                    <MapPin className="h-3 w-3 mr-1.5 text-gray-500" />
                    {alert.branch}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}