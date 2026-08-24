import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Eye, RotateCcw, Search } from 'lucide-react'
import { apiErrorMessage, assetUrl } from '@/api/client'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useAdminLoan, useAdminLoans, useRecordReturn } from '@/hooks/useLoans'
import type { Loan, LoanFilters, LoanStatus } from '@/types/loan'

function formatDate(value: string | null, includeTime = false): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...(includeTime && { hour: 'numeric', minute: '2-digit' }),
  }).format(new Date(value))
}

function LoanStatusBadge({ loan }: { loan: Loan }) {
  if (loan.status === 'borrowed' && loan.is_due_soon) return <Badge variant="due-soon" label="Due Soon" />
  return <Badge variant={loan.status} />
}

function LoanDetails({ loan }: { loan: Loan }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl">
        {loan.book_copy.book.cover_url
          ? <img src={assetUrl(loan.book_copy.book.cover_url) ?? ''} alt="" className="w-11 h-16 object-cover rounded" />
          : <div className="w-11 h-16 rounded bg-white flex items-center justify-center text-gray-300"><BookOpen size={19} /></div>}
        <div className="min-w-0"><p className="font-semibold truncate">{loan.book_copy.book.title}</p><p className="text-xs text-gray-500">{loan.book_copy.book.author}</p><p className="text-xs text-gray-400 mt-1">{loan.reference}</p></div>
        <div className="ml-auto"><LoanStatusBadge loan={loan} /></div>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-xs text-gray-400">Member</dt><dd className="font-medium mt-0.5">{loan.user.name}</dd></div>
        <div><dt className="text-xs text-gray-400">Member ID</dt><dd className="font-medium mt-0.5">{loan.user.member_id ?? '—'}</dd></div>
        <div><dt className="text-xs text-gray-400">Accession Number</dt><dd className="font-medium mt-0.5">{loan.book_copy.accession_number}</dd></div>
        <div><dt className="text-xs text-gray-400">Issued By</dt><dd className="font-medium mt-0.5">{loan.issued_by.name}</dd></div>
        <div><dt className="text-xs text-gray-400">Borrowed</dt><dd className="font-medium mt-0.5">{formatDate(loan.borrowed_at, true)}</dd></div>
        <div><dt className="text-xs text-gray-400">Due</dt><dd className="font-medium mt-0.5">{formatDate(loan.due_at, true)}</dd></div>
        {loan.returned_at && <div><dt className="text-xs text-gray-400">Returned</dt><dd className="font-medium mt-0.5">{formatDate(loan.returned_at, true)}</dd></div>}
        {loan.received_by && <div><dt className="text-xs text-gray-400">Received By</dt><dd className="font-medium mt-0.5">{loan.received_by.name}</dd></div>}
      </dl>
      {loan.notes && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">{loan.notes}</div>}
    </div>
  )
}

