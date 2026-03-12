'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Bell,
  AlertCircle,
  HeartPulse,
  BrainCircuit,
  Wifi
} from 'lucide-react'
import { formatLastUpdated } from '@/lib/realtime'

interface Alert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  branch_id: string
  item_id: string
  alert_type: string
  current_stock?: number
  days_until_stockout?: number
  message: string
  recommended_action: string
  timestamp: string
  is_resolved: boolean
}

interface AlertSummary {
  total_alerts: number
  critical_count: number
  warning_count: number
  info_count: number
}

export default function AlertsPage() {

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertSummary>({
    total_alerts: 0,
    critical_count: 0,
    warning_count: 0,
    info_count: 0
  })
  const [aiInsights, setAiInsights] = useState<string>('')
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadAlerts = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/alerts')

      if (response.ok) {

        const data = await response.json()

        setAlerts(data.alerts || [])

        setSummary({
          total_alerts: data.total_alerts || 0,
          critical_count: data.critical_count || 0,
          warning_count: data.warning_count || 0,
          info_count: data.info_count || 0
        })

        setAiInsights(data.ai_insights || 'AI insights are not available')

      } else {

        const mockAlerts: Alert[] = [

          {
            severity: 'CRITICAL',
            branch_id: 'MAIN_BRANCH',
            item_id: 'Metformin',
            alert_type: 'STOCKOUT_RISK',
            current_stock: 45,
            days_until_stockout: 1.5,
            message: 'Critical stock shortage: 1.5 days of inventory remaining',
            recommended_action: 'URGENT_ORDER',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            is_resolved: false
          },

          {
            severity: 'WARNING',
            branch_id: 'NORTH_BRANCH',
            item_id: 'Insulin',
            alert_type: 'LOW_STOCK',
            current_stock: 120,
            days_until_stockout: 5.2,
            message: 'Low stock: 5.2 days of inventory remaining',
            recommended_action: 'ORDER_SOON',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            is_resolved: false
          },

          {
            severity: 'INFO',
            branch_id: 'SYSTEM',
            item_id: 'AI_MODEL',
            alert_type: 'FORECAST_COMPLETED',
            message: 'Demand forecast for next month completed for 50 medicines',
            recommended_action: 'REVIEW_RESULTS',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            is_resolved: false
          }

        ]

        setAlerts(mockAlerts)

        setSummary({
          total_alerts: mockAlerts.length,
          critical_count: mockAlerts.filter(a => a.severity === 'CRITICAL').length,
          warning_count: mockAlerts.filter(a => a.severity === 'WARNING').length,
          info_count: mockAlerts.filter(a => a.severity === 'INFO').length
        })

        setAiInsights('Based on current alert metrics, immediate procurement is advised for the MAIN_BRANCH to mitigate the active stockout risk for Metformin. Overall system health remains stable with only isolated warnings.')

      }

    } catch (error) {
      console.error('Failed to load alerts:', error)
      setAiInsights('AI insights are not available')
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 20000)
    return () => clearInterval(interval)
  }, [loadAlerts])

  useEffect(() => {
    filterAlerts()
  }, [alerts, severityFilter, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const filterAlerts = () => {

    let filtered = alerts

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter)
    }

    if (searchQuery) {

      filtered = filtered.filter(alert =>
        alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.item_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.branch_id.toLowerCase().includes(searchQuery.toLowerCase())
      )

    }

    setFilteredAlerts(filtered)

  }

  const resolveAlert = (alertIndex: number) => {
    const updatedAlerts = [...alerts]
    updatedAlerts[alertIndex].is_resolved = true
    setAlerts(updatedAlerts)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-b-2 border-l-2 border-[#10B981] animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Bell className="h-6 w-6 text-[#10B981] animate-pulse" />
          </div>
        </div>
        <span className="text-[#064E3B] font-medium tracking-wide animate-pulse">Scanning Alert Protocols...</span>
      </div>
    )
  }

  return (

    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-[#064E3B] leading-tight flex items-center">
            Alert Monitoring Center
            <span className="ml-3 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
              Live Feed
            </span>
          </h1>
          <p className="text-[#059669] mt-2 font-medium">Manage and track autonomous clinical supply chain alerts.</p>
        </div>

        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md">
              <Wifi className="h-3 w-3 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Updated {formatLastUpdated(lastUpdated)}</span>
            </div>
          )}
          <Button 
            onClick={loadAlerts}
            className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-md hover:shadow-lg transition-all rounded-xl border-none h-10 px-5"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Feed
          </Button>
        </div>
      </div>


      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up delay-100">

        <Card className="card-hover-effect border border-[#E2E8F0] shadow-sm bg-white rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#064E3B]">{summary.total_alerts}</div>
          </CardContent>
        </Card>

        <Card className="card-hover-effect border border-rose-200 shadow-sm bg-rose-50/30 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-rose-500 uppercase tracking-wider">Critical Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-600">{summary.critical_count}</div>
          </CardContent>
        </Card>

        <Card className="card-hover-effect border border-amber-200 shadow-sm bg-amber-50/30 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-amber-500 uppercase tracking-wider">Warning Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600">{summary.warning_count}</div>
          </CardContent>
        </Card>

        <Card className="card-hover-effect border border-[#A7F3D0] shadow-sm bg-[#ECFDF5]/50 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#059669] uppercase tracking-wider">Info & Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#10B981]">{summary.info_count}</div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up delay-200">
        
        {/* Main Alert List */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#059669]/60 h-4 w-4 group-focus-within:text-[#10B981] transition-colors" />
              <Input
                placeholder="Search alerts by item or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-[#A7F3D0] rounded-xl focus:ring-[#10B981] bg-white shadow-sm"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px] h-11 border-[#A7F3D0] rounded-xl focus:ring-[#10B981] bg-white shadow-sm font-medium text-[#064E3B]">
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical Only</SelectItem>
                <SelectItem value="WARNING">Warnings</SelectItem>
                <SelectItem value="INFO">Information</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card className="border border-[#A7F3D0]/50 bg-[#F0FDF4] shadow-sm rounded-2xl">
                <CardContent className="py-16 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-[#10B981]/50 mb-4" />
                  <h3 className="text-lg font-bold text-[#064E3B]">No Active Alerts</h3>
                  <p className="text-[#059669] font-medium">The system is operating optimally with no pressing issues.</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert, idx) => (
                <Card key={idx} className={`shadow-sm transition-all duration-300 hover:shadow-md border-l-4 rounded-xl ${
                  alert.severity === 'CRITICAL' ? 'border-l-rose-500 border-rose-100 bg-white' : 
                  alert.severity === 'WARNING' ? 'border-l-amber-500 border-amber-100 bg-white' : 
                  'border-l-[#10B981] border-[#E2E8F0] bg-white'
                }`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                       <Badge className={`${
                        alert.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' : 
                        alert.severity === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' : 
                        'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0] hover:bg-[#D1FAE5]'
                       } font-bold tracking-wider uppercase text-[10px] px-2.5 py-0.5 shadow-sm`}>
                        {alert.severity}
                       </Badge>
                       <span className="text-xs font-semibold flex items-center text-[#64748B]">
                         <Clock className="w-3 h-3 mr-1" />
                         {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#064E3B] mb-2">{alert.message}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs font-semibold px-2.5 py-1 rounded-md">
                        Branch: <span className="text-[#064E3B]">{alert.branch_id.replace('_', ' ')}</span>
                      </span>
                      <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs font-semibold px-2.5 py-1 rounded-md">
                        Item: <span className="text-[#064E3B]">{alert.item_id}</span>
                      </span>
                      {alert.days_until_stockout && (
                        <span className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-md">
                          Est. Stockout: {alert.days_until_stockout} days
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-4 mt-2">
                      <div className="flex items-center">
                        <HeartPulse className="w-4 h-4 text-[#10B981] mr-2" />
                        <span className="text-sm font-semibold text-[#059669]">
                          AI Suggestion: <span className="font-bold underline decoration-[#A7F3D0] underline-offset-2">{alert.recommended_action.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-[#A7F3D0] text-[#059669] hover:bg-[#ECFDF5] hover:text-[#10B981] font-bold shadow-sm"
                        onClick={() => resolveAlert(idx)}
                        disabled={alert.is_resolved}
                      >
                        {alert.is_resolved ? 'Resolved' : 'Mark Reviewed'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div>
          <Card className="sticky top-24 border border-[#065F46]/20 shadow-lg bg-gradient-to-br from-[#064E3B] to-[#047857] text-white rounded-2xl overflow-hidden group">
            <div className="absolute opacity-10 top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#10B981] rounded-full mix-blend-screen filter blur-[60px] opacity-40 animate-pulse" />
            
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold tracking-wide">
                <AlertCircle className="h-6 w-6 mr-3 text-[#A7F3D0]" />
                Intelligence Brief
              </CardTitle>
              <CardDescription className="text-[#A7F3D0] text-sm font-medium">
                Automated synthesis of current network anomalies.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="bg-[#022C22]/40 backdrop-blur-md border border-[#065F46] rounded-xl p-5 text-sm leading-relaxed text-[#ECFDF5] font-medium shadow-inner">
                {aiInsights}
              </div>
              <Button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-sm transition-all rounded-xl font-bold">
                Generate Deep Report
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>

  )

}