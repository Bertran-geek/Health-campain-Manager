'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, MapPin, Building2, Home, Plus, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { mockCountries, mockRegions, mockDistricts, mockHealthAreas, mockVillages } from '@/lib/mock-data'

interface TreeNode {
  id: string
  name: string
  code: string
  population: number
  type: 'country' | 'region' | 'district' | 'health_area' | 'village'
  children?: TreeNode[]
  data?: Record<string, unknown>
}

function buildHierarchyTree(): TreeNode[] {
  return mockCountries.map(country => ({
    id: country.id,
    name: country.name,
    code: country.code,
    population: country.population,
    type: 'country' as const,
    children: mockRegions
      .filter(r => r.countryId === country.id)
      .map(region => ({
        id: region.id,
        name: region.name,
        code: region.code,
        population: region.population,
        type: 'region' as const,
        children: mockDistricts
          .filter(d => d.regionId === region.id)
          .map(district => ({
            id: district.id,
            name: district.name,
            code: district.code,
            population: district.population,
            type: 'district' as const,
            data: { healthFacilitiesCount: district.healthFacilitiesCount },
            children: mockHealthAreas
              .filter(ha => ha.districtId === district.id)
              .map(healthArea => ({
                id: healthArea.id,
                name: healthArea.name,
                code: healthArea.code,
                population: healthArea.population,
                type: 'health_area' as const,
                data: { healthCenterName: healthArea.healthCenterName },
                children: mockVillages
                  .filter(v => v.healthAreaId === healthArea.id)
                  .map(village => ({
                    id: village.id,
                    name: village.name,
                    code: village.code,
                    population: village.population,
                    type: 'village' as const,
                    data: {
                      householdsCount: village.householdsCount,
                      childrenUnder5: village.childrenUnder5,
                      accessibility: village.accessibility,
                    },
                  })),
              })),
          })),
      })),
  }))
}

function TreeItem({ 
  node, 
  level = 0, 
  onSelect 
}: { 
  node: TreeNode
  level?: number
  onSelect: (node: TreeNode) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = node.children && node.children.length > 0

  const typeColors = {
    country: 'bg-primary/20 text-primary',
    region: 'bg-info/20 text-info',
    district: 'bg-success/20 text-success',
    health_area: 'bg-warning/20 text-warning',
    village: 'bg-accent/20 text-accent',
  }

  const typeIcons = {
    country: <Building2 className="h-4 w-4" />,
    region: <MapPin className="h-4 w-4" />,
    district: <MapPin className="h-4 w-4" />,
    health_area: <Plus className="h-4 w-4 rotate-45" />,
    village: <Home className="h-4 w-4" />,
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
          'text-sm'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Badge variant="outline" className={cn('px-1.5 py-0.5', typeColors[node.type])}>
          {typeIcons[node.type]}
        </Badge>
        <span className="font-medium text-foreground">{node.name}</span>
        <span className="text-muted-foreground text-xs ml-auto">
          {node.population.toLocaleString()}
        </span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children?.map(child => (
            <TreeItem key={child.id} node={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HierarchyPage() {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const hierarchyTree = buildHierarchyTree()

  const getTypeLabel = (type: TreeNode['type']) => {
    const labels = {
      country: 'Country',
      region: 'Region',
      district: 'District',
      health_area: 'Health Area',
      village: 'Village',
    }
    return labels[type]
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Administrative Hierarchy</h2>
          <p className="text-muted-foreground">
            Manage geographic units from country to village level
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Add a new geographic unit to the hierarchy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Location Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="health_area">Health Area</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter location name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="Enter location code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="population">Population</Label>
                <Input id="population" type="number" placeholder="Enter population" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRegions.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Create Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-transparent focus:border-primary"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="country">Countries</SelectItem>
            <SelectItem value="region">Regions</SelectItem>
            <SelectItem value="district">Districts</SelectItem>
            <SelectItem value="health_area">Health Areas</SelectItem>
            <SelectItem value="village">Villages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hierarchy Tree */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Location Tree</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] px-4 pb-4">
              {hierarchyTree.map(node => (
                <TreeItem 
                  key={node.id} 
                  node={node} 
                  onSelect={setSelectedNode} 
                />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Details Panel */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedNode ? selectedNode.name : 'Select a Location'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-6">
                {/* Location Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="text-lg font-semibold text-foreground">
                      {getTypeLabel(selectedNode.type)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Code</div>
                    <div className="text-lg font-semibold text-foreground">
                      {selectedNode.code}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Population</div>
                    <div className="text-lg font-semibold text-foreground">
                      {selectedNode.population.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Sub-units</div>
                    <div className="text-lg font-semibold text-foreground">
                      {selectedNode.children?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Additional Data */}
                {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Additional Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedNode.data).map(([key, value]) => (
                        <div key={key} className="p-3 rounded-lg border border-border">
                          <div className="text-xs text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm font-medium text-foreground mt-1">
                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Children Table */}
                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Sub-locations ({selectedNode.children.length})
                    </h4>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Population</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedNode.children.map(child => (
                            <TableRow 
                              key={child.id}
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() => setSelectedNode(child)}
                            >
                              <TableCell className="font-medium">{child.name}</TableCell>
                              <TableCell>{child.code}</TableCell>
                              <TableCell className="text-right">
                                {child.population.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="outline">Edit Location</Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a location from the tree to view details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
