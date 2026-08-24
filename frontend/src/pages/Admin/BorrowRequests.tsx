import { useMemo, useState } from 'react'
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, Clock3, Eye, Search, XCircle } from 'lucide-react'
import { apiErrorMessage, assetUrl } from '@/api/client'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useAdminBorrowRequest, useAdminBorrowRequests, useApproveBorrowRequest, useRejectBorrowRequest } from '@/hooks/useBorrowRequests'
import { useBookCopies } from '@/hooks/useCatalog'
import type { BorrowRequest, BorrowRequestFilters, BorrowRequestStatus } from '@/types/borrowRequest'

function formatDate(value: string | null, includeTime = false): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: 'numeric', minute: '2-digit' }),
  }).format(new Date(value))
}

function RequestCover({ request }: { request: BorrowRequest }) {
  const source = assetUrl(request.book.cover_url)
  return source
    ? <img src={source} alt={`${request.book.title} cover`} className="w-9 h-12 object-cover rounded bg-gray-100" />
    : <div className="w-9 h-12 rounded bg-[#F5F5F5] text-gray-300 flex items-center justify-center"><BookOpen size={17} /></div>
}

function RequestDetails({ request }: { request: BorrowRequest }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl">
        <RequestCover request={request} />
        <div className="min-w-0">
          <p className="font-semibold text-[#1A1A2E] truncate">{request.book.title}</p>
          <p className="text-xs text-gray-500">by {request.book.author}</p>
          <p className="text-xs text-gray-400 mt-1">{request.reference}</p>
        </div>
        <div className="ml-auto"><Badge variant={request.status} /></div>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-xs text-gray-400">Member</dt><dd className="font-medium mt-0.5">{request.user.name}</dd></div>
        <div><dt className="text-xs text-gray-400">Member ID</dt><dd className="font-medium mt-0.5">{request.user.member_id ?? '—'}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-gray-400">Email</dt><dd className="font-medium mt-0.5">{request.user.email}</dd></div>
        <div><dt className="text-xs text-gray-400">Requested</dt><dd className="font-medium mt-0.5">{formatDate(request.requested_at, true)}</dd></div>
        <div><dt className="text-xs text-gray-400">Available Copies</dt><dd className="font-medium mt-0.5">{request.book.available_copies} of {request.book.total_copies}</dd></div>
        {request.reviewed_at && <div><dt className="text-xs text-gray-400">Reviewed</dt><dd className="font-medium mt-0.5">{formatDate(request.reviewed_at, true)}</dd></div>}
        {request.reviewed_by && <div><dt className="text-xs text-gray-400">Reviewed By</dt><dd className="font-medium mt-0.5">{request.reviewed_by.name}</dd></div>}
      </dl>
      {request.admin_notes && <div><p className="text-xs text-gray-400 mb-1">Admin Notes</p><p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{request.admin_notes}</p></div>}
      {request.rejection_reason && <div><p className="text-xs text-red-400 mb-1">Rejection Reason</p><p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{request.rejection_reason}</p></div>}
      {request.loan && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm"><p className="font-medium text-emerald-800">{request.loan.reference} · {request.loan.accession_number}</p><p className="text-emerald-700 mt-1">Borrowed {formatDate(request.loan.borrowed_at)} · Due {formatDate(request.loan.due_at)}</p></div>}
    </div>
  )
}

interface RequestTableProps {
  status: BorrowRequestStatus
  emptyMessage: string
  actions?: (request: BorrowRequest) => React.ReactNode
  onView: (request: BorrowRequest) => void
}

