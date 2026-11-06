import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const COLORS = ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#84cc16', '#64748b']
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"><p className="mb-1 font-medium text-slate-600">{label ?? payload[0].name}</p>{payload.map((item) => <p className="text-slate-900" key={item.dataKey}>{item.name}: {number.format(Number(item.value))}</p>)}</div>
}

export default function ChartRenderer({ visualization }) {
  if (!visualization) return null
  if (visualization.type === 'table') return <p className="text-sm text-slate-500">A chart is not useful for this result. See the table below.</p>
  if (visualization.type === 'kpi') {
    return <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6"><p className="text-xs font-medium text-indigo-700">{visualization.label || visualization.yAxis}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{number.format(visualization.value ?? 0)}</p><p className="mt-1 text-xs text-slate-500">{visualization.title}</p></div>
  }

  const data = visualization.data || []
  if (!data.length) return <p className="text-sm text-slate-500">There is not enough data to draw a chart.</p>
  return (
    <div className="h-80 w-full" role="img" aria-label={visualization.title}>
      <ResponsiveContainer width="100%" height="100%">
        {visualization.type === 'line' ? (
          <LineChart data={data} margin={{ top: 12, right: 18, bottom: 6, left: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={visualization.xAxis} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => number.format(value)} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} /><Legend />
            <Line type="monotone" dataKey={visualization.yAxis} name={visualization.yAxis} stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        ) : visualization.type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey={visualization.yAxis} nameKey={visualization.xAxis} innerRadius={62} outerRadius={108} paddingAngle={2}>
              {data.map((entry, index) => <Cell fill={COLORS[index % COLORS.length]} key={`${entry[visualization.xAxis]}-${index}`} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} /><Legend />
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 12, right: 18, bottom: 6, left: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={visualization.xAxis} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => number.format(value)} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} /><Legend />
            <Bar dataKey={visualization.yAxis} name={visualization.yAxis} fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={52} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
