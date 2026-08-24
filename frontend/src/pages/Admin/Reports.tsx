import { useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Download, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiErrorMessage } from '@/api/client'
import { useBorrowingReport } from '@/hooks/useOperations'
import { operationsService } from '@/services/operationsService'
import type { ReportFilters } from '@/types/operations'

const PIE_COLORS = ['#C72C41', '#A50034', '#D9534F', '#E87A5D', '#F4A261', '#6B7280']

function isoDate(date: Date): string { return date.toISOString().slice(0, 10) }

export default function Reports() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const filters = useMemo<ReportFilters>(() => {
    const end = new Date()
    const start = new Date(end)
    if (period === 'daily') start.setHours(0, 0, 0, 0)
    if (period === 'weekly') start.setDate(end.getDate() - 6)
    if (period === 'monthly') start.setMonth(end.getMonth() - 5, 1)
    return period === 'custom'
      ? { date_from: dateFrom || undefined, date_to: dateTo || undefined }
      : { date_from: isoDate(start), date_to: isoDate(end) }
  }, [dateFrom, dateTo, period])
  const query = useBorrowingReport(filters)

  const exportReport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const blob = await operationsService.export(filters)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'library-borrowing-report.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(apiErrorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm px-5 py-4 flex flex-wrap items-center gap-3"><span className="text-sm font-medium">Period:</span>{(['daily', 'weekly', 'monthly', 'custom'] as const).map((value) => <button key={value} onClick={() => setPeriod(value)} className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize ${period === value ? 'bg-[#C72C41] text-white' : 'bg-[#F5F5F5] text-gray-600 hover:bg-gray-200'}`}>{value}</button>)}{period === 'custom' && <><input aria-label="Report start date" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="form-input w-auto" /><input aria-label="Report end date" type="date" min={dateFrom} value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="form-input w-auto" /></>}<button disabled={exporting} onClick={() => void exportReport()} className="ml-auto flex items-center gap-2 border border-[#D9D9D9] px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"><Download size={15} />{exporting ? 'Exporting...' : 'Export CSV'}</button></div>
      {exportError && <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{exportError}</div>}
      {query.isLoading && <div className="bg-white border border-[#D9D9D9] rounded-xl p-12 text-center text-gray-400">Loading report...</div>}
      {query.isError && <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">{apiErrorMessage(query.error)}</div>}
      {query.data && <ReportContent data={query.data} />}
    </div>
  )
}

function ReportContent({ data }: { data: NonNullable<ReturnType<typeof useBorrowingReport>['data']> }) {
  const stats = [
    { label: 'Total Transactions', value: data.summary.total_transactions, icon: TrendingUp, detail: `${data.period.from} to ${data.period.to}` },
    { label: 'Total Returns', value: data.summary.total_returns, icon: BookOpen, detail: 'Recorded returns' },
    { label: 'Overdue Count', value: data.summary.overdue_count, icon: AlertTriangle, detail: 'Currently overdue' },
    { label: 'Most Active User', value: data.summary.most_active_user?.name ?? 'No data', icon: Users, detail: data.summary.most_active_user ? `${data.summary.most_active_user.borrow_count} borrows` : 'No transactions' },
  ]
  const maximum = Math.max(...data.popular_books.map((book) => book.borrow_count), 1)

  return <>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{stats.map((stat) => <div key={stat.label} className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm p-5"><div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-3"><stat.icon size={18} className="text-[#C72C41]" /></div><div className="text-xl font-bold truncate">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div><div className="text-xs text-gray-400 mt-0.5">{stat.label}</div><div className="text-[11px] text-gray-400 mt-2">{stat.detail}</div></div>)}</div>
    <div className="grid xl:grid-cols-3 gap-5"><div className="xl:col-span-2 bg-white rounded-xl border border-[#D9D9D9] shadow-sm p-5"><h3 className="font-semibold mb-1">Monthly Borrowing Activity</h3><p className="text-xs text-gray-400 mb-4">Borrowed vs returned — last 6 months</p><ResponsiveContainer width="100%" height={220}><BarChart data={data.monthly_activity} barSize={10} barGap={3}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="borrowed" name="Borrowed" fill="#C72C41" radius={[4, 4, 0, 0]} /><Bar dataKey="returned" name="Returned" fill="#6B7280" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm p-5"><h3 className="font-semibold mb-1">Borrowing by Category</h3><p className="text-xs text-gray-400 mb-4">Live circulation distribution</p>{data.category_distribution.length > 0 ? <><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={data.category_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>{data.category_distribution.map((category, index) => <Cell key={category.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="space-y-1.5 mt-2">{data.category_distribution.map((category, index) => <div key={category.name} className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} /><span className="text-gray-600 flex-1">{category.name}</span><span className="text-gray-400">{category.value}</span></div>)}</div></> : <p className="py-20 text-center text-sm text-gray-400">No category data.</p>}</div></div>
    <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-[#D9D9D9]"><h3 className="font-semibold text-sm">Most Borrowed Books</h3></div><div className="p-5 space-y-3">{data.popular_books.map((book, index) => <div key={book.id} className="flex items-center gap-3"><span className="text-xs font-bold text-gray-300 w-5 text-center">{index + 1}</span><div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{book.title}</span><span className="text-xs text-gray-500">{book.borrow_count} borrows</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#C72C41] h-1.5 rounded-full" style={{ width: `${(book.borrow_count / maximum) * 100}%` }} /></div></div></div>)}{data.popular_books.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No borrowing activity in this period.</p>}</div></div>
  </>
}
