'use client'

import { useState } from 'react'
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, Target, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react'

interface ForecastPoint {
  date: string
  predicted: number
  actual?: number
  lower_bound: number
  upper_bound: number
}

interface ForecastApiPoint {
  date: string
  yhat?: number
  yhat_lower?: number
  yhat_upper?: number
  actual?: number
  predicted?: number
  lower_bound?: number
  upper_bound?: number
}

interface ForecastApiResponse {
  forecast: ForecastApiPoint[]
  metrics: {
    mape: number | null
    rmse: number | null
    mae: number | null
  }
  confidence_interval?: {
    lower?: number
    upper?: number
  }
  model: string
  status: string
  message?: string
}

interface ForecastData {
  forecast: ForecastPoint[]
  metrics: {
    mape: number | null
    rmse: number | null
    mae: number | null
  }
  model: string
  status: string
  message?: string
}

export default function ForecastingPage() {

  const [selectedDrug, setSelectedDrug] = useState('')
  const [horizonDays, setHorizonDays] = useState(30)
  const [model, setModel] = useState('prophet')
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const drugs = [
    'Metformin', 'Aspirin', 'Insulin', 'Amoxicillin', 'Omeprazole',
    'Losartan', 'Simvastatin', 'Albuterol', 'Warfarin', 'Furosemide'
  ]

  const normalizeForecast = (data: ForecastApiResponse): ForecastData => ({
    forecast: (data.forecast || []).map((point) => ({
      date: point.date,
      predicted: point.yhat ?? point.predicted ?? 0,
      actual: point.actual,
      lower_bound: point.yhat_lower ?? point.lower_bound ?? 0,
      upper_bound: point.yhat_upper ?? point.upper_bound ?? 0
    })),
    metrics: {
      mape: data.metrics?.mape ?? null,
      rmse: data.metrics?.rmse ?? null,
      mae: data.metrics?.mae ?? null
    },
    model: data.model,
    status: data.status,
    message: data.message
  })

  const formatMetric = (value: number | null, suffix = '') => {
    if (value === null || value === undefined) return `-${suffix}`
    return `${value.toFixed(2)}${suffix}`
  }

  const runForecast = async () => {

    if (!selectedDrug) {
      setError('Please select a drug')
      return
    }

    setIsLoading(true)
    setError('')

    try {

      const response = await fetch('/api/v1/forecast/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: 'branch',
          entity_id: 'MAIN_BRANCH',
          item_id: selectedDrug,
          horizon_days: horizonDays,
          model: model
        })
      })

      if (!response.ok) {
        setError('Error retrieving forecast')
        setForecastData(null)
        return
      }

      const apiData: ForecastApiResponse = await response.json()
      const normalized = normalizeForecast(apiData)

      if (normalized.status !== 'success' || !normalized.forecast.length) {
        setError(apiData.message || 'No valid forecast returned')
        setForecastData(null)
        return
      }

      setForecastData(normalized)

    } catch (err) {

      console.error('Forecast error:', err)
      setError('Server connection error')
      setForecastData(null)

    } finally {

      setIsLoading(false)

    }

  }

  return (

    <div className="space-y-6 max-w-[1400px] mx-auto pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            Demand Forecasting
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Deploy advanced learning models to anticipate market requirements with high precision.
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
        <CardHeader className="p-5 border-b border-gray-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
            <Target className="h-4 w-4 mr-2 text-gray-500" />
            Simulation Parameters
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Configure the parameters for your clinical demand forecast.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                Inventory Item
              </label>
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select item..." />
                </SelectTrigger>
                <SelectContent>
                  {drugs.map(drug => (
                    <SelectItem key={drug} value={drug}>{drug}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                Projection Horizon
              </label>
              <Select value={horizonDays.toString()} onValueChange={(value) => setHorizonDays(parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                Algorithm Selection
              </label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prophet">Prophet (AI)</SelectItem>
                  <SelectItem value="lstm">LSTM Neural Net</SelectItem>
                  <SelectItem value="moving_average">Moving Baseline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runForecast}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Run Forecast
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {forecastData && (
        <div className="space-y-6">
          
          <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="p-5 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                Forecasted Trajectory vs Historical
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={forecastData.forecast}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickMargin={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0F172A', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#059669" 
                      strokeWidth={3}
                      dot={false}
                      name="Forecast" 
                      activeDot={{ r: 6, fill: '#059669', stroke: 'white', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#94A3B8" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#94A3B8' }}
                      name="Historical" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="upper_bound" 
                      stroke="#A7F3D0" 
                      strokeDasharray="4 4" 
                      dot={false}
                      name="Upper Bound" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lower_bound" 
                      stroke="#A7F3D0" 
                      strokeDasharray="4 4" 
                      dot={false}
                      name="Lower Bound" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Model Accuracy (MAPE)</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMetric(forecastData.metrics.mape, '%')}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-full">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">RMSE</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMetric(forecastData.metrics.rmse)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-full">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Mean Absolute Error</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMetric(forecastData.metrics.mae)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-full">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}

    </div>
  )
}