import { useEffect, useId, useRef, useState } from 'react'
import { Download, Expand, Minimize2 } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { loadUiPreferences } from '../lib/storage.js'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function availableChartTypes(visualization) {
  if (!visualization || ['table', 'kpi'].includes(visualization.type)) return []
  const data = visualization.data || []
  return visualization.type === 'line'
    ? ['line', 'bar']
    : ['bar', ...(data.length <= 8 ? ['pie'] : [])]
}

function preferredChartType(visualization) {
  if (!visualization) return undefined
  const preference = loadUiPreferences().defaultChartType
  const supported = availableChartTypes(visualization)
  return preference !== 'auto' && supported.includes(preference) ? preference : visualization.type
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><p className="mb-1 font-medium text-muted">{label ?? payload[0].name}</p>{payload.map((item) => <p className="text-ink" key={item.dataKey}>{item.name}: {number.format(Number(item.value))}</p>)}</div>
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ChartRenderer({ visualization }) {
  const chartDescriptionId = useId()
  const chartRef = useRef(null)
  const dialogRef = useRef(null)
  const expandButtonRef = useRef(null)
  const [chartType, setChartType] = useState(() => preferredChartType(visualization))
  const [expanded, setExpanded] = useState(false)
  const [exportError, setExportError] = useState('')
  const axisColor = 'var(--muted)'
  const gridColor = 'var(--line)'

  useEffect(() => {
    setChartType(preferredChartType(visualization))
    setExpanded(false)
    setExportError('')
  }, [visualization])

  useEffect(() => {
    if (!expanded) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    expandButtonRef.current?.focus()
    const handleDialogKeys = (event) => {
      if (event.key === 'Escape') {
        setExpanded(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleDialogKeys)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleDialogKeys)
      expandButtonRef.current?.focus()
    }
  }, [expanded])

  if (!visualization) return null
  if (visualization.type === 'table') return <p className="text-sm text-muted">A chart is not useful for this result. See the table below.</p>
  if (visualization.type === 'kpi') {
    return <div className="surface-card border-accent-line bg-accent-soft p-6"><p className="text-xs font-semibold text-accent">{visualization.label || visualization.yAxis}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{number.format(visualization.value ?? 0)}</p><p className="mt-1 text-xs text-muted">{visualization.title}</p></div>
  }

  const data = visualization.data || []
  if (!data.length) return <p className="text-sm text-muted">There is not enough data to draw a chart.</p>
  const chartTypes = availableChartTypes(visualization)

  async function exportPng() {
    setExportError('')
    const svg = chartRef.current?.querySelector('svg')
    if (!svg) {
      setExportError('The chart is still rendering. Try again in a moment.')
      return
    }
    try {
      const bounds = svg.getBoundingClientRect()
      const width = Math.max(1, Math.round(bounds.width))
      const height = Math.max(1, Math.round(bounds.height))
      const clonedSvg = svg.cloneNode(true)
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clonedSvg.setAttribute('width', String(width))
      clonedSvg.setAttribute('height', String(height))
      const rootStyle = getComputedStyle(document.documentElement)
      for (const name of ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--muted', '--line']) {
        clonedSvg.style.setProperty(name, rootStyle.getPropertyValue(name).trim())
      }
      const svgBlob = new Blob([new XMLSerializer().serializeToString(clonedSvg)], { type: 'image/svg+xml;charset=utf-8' })
      const objectUrl = URL.createObjectURL(svgBlob)
      try {
        const image = new Image()
        await new Promise((resolve, reject) => {
          image.onload = resolve
          image.onerror = reject
          image.src = objectUrl
        })
        const scale = 2
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas export is unavailable in this browser.')
        context.scale(scale, scale)
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        const png = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create a PNG file.')), 'image/png'))
        downloadBlob(png, 'asklytics-chart.png')
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      setExportError('Could not export this chart as PNG in the current browser.')
    }
  }

  return (
    <div className={expanded ? 'chart-expanded fixed inset-0 z-50 flex flex-col p-4 sm:p-7' : 'w-full'} ref={dialogRef} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? 'Expanded chart' : undefined}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="chart-type-control flex flex-wrap gap-1 rounded-lg p-1" role="group" aria-label="Chart type">
          {chartTypes.map((type) => (
            <button className={`chart-type-button rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition ${chartType === type ? 'chart-type-button-active' : ''}`} key={type} onClick={() => setChartType(type)} aria-pressed={chartType === type} type="button">{type}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button className="button button-secondary button-sm inline-flex gap-1.5" onClick={exportPng} type="button" aria-label="Download chart as PNG"><Download size={13} /><span className="hidden sm:inline">PNG</span></button>
          <button className="button button-secondary button-sm inline-flex gap-1.5" onClick={() => setExpanded((value) => !value)} type="button" aria-label={expanded ? 'Close expanded chart' : 'Expand chart'} aria-expanded={expanded} ref={expandButtonRef}>{expanded ? <Minimize2 size={13} /> : <Expand size={13} />}<span className="hidden sm:inline">{expanded ? 'Close' : 'Expand'}</span></button>
        </div>
      </div>
      <div className={`${expanded ? 'min-h-0 flex-1' : 'h-80'} w-full`} ref={chartRef} role="img" aria-label={visualization.title || `${chartType} chart`} aria-describedby={chartDescriptionId}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 12, right: 18, bottom: 6, left: 4 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={visualization.xAxis} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={{ stroke: gridColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(value) => number.format(value)} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ color: axisColor }} />
              <Line type="monotone" dataKey={visualization.yAxis} name={visualization.yAxis} stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--chart-1)' }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey={visualization.yAxis} nameKey={visualization.xAxis} innerRadius={62} outerRadius={108} paddingAngle={2}>
                {data.map((entry, index) => <Cell fill={COLORS[index % COLORS.length]} stroke="var(--surface)" strokeWidth={2} key={`${entry[visualization.xAxis]}-${index}`} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ color: axisColor }} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 12, right: 18, bottom: 6, left: 4 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={visualization.xAxis} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={{ stroke: gridColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(value) => number.format(value)} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ color: axisColor }} />
              <Bar dataKey={visualization.yAxis} name={visualization.yAxis} fill="var(--chart-1)" radius={[5, 5, 0, 0]} maxBarSize={52} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="sr-only" id={chartDescriptionId}>{visualization.title || 'Analytics chart'}. {data.length} data points. Use the Table result view to inspect the underlying values.</p>
      {exportError && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300" role="alert">{exportError}</p>}
    </div>
  )
}
