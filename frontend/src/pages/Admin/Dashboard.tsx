import { AlertTriangle, BookCopy, BookMarked, BookOpen, Clock, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiErrorMessage, assetUrl } from '@/api/client'
import Badge from '@/components/ui/Badge'
import { useDashboard } from '@/hooks/useOperations'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export default function Dashboard({ onPage }: { onPage: (p: string) => void }) {
  const query = useDashboard()

  if (query.isLoading) return <div className="p-6"><div className="bg-white rounded-xl border border-[#D9D9D9] p-12 text-center text-gray-400">Loading live dashboard...</div></div>
  if (query.isError) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">{apiErrorMessage(query.error)}</div></div>

  const data = query.data!
  const stats = [
    { label: 'Total Books', value: data.summary.total_books, icon: BookOpen, color: 'text-[#C72C41]', light: 'bg-red-50' },
    { label: 'Available', value: data.summary.available_copies, icon: BookCopy, color: 'text-emerald-600', light: 'bg-emerald-50' },
    { label: 'Borrowed', value: data.summary.borrowed_copies, icon: BookMarked, color: 'text-blue-600', light: 'bg-blue-50' },
    { label: 'Pending', value: data.summary.pending_requests, icon: Clock, color: 'text-amber-500', light: 'bg-amber-50' },
    { label: 'Overdue', value: data.summary.overdue_loans, icon: AlertTriangle, color: 'text-orange-500', light: 'bg-orange-50' },
    { label: 'Members', value: data.summary.active_members, icon: Users, color: 'text-purple-600', light: 'bg-purple-50' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">{stats.map((stat) => <div key={stat.label} className="bg-white rounded-xl p-5 border border-[#D9D9D9] shadow-sm"><div className={`w-10 h-10 ${stat.light} rounded-xl flex items-center justify-center mb-3`}><stat.icon size={20} className={stat.color} /></div><div className="text-2xl font-bold">{stat.value.toLocaleString()}</div><div className="text-xs text-gray-500 mt-0.5">{stat.label}</div></div>)}</div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#D9D9D9] p-5 shadow-sm"><h3 className="font-semibold">Library Activity</h3><p className="text-xs text-gray-400 mb-5">Borrowed vs returned — last 6 months</p><ResponsiveContainer width="100%" height={220}><BarChart data={data.monthly_activity} barSize={10} barGap={3}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="borrowed" name="Borrowed" fill="#C72C41" radius={[4, 4, 0, 0]} /><Bar dataKey="returned" name="Returned" fill="#D9D9D9" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white rounded-xl border border-[#D9D9D9] p-5 shadow-sm"><h3 className="font-semibold mb-4">Popular Books</h3><div className="space-y-3">{data.popular_books.map((book, index) => <div key={book.id} className="flex items-center gap-3"><span className="text-xs font-bold text-gray-300 w-4">{index + 1}</span>{book.cover_url ? <img src={assetUrl(book.cover_url) ?? ''} alt="" className="w-9 h-12 object-cover rounded" /> : <div className="w-9 h-12 bg-[#F5F5F5] rounded flex items-center justify-center text-gray-300"><BookOpen size={15} /></div>}<div className="min-w-0"><p className="text-xs font-medium truncate">{book.title}</p><p className="text-xs text-gray-400 truncate">{book.author}</p><p className="text-xs text-[#C72C41] font-medium">{book.borrow_count} borrows</p></div></div>)}{data.popular_books.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No circulation data yet.</p>}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-[#D9D9D9]"><h3 className="font-semibold">Recent Borrow Requests</h3><button onClick={() => onPage('pending')} className="text-xs text-[#C72C41] font-medium hover:underline">View all</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#F5F5F5] text-xs text-gray-500"><th className="text-left px-5 py-3 font-medium">Member</th><th className="text-left px-5 py-3 font-medium">Book</th><th className="text-left px-5 py-3 font-medium">Requested</th><th className="text-left px-5 py-3 font-medium">Status</th></tr></thead><tbody>{data.recent_requests.map((request) => <tr key={request.id} className="border-t border-[#F5F5F5]"><td className="px-5 py-3 font-medium">{request.user.name}</td><td className="px-5 py-3 text-gray-600">{request.book.title}</td><td className="px-5 py-3 text-gray-500">{formatDate(request.requested_at)}</td><td className="px-5 py-3"><Badge variant={request.status} /></td></tr>)}</tbody></table>{data.recent_requests.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No borrow requests yet.</p>}</div></div>

      <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-[#D9D9D9]"><h3 className="font-semibold">Current Loans</h3><button onClick={() => onPage('borrowed')} className="text-xs text-[#C72C41] font-medium hover:underline">View all</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#F5F5F5] text-xs text-gray-500"><th className="text-left px-5 py-3 font-medium">Member</th><th className="text-left px-5 py-3 font-medium">Book / Copy</th><th className="text-left px-5 py-3 font-medium">Borrowed</th><th className="text-left px-5 py-3 font-medium">Due</th><th className="text-left px-5 py-3 font-medium">Status</th></tr></thead><tbody>{data.current_loans.map((loan) => <tr key={loan.id} className="border-t border-[#F5F5F5]"><td className="px-5 py-3 font-medium">{loan.user.name}</td><td className="px-5 py-3"><p className="text-gray-600">{loan.book_copy.book.title}</p><p className="text-xs text-gray-400">{loan.book_copy.accession_number}</p></td><td className="px-5 py-3 text-gray-500">{formatDate(loan.borrowed_at)}</td><td className="px-5 py-3 text-gray-500">{formatDate(loan.due_at)}</td><td className="px-5 py-3"><Badge variant={loan.status === 'borrowed' && loan.is_due_soon ? 'due-soon' : loan.status} /></td></tr>)}</tbody></table>{data.current_loans.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No active loans.</p>}</div></div>
    </div>
  )
}
