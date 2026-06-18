'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, MapPin, Building2, Home, Plus, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { geographyService } from '@/lib/services'
import api from '@/lib/api'
import Swal from 'sweetalert2'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'

type Level = 'region' | 'departement' | 'phc' | 'chw'

interface BaseNode {
  id: number
  name: string
  code: string
  level: Level
  parentId?: number
  isExpanded: boolean
  childrenLoaded: boolean
  children: BaseNode[]
}

const typeIcons = {
  region: <Building2 className="h-4 w-4" />,
  departement: <MapPin className="h-4 w-4" />,
  phc: <Plus className="h-4 w-4 rotate-45" />,
  chw: <Home className="h-4 w-4" />,
}

const typeColors = {
  region: 'bg-primary/20 text-primary',
  departement: 'bg-info/20 text-blue-400',
  phc: 'bg-warning/20 text-amber-400',
  chw: 'bg-success/20 text-emerald-400',
}

function NodeItem({
  node, depth, onToggle, onCreateChild
}: {
  node: BaseNode, depth: number,
  onToggle: (node: BaseNode) => void,
  onCreateChild: (node: BaseNode) => void
}) {
  const t = useTranslations('Hierarchy')
  return (
    <div className="flex flex-col text-white">
      <div 
        className={cn(
          "flex items-center justify-between p-3 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer",
          depth === 0 ? "bg-white/5 font-semibold" : ""
        )}
        style={{ paddingLeft: `${depth * 2 + 1}rem` }}
        onClick={() => onToggle(node)}
      >
        <div className="flex items-center gap-3">
          {node.level !== 'chw' ? (
            <button className="p-1 hover:bg-white/10 rounded">
              {node.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <span className="w-6" />}
          
          <Badge variant="outline" className={cn('px-1.5 py-0.5 border-white/20', typeColors[node.level])}>
            {typeIcons[node.level]}
          </Badge>
          <span>{node.name} <span className="text-white/40 text-xs ml-2">({node.code})</span></span>
        </div>

        {node.level !== 'chw' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 border border-white/20 hover:bg-white/10 text-xs px-2"
            onClick={(e) => { e.stopPropagation(); onCreateChild(node) }}
          >
            <Plus className="h-3 w-3 mr-1" />
            {node.level === 'region' ? t('addDept') : node.level === 'departement' ? t('addPHC') : t('addCHW')}
          </Button>
        )}
      </div>

      {node.isExpanded && (
        <div className="flex flex-col">
          {!node.childrenLoaded && (
            <div className="p-4 text-center text-white/50 text-sm flex items-center justify-center gap-2" style={{ paddingLeft: `${(depth + 1) * 2 + 1}rem` }}>
              <Loader2 className="h-4 w-4 animate-spin" /> {t('loading')}
            </div>
          )}
          {node.childrenLoaded && node.children.length === 0 && (
            <div className="p-4 text-white/40 text-sm italic" style={{ paddingLeft: `${(depth + 1) * 2 + 1}rem` }}>
              {t('noChildren')}
            </div>
          )}
          {node.childrenLoaded && node.children.map(child => (
            <NodeItem key={`${child.level}-${child.id}`} node={child} depth={depth + 1} onToggle={onToggle} onCreateChild={onCreateChild} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HierarchyPage() {
  const t = useTranslations('Hierarchy')
  const [regions, setRegions] = useState<BaseNode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const fetchRoot = useCallback(async () => {
    setLoading(true)
    try {
      const res = await geographyService.listRegions()
      const items = res.data.items || []
      setRegions(items.map((r: any) => ({
        id: r.id_region,
        name: r.nom_region,
        code: r.code || `REG-${r.id_region}`,
        level: 'region',
        isExpanded: false,
        childrenLoaded: false,
        children: []
      })))
    } catch {
      Swal.fire({ icon: 'error', title: t('error'), text: t('loadError'), background: '#0D1B2E', color: '#fff' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoot() }, [fetchRoot])

  const loadChildren = async (node: BaseNode): Promise<BaseNode[]> => {
    try {
      let endpoint = ''
      let mapper = (item: any): BaseNode => ({ id: 0, name: '', code: '', level: 'chw', isExpanded: false, childrenLoaded: false, children: [] })
      
      if (node.level === 'region') {
        endpoint = `/departements?region_id=${node.id}&page_size=100`
        mapper = (d: any) => ({ id: d.id_dpt, name: d.nom_dpt, code: d.code || `DPT-${d.id_dpt}`, level: 'departement', parentId: node.id, isExpanded: false, childrenLoaded: false, children: [] })
      } else if (node.level === 'departement') {
        endpoint = `/phcs?dpt_id=${node.id}&page_size=100`
        mapper = (p: any) => ({ id: p.id_phc, name: p.nom_phc, code: p.code || `PHC-${p.id_phc}`, level: 'phc', parentId: node.id, isExpanded: false, childrenLoaded: false, children: [] })
      } else if (node.level === 'phc') {
        endpoint = `/chws?phc_id=${node.id}&page_size=100`
        mapper = (c: any) => ({ id: c.id_chw, name: `${c.nom} ${c.prenom || ''}`.trim(), code: c.code || `CHW-${c.id_chw}`, level: 'chw', parentId: node.id, isExpanded: false, childrenLoaded: false, children: [] })
      } else {
        return []
      }

      const res = await api.get(endpoint)
      return (res.data.items || []).map(mapper)
    } catch {
      Swal.fire({ icon: 'error', title: t('error'), text: t('childLoadError'), background: '#0D1B2E', color: '#fff' })
      return []
    }
  }

  const updateNodeInTree = (nodes: BaseNode[], targetId: number, targetLevel: Level, updater: (n: BaseNode) => BaseNode): BaseNode[] => {
    return nodes.map(n => {
      if (n.id === targetId && n.level === targetLevel) return updater({ ...n })
      if (n.children.length > 0) return { ...n, children: updateNodeInTree(n.children, targetId, targetLevel, updater) }
      return n
    })
  }

  const handleToggle = async (node: BaseNode) => {
    if (node.level === 'chw') return

    if (node.isExpanded) {
      setRegions(prev => updateNodeInTree(prev, node.id, node.level, n => ({ ...n, isExpanded: false })))
      return
    }

    // Expand and load if needed
    setRegions(prev => updateNodeInTree(prev, node.id, node.level, n => ({ ...n, isExpanded: true })))
    
    if (!node.childrenLoaded) {
      const children = await loadChildren(node)
      setRegions(prev => updateNodeInTree(prev, node.id, node.level, n => ({ ...n, children, childrenLoaded: true })))
    }
  }

  const handleCreateRoot = async () => {
    const { value: formValues } = await Swal.fire({
      title: t('createRegion'),
      html:
        '<input id="swal-nom" class="swal2-input" placeholder="' + t('regionName') + '" style="background:#1A2F45;color:#fff;border:1px solid rgba(255,255,255,0.2)">' +
        '<input id="swal-code" class="swal2-input" placeholder="' + t('codeOptional') + '" style="background:#1A2F45;color:#fff;border:1px solid rgba(255,255,255,0.2)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t('createBtn'),
      cancelButtonText: t('cancel'),
      background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8',
      preConfirm: () => {
        return {
          nom_region: (document.getElementById('swal-nom') as HTMLInputElement).value,
          code: (document.getElementById('swal-code') as HTMLInputElement).value
        }
      }
    })

    if (formValues && formValues.nom_region) {
      try {
        await api.post('/regions', { nom_region: formValues.nom_region, code: formValues.code || undefined })
        Swal.fire({ icon: 'success', title: t('createSuccess'), timer: 1500, showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2' })
        fetchRoot()
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('createError'), background: '#0D1B2E', color: '#E2EAF2' })
      }
    }
  }

  const handleCreateChild = async (node: BaseNode) => {
    let title = ''
    let endpoint = ''
    let payloadBuilder = (v: any) => ({})
    
    if (node.level === 'region') {
      title = t('newDeptIn', {name: node.name})
      endpoint = '/departements'
      payloadBuilder = (v: any) => ({ nom_dpt: v.nom, code: v.code || undefined, id_region: node.id })
    } else if (node.level === 'departement') {
      title = t('newPhcIn', {name: node.name})
      endpoint = '/phcs'
      payloadBuilder = (v: any) => ({ nom_phc: v.nom, code: v.code || undefined, id_dpt: node.id })
    } else if (node.level === 'phc') {
      title = t('newChwIn', {name: node.name})
      endpoint = '/chws'
      payloadBuilder = (v: any) => ({ nom: v.nom, prenom: v.prenom || '', code: v.code || undefined, id_phc: node.id, actif: true })
    }

    const { value: formValues } = await Swal.fire({
      title,
      html:
        '<input id="swal-nom" class="swal2-input" placeholder="' + (node.level === 'phc' ? t('lastName') : t('nameLabel')) + '" style="background:#1A2F45;color:#fff;border:1px solid rgba(255,255,255,0.2)">' +
        (node.level === 'phc' ? '<input id="swal-prenom" class="swal2-input" placeholder="' + t('firstName') + '" style="background:#1A2F45;color:#fff;border:1px solid rgba(255,255,255,0.2)">' : '') +
        '<input id="swal-code" class="swal2-input" placeholder="' + t('codeOptional') + '" style="background:#1A2F45;color:#fff;border:1px solid rgba(255,255,255,0.2)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t('createBtn'),
      cancelButtonText: t('cancel'),
      background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8',
      preConfirm: () => {
        return {
          nom: (document.getElementById('swal-nom') as HTMLInputElement).value,
          prenom: node.level === 'phc' ? (document.getElementById('swal-prenom') as HTMLInputElement).value : undefined,
          code: (document.getElementById('swal-code') as HTMLInputElement).value
        }
      }
    })

    if (formValues && formValues.nom) {
      try {
        await api.post(endpoint, payloadBuilder(formValues))
        Swal.fire({ icon: 'success', title: t('createSuccess'), timer: 1500, showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2' })
        
        // Reload children for this node
        const children = await loadChildren(node)
        setRegions(prev => updateNodeInTree(prev, node.id, node.level, n => ({ ...n, children, childrenLoaded: true, isExpanded: true })))
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('createError'), background: '#0D1B2E', color: '#E2EAF2' })
      }
    }
  }

  const filteredRegions = regions.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-white/70 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={handleCreateRoot} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> {t('createRegion')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input 
          placeholder={t('searchPlaceholder')} 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-card border-white/20 text-white focus:border-white w-full sm:w-1/3" 
        />
      </div>

      <Card className="border-white/20 bg-card overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-4">
          <CardTitle className="text-lg text-white">{t('cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 gap-3 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>{t('loading')}</span>
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/50 gap-3">
              <MapPin className="h-10 w-10 opacity-30" />
              <p>{t('noRegions')}</p>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {filteredRegions.map(region => (
                <NodeItem 
                  key={`region-${region.id}`} 
                  node={region} 
                  depth={0} 
                  onToggle={handleToggle} 
                  onCreateChild={handleCreateChild} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