function LoanTable({ status, heading, warning }: { status?: LoanStatus; heading: string; warning?: string }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailsId, setDetailsId] = useState<number | undefined>()
  const [returnLoan, setReturnLoan] = useState<Loan | null>(null)
  const [returnCondition, setReturnCondition] = useState<'good' | 'damaged'>('good')
  const [notes, setNotes] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const filters = useMemo<LoanFilters>(() => ({ search: search.trim() || undefined, status, page, per_page: 10, sort: status === 'returned' ? 'returned_at' : 'due_at', direction: status === 'returned' ? 'desc' : 'asc' }), [page, search, status])
  const query = useAdminLoans(filters)
  const detailsQuery = useAdminLoan(detailsId)
  const returnMutation = useRecordReturn()
  const loans = query.data?.data ?? []
  const meta = query.data?.meta

  const submitReturn = async () => {
    if (!returnLoan) return
    setError('')
    try {
      await returnMutation.mutateAsync({ id: returnLoan.id, input: { return_condition: returnCondition, notes: notes.trim() || null } })
      setReturnLoan(null)
      setToast('Book return recorded and inventory updated.')
    } catch (returnError) {
      setError(apiErrorMessage(returnError))
    }
  }

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {warning && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">{warning}</div>}
      {detailsId !== undefined && <Modal title="Loan Details" onClose={() => setDetailsId(undefined)}>{detailsQuery.isLoading && <p className="py-8 text-center text-gray-400">Loading loan...</p>}{detailsQuery.isError && <p className="py-8 text-center text-red-600">{apiErrorMessage(detailsQuery.error)}</p>}{detailsQuery.data && <LoanDetails loan={detailsQuery.data} />}</Modal>}
      {returnLoan && <Modal title="Record Book Return" onClose={() => setReturnLoan(null)} footer={<><button onClick={() => setReturnLoan(null)} className="px-4 py-2 border border-[#D9D9D9] rounded-lg text-sm">Cancel</button><button disabled={returnMutation.isPending} onClick={() => void submitReturn()} className="px-4 py-2 bg-[#C72C41] hover:bg-[#A50034] text-white rounded-lg text-sm font-medium disabled:opacity-60">{returnMutation.isPending ? 'Saving...' : 'Confirm Return'}</button></>}>
        {error && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div className="bg-[#F5F5F5] rounded-lg p-3 mb-4"><p className="font-medium">{returnLoan.book_copy.book.title}</p><p className="text-xs text-gray-500">{returnLoan.user.name} · {returnLoan.book_copy.accession_number}</p></div>
        <div className="space-y-3"><div><label className="field-label">Return Condition</label><select value={returnCondition} onChange={(event) => setReturnCondition(event.target.value as 'good' | 'damaged')} className="form-input"><option value="good">Good — release as available</option><option value="damaged">Damaged — hold from circulation</option></select></div><div><label className="field-label">Condition Notes</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="form-input resize-none" placeholder="Optional return notes..." /></div></div>
      </Modal>}

      <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#D9D9D9]"><div><h3 className="font-semibold text-sm">{heading}</h3><p className="text-xs text-gray-400">{meta?.total ?? 0} transaction{meta?.total === 1 ? '' : 's'}</p></div><div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#D9D9D9] rounded-lg px-3 py-2 ml-auto"><Search size={14} className="text-gray-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="bg-transparent text-sm outline-none w-52" placeholder="Search member, book, copy..." /></div></div>
        <div className="overflow-x-auto min-h-64"><table className="w-full text-sm"><thead><tr className="bg-[#F5F5F5] text-xs text-gray-500"><th className="text-left px-5 py-3 font-medium">Transaction</th><th className="text-left px-5 py-3 font-medium">Member</th><th className="text-left px-5 py-3 font-medium">Book / Copy</th><th className="text-left px-5 py-3 font-medium">Borrowed</th><th className="text-left px-5 py-3 font-medium">Due / Returned</th><th className="text-left px-5 py-3 font-medium">Status</th><th className="text-left px-5 py-3 font-medium">Actions</th></tr></thead><tbody>
          {loans.map((loan) => <tr key={loan.id} className="border-t border-[#F5F5F5] hover:bg-gray-50/50"><td className="px-5 py-3 font-mono text-xs text-gray-500">{loan.reference}</td><td className="px-5 py-3"><p className="font-medium">{loan.user.name}</p><p className="text-xs text-gray-400">{loan.user.member_id ?? loan.user.email}</p></td><td className="px-5 py-3"><p className="font-medium max-w-52 truncate">{loan.book_copy.book.title}</p><p className="text-xs text-gray-400">{loan.book_copy.accession_number}</p></td><td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(loan.borrowed_at)}</td><td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(loan.returned_at ?? loan.due_at)}{loan.days_remaining !== null && loan.status !== 'returned' && <p className={`text-xs ${loan.days_remaining < 0 ? 'text-red-600' : 'text-gray-400'}`}>{loan.days_remaining < 0 ? `${Math.abs(loan.days_remaining)} days overdue` : `${loan.days_remaining} days remaining`}</p>}</td><td className="px-5 py-3"><LoanStatusBadge loan={loan} /></td><td className="px-5 py-3"><div className="flex gap-1"><button onClick={() => setDetailsId(loan.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={14} /></button>{loan.status !== 'returned' && <button onClick={() => { setReturnLoan(loan); setReturnCondition('good'); setNotes(''); setError('') }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Record return"><RotateCcw size={14} /></button>}</div></td></tr>)}
        </tbody></table>{query.isLoading && <p className="py-12 text-center text-gray-400">Loading circulation records...</p>}{query.isError && <p className="py-12 text-center text-red-600">{apiErrorMessage(query.error)}</p>}{!query.isLoading && !query.isError && loans.length === 0 && <p className="py-12 text-center text-gray-400">No matching circulation records.</p>}</div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#D9D9D9] text-sm text-gray-500"><span>{meta?.total ? `Showing ${meta.from}–${meta.to} of ${meta.total}` : 'No transactions'}</span><div className="flex items-center gap-2"><button aria-label="Previous page" disabled={!meta || meta.current_page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button><span className="px-3 py-1 bg-[#C72C41] text-white rounded-lg text-xs">{meta?.current_page ?? 1} / {meta?.last_page ?? 1}</span><button aria-label="Next page" disabled={!meta || meta.current_page >= meta.last_page} onClick={() => setPage((value) => value + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button></div></div>
      </div>
    </div>
  )
}

export function BorrowedBooks() { return <LoanTable status="borrowed" heading="Currently Borrowed" /> }
export function OverdueBooks() { return <LoanTable status="overdue" heading="Overdue Books" warning="These loans are past their due date. Contact the members and record each return promptly." /> }
export function ReturnedBooks() { return <LoanTable status="returned" heading="Returned Books" /> }
export function AllTransactions() { return <LoanTable heading="All Circulation Transactions" /> }
