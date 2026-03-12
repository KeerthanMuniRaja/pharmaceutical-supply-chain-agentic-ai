'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Package,
  Search,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface InventoryItem {
  drug_id: string
  drug_name: string
  branch_id: string
  current_stock: number
  optimal_stock: number
  safe_stock: number
  demand_forecast: number
  status: 'normal' | 'low' | 'high' | 'critical'
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    setIsRefreshing(true)
    try {
      const mockInventory: InventoryItem[] = [
        {
          drug_id: 'MET001',
          drug_name: 'Metformin',
          branch_id: 'MAIN_BRANCH',
          current_stock: 450,
          optimal_stock: 500,
          safe_stock: 100,
          demand_forecast: 120,
          status: 'normal'
        },
        {
          drug_id: 'ASP001',
          drug_name: 'Aspirin',
          branch_id: 'MAIN_BRANCH',
          current_stock: 45,
          optimal_stock: 200,
          safe_stock: 40,
          demand_forecast: 80,
          status: 'critical'
        },
        {
          drug_id: 'INS001',
          drug_name: 'Insulin',
          branch_id: 'NORTH_BRANCH',
          current_stock: 320,
          optimal_stock: 300,
          safe_stock: 60,
          demand_forecast: 95,
          status: 'high'
        },
        {
          drug_id: 'AMX001',
          drug_name: 'Amoxicillin',
          branch_id: 'SOUTH_BRANCH',
          current_stock: 180,
          optimal_stock: 250,
          safe_stock: 50,
          demand_forecast: 110,
          status: 'low'
        },
        {
          drug_id: 'OME001',
          drug_name: 'Omeprazole',
          branch_id: 'EAST_BRANCH',
          current_stock: 275,
          optimal_stock: 300,
          safe_stock: 60,
          demand_forecast: 85,
          status: 'normal'
        }
      ]
      setInventory(mockInventory)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.drug_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.branch_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none text-xs px-2 py-0.5">Critical</Badge>
      case 'low':
        return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none shadow-none text-xs px-2 py-0.5">Low Stock</Badge>
      case 'high':
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none text-xs px-2 py-0.5">Oversupply</Badge>
      case 'normal':
        return <Badge className="bg-green-50 text-green-600 hover:bg-green-100 border-none shadow-none text-xs px-2 py-0.5">Optimal</Badge>
      default:
        return <Badge variant="outline" className="text-xs px-2 py-0.5 shadow-none border-gray-200">Unknown</Badge>
    }
  }

  const getStockPercentage = (current: number, optimal: number) => {
    return Math.round((current / optimal) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4">
        <div className="h-8 w-8 rounded-full border-b-2 border-l-2 border-gray-900 animate-spin"></div>
        <span className="text-gray-500 text-sm font-medium">Loading Inventory Data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            Global Inventory Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage clinical pharmaceutical stock levels.</p>
        </div>

        <Button 
          onClick={loadInventory}
          disabled={isRefreshing}
          variant="outline"
          className="text-sm h-8 px-3"
        >
          <RefreshCw className={`h-3 w-3 mr-2 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          Force Sync
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Total SKUs</p>
              <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-full">
              <Package className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Critical Action</p>
              <div className="text-2xl font-bold text-gray-900">{inventory.filter(i => i.status === 'critical').length}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Low Reserves</p>
              <div className="text-2xl font-bold text-gray-900">{inventory.filter(i => i.status === 'low').length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <TrendingDown className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Optimal Stock</p>
              <div className="text-2xl font-bold text-gray-900">{inventory.filter(i => i.status === 'normal').length}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search items or branches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm w-full text-sm"
        />
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map((item) => (
          <Card key={`${item.drug_id}-${item.branch_id}`} className="border border-gray-200 shadow-sm bg-white rounded-lg flex flex-col">
            <CardHeader className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {item.drug_name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5 text-gray-500">
                    {item.branch_id.replace('_', ' ')}
                  </CardDescription>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {/* Stock Level */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-gray-500">Current Stock</span>
                    <span className="text-gray-900">
                      {item.current_stock} <span className="text-gray-400 font-normal">units</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'critical' ? 'bg-red-500' :
                        item.status === 'low' ? 'bg-amber-500' :
                        item.status === 'high' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(getStockPercentage(item.current_stock, item.optimal_stock), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">Target Level</span>
                    <span className="text-sm font-semibold text-gray-900">{item.optimal_stock}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">Threshold</span>
                    <span className="text-sm font-semibold text-gray-900">{item.safe_stock}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">AI Forecast</span>
                    <span className="text-sm font-semibold text-gray-900">
                       {item.demand_forecast} <span className="text-gray-400 font-normal text-xs">/mo</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">Fill Rate</span>
                    <span className="text-sm font-semibold text-gray-900">{getStockPercentage(item.current_stock, item.optimal_stock)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <Card className="border border-gray-200 border-dashed shadow-none bg-gray-50 rounded-lg">
          <CardContent className="py-12 text-center flex flex-col items-center">
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
               <Package className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Items Found</h3>
            <p className="text-xs text-gray-500">Try adjusting your search query.</p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}