function RequestTable({ status, emptyMessage, actions, onView }: RequestTableProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const filters = useMemo<BorrowRequestFilters>(() => ({
    search: search.trim() || undefined,
    status,
    sort: status === 'pending' ? 'requested_at' : 'reviewed_at',
    direction: 'desc',
    page,
    per_page: 10,
  }), [page, search, status])
  const query = useAdminBorrowRequests(filters)
  const requests = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#D9D9D9]">
        <div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#D9D9D9] rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="bg-transparent text-sm outline-none placeholder:text-gray-400 w-full" placeholder="Search member, book, ISBN..." />
        </div>
        <span className="ml-auto text-xs text-gray-500">{meta?.total ?? 0} {status} request{meta?.total === 1 ? '' : 's'}</span>
      </div>
      <div className="overflow-x-auto min-h-64">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#F5F5F5] text-xs text-gray-500"><th className="text-left px-5 py-3 font-medium">Request</th><th className="text-left px-5 py-3 font-medium">Member</th><th className="text-left px-5 py-3 font-medium">Book</th><th className="text-left px-5 py-3 font-medium">Requested</th><th className="text-left px-5 py-3 font-medium">Availability</th><th className="text-left px-5 py-3 font-medium">Status</th><th className="text-left px-5 py-3 font-medium">Actions</th></tr></thead>
          <tbody>{requests.map((request) => (
            <tr key={request.id} className="border-t border-[#F5F5F5] hover:bg-gray-50/50">
              <td className="px-5 py-3 font-mono text-xs text-gray-500">{request.reference}</td>
              <td className="px-5 py-3"><p className="font-medium text-[#1A1A2E]">{request.user.name}</p><p className="text-xs text-gray-400">{request.user.member_id ?? request.user.email}</p></td>
              <td className="px-5 py-3"><div className="flex items-center gap-2"><RequestCover request={request} /><div><p className="font-medium text-[#1A1A2E] max-w-48 truncate">{request.book.title}</p><p className="text-xs text-gray-400">{request.book.author}</p></div></div></td>
              <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(request.requested_at)}</td>
              <td className="px-5 py-3"><Badge variant={request.book.availability_status} label={`${request.book.available_copies} available`} /></td>
              <td className="px-5 py-3"><Badge variant={request.status} /></td>
              <td className="px-5 py-3"><div className="flex items-center gap-1.5"><button onClick={() => onView(request)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="View"><Eye size={14} /></button>{actions?.(request)}</div></td>
            </tr>
          ))}</tbody>
        </table>
        {query.isLoading && <div className="py-12 text-center text-sm text-gray-400">Loading requests...</div>}
        {query.isError && <div className="py-12 text-center text-sm text-red-600">{apiErrorMessage(query.error)}</div>}
        {!query.isLoading && !query.isError && requests.length === 0 && <div className="py-12 text-center text-sm text-gray-400"><Clock3 size={30} className="mx-auto mb-2 text-gray-300" />{emptyMessage}</div>}
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#D9D9D9] text-sm text-gray-500">
        <span>{meta?.total ? `Showing ${meta.from}–${meta.to} of ${meta.total} requests` : 'No requests'}</span>
        <div className="flex items-center gap-2"><button aria-label="Previous page" disabled={!meta || meta.current_page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button><span className="px-3 py-1 bg-[#C72C41] text-white rounded-lg text-xs font-medium">{meta?.current_page ?? 1} / {meta?.last_page ?? 1}</span><button aria-label="Next page" disabled={!meta || meta.current_page >= meta.last_page} onClick={() => setPage((current) => current + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button></div>
      </div>
    </div>
  )
}

export function PendingRequests() {
  const [detailsId, setDetailsId] = useState<number | undefined>()
  const [review, setReview] = useState<{ type: 'approve' | 'reject'; request: BorrowRequest } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [bookCopyId, setBookCopyId] = useState<number | undefined>()
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().slice(0, 10)
  })
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const detailsQuery = useAdminBorrowRequest(detailsId)
  const approveMutation = useApproveBorrowRequest()
  const rejectMutation = useRejectBorrowRequest()
  const copiesQuery = useBookCopies(review?.request.book.id, 'available')

  const openReview = (type: 'approve' | 'reject', request: BorrowRequest) => {
    setReview({ type, request })
    setAdminNotes('')
    setRejectionReason('')
    setBookCopyId(undefined)
    setError('')
  }

  const submitReview = async () => {
    if (!review) return
    if (review.type === 'reject' && !rejectionReason.trim()) {
      setError('A rejection reason is required.')
      return
    }

    setError('')
    try {
      if (review.type === 'approve') {
        await approveMutation.mutateAsync({
          id: review.request.id,
          adminNotes: adminNotes.trim() || null,
          bookCopyId,
          dueAt: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
        })
      } else {
        await rejectMutation.mutateAsync({ id: review.request.id, rejectionReason: rejectionReason.trim(), adminNotes: adminNotes.trim() || null })
      }
      setToast(`Borrow request ${review.type === 'approve' ? 'approved' : 'rejected'} successfully.`)
      setReview(null)
    } catch (mutationError) {
      setError(apiErrorMessage(mutationError))
    }
  }

  const reviewing = approveMutation.isPending || rejectMutation.isPending

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {detailsId !== undefined && <Modal title="Borrow Request Details" onClose={() => setDetailsId(undefined)}>{detailsQuery.isLoading && <div className="py-8 text-center text-sm text-gray-400">Loading request...</div>}{detailsQuery.isError && <div className="py-8 text-center text-sm text-red-600">{apiErrorMessage(detailsQuery.error)}</div>}{detailsQuery.data && <RequestDetails request={detailsQuery.data} />}</Modal>}
      {review && (
        <Modal title={review.type === 'approve' ? 'Approve Borrow Request' : 'Reject Borrow Request'} onClose={() => setReview(null)} footer={<><button onClick={() => setReview(null)} className="px-4 py-2 border border-[#D9D9D9] rounded-lg text-sm text-gray-600">Cancel</button><button disabled={reviewing} onClick={() => void submitReview()} className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60 ${review.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>{review.type === 'approve' ? <CheckCircle size={14} /> : <XCircle size={14} />}{reviewing ? 'Saving...' : review.type === 'approve' ? 'Approve Request' : 'Reject Request'}</button></>}>
          {error && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <div className="flex items-center gap-3 p-3 bg-[#F5F5F5] rounded-lg mb-5"><RequestCover request={review.request} /><div><p className="font-medium text-sm text-[#1A1A2E]">{review.request.book.title}</p><p className="text-xs text-gray-500">Requested by {review.request.user.name}</p><p className="text-xs text-gray-400">{review.request.user.member_id}</p></div></div>
          <p className="text-sm text-gray-600 mb-4">{review.type === 'approve' ? 'Approval checks out one available physical copy and creates the member loan atomically.' : 'The member will receive a notification containing the rejection reason.'}</p>
          <div className="space-y-4">
            {review.type === 'approve' && <div className="grid sm:grid-cols-2 gap-3"><div><label className="field-label">Physical Copy</label><select value={bookCopyId ?? ''} onChange={(event) => setBookCopyId(event.target.value ? Number(event.target.value) : undefined)} className="form-input"><option value="">Automatically select</option>{copiesQuery.data?.map((copy) => <option key={copy.id} value={copy.id}>{copy.accession_number}{copy.barcode ? ` · ${copy.barcode}` : ''}</option>)}</select>{copiesQuery.isLoading && <p className="text-xs text-gray-400 mt-1">Loading copies...</p>}</div><div><label className="field-label">Due Date *</label><input type="date" min={new Date().toISOString().slice(0, 10)} value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="form-input" /></div></div>}
            {review.type === 'reject' && <div><label className="field-label">Reason for Rejection *</label><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} className="form-input resize-none" placeholder="Provide a clear reason for the member..." /></div>}
            <div><label className="field-label">Admin Notes</label><textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={2} className="form-input resize-none" placeholder="Internal or checkout instructions..." /></div>
          </div>
        </Modal>
      )}
      <RequestTable status="pending" emptyMessage="No pending borrow requests." onView={(request) => setDetailsId(request.id)} actions={(request) => <><button onClick={() => openReview('approve', request)} className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg" title="Approve"><CheckCircle size={14} /></button><button onClick={() => openReview('reject', request)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Reject"><XCircle size={14} /></button></>} />
    </div>
  )
}

export function ApprovedRequests() {
  const [detailsId, setDetailsId] = useState<number | undefined>()
  const detailsQuery = useAdminBorrowRequest(detailsId)

  return (
    <div className="p-6 space-y-5">
      {detailsId !== undefined && <Modal title="Approved Request Details" onClose={() => setDetailsId(undefined)}>{detailsQuery.isLoading && <div className="py-8 text-center text-sm text-gray-400">Loading request...</div>}{detailsQuery.isError && <div className="py-8 text-center text-sm text-red-600">{apiErrorMessage(detailsQuery.error)}</div>}{detailsQuery.data && <RequestDetails request={detailsQuery.data} />}</Modal>}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800"><strong>Approved requests have been checked out.</strong> Each approval is linked to its assigned copy and active loan.</div>
      <RequestTable status="approved" emptyMessage="No approved requests are awaiting checkout." onView={(request) => setDetailsId(request.id)} />
    </div>
  )
}
