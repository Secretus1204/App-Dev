import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Plus, Search, ShieldCheck, UserCheck, UsersRound, UserX } from 'lucide-react'
import { apiErrorMessage } from '@/api/client'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminUser, useCreateUser, useUpdateUser, useUpdateUserStatus, useUsers } from '@/hooks/useUsers'
import type { CreateUserInput, User, UserFilters, UserRole, UserStatus } from '@/types/auth'

interface AccountForm {
  name: string
  member_id: string
  email: string
  role: UserRole
  status: UserStatus
  password: string
  password_confirmation: string
}

const emptyForm: AccountForm = {
  name: '',
  member_id: '',
  email: '',
  role: 'user',
  status: 'active',
  password: '',
  password_confirmation: '',
}

function initials(name: string): string {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(value: string | null): string {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export default function Users() {
  const { user: currentAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | undefined>()
  const [accountModal, setAccountModal] = useState<{ mode: 'create' | 'edit'; user?: User } | null>(null)
  const [form, setForm] = useState<AccountForm>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [modalError, setModalError] = useState('')
  const [actionError, setActionError] = useState('')
  const [toast, setToast] = useState('')

  const filters = useMemo<UserFilters>(() => ({
    search: search.trim() || undefined,
    role: (role || undefined) as UserRole | undefined,
    status: (status || undefined) as UserStatus | undefined,
    sort: 'created_at',
    direction: 'desc',
    page,
    per_page: 10,
  }), [page, role, search, status])

  const usersQuery = useUsers(filters)
  const detailQuery = useAdminUser(selectedId)
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const statusMutation = useUpdateUserStatus()
  const accounts = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta

  const openCreate = () => {
    setForm(emptyForm)
    setModalError('')
    setAccountModal({ mode: 'create' })
  }

  const openEdit = (account: User) => {
    setForm({
      name: account.name,
      member_id: account.member_id ?? '',
      email: account.email,
      role: account.role,
      status: account.status,
      password: '',
      password_confirmation: '',
    })
    setModalError('')
    setAccountModal({ mode: 'edit', user: account })
  }

  const changeRole = (nextRole: UserRole) => {
    setForm((current) => ({
      ...current,
      role: nextRole,
      member_id: nextRole === 'admin' ? '' : current.member_id,
      status: nextRole === 'admin' && current.status === 'pending' ? 'active' : current.status,
    }))
  }

  const saveAccount = async () => {
    setModalError('')

    if (accountModal?.mode === 'create' && form.password !== form.password_confirmation) {
      setModalError('The temporary password confirmation does not match.')
      return
    }

    try {
      if (accountModal?.mode === 'edit' && accountModal.user) {
        await updateMutation.mutateAsync({
          id: accountModal.user.id,
          input: {
            name: form.name.trim(),
            email: form.email.trim(),
            ...(form.role === 'user' && { member_id: form.member_id.trim() }),
          },
        })
        setToast('Account details updated successfully.')
      } else {
        const input: CreateUserInput = {
          name: form.name.trim(),
          member_id: form.role === 'admin' ? null : form.member_id.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          password: form.password,
          password_confirmation: form.password_confirmation,
        }
        await createMutation.mutateAsync(input)
        setToast(`${form.role === 'admin' ? 'Admin' : 'Member'} account created with a temporary password.`)
      }

      setAccountModal(null)
    } catch (mutationError) {
      setModalError(apiErrorMessage(mutationError))
    }
  }

  const updateStatus = async (account: User) => {
    const nextStatus: UserStatus = account.status === 'active' ? 'inactive' : 'active'
    const action = account.status === 'pending' ? 'Approve' : nextStatus === 'active' ? 'Activate' : 'Deactivate'
    if (!window.confirm(`${action} ${account.name}’s account?`)) return

    setActionError('')
    try {
      await statusMutation.mutateAsync({ id: account.id, status: nextStatus })
      setToast(`${account.name} ${action.toLowerCase()}d successfully.`)
    } catch (mutationError) {
      setActionError(apiErrorMessage(mutationError))
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const selected = detailQuery.data

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {selectedId !== undefined && (
        <Modal title="Account Details" onClose={() => setSelectedId(undefined)} footer={selected && <button onClick={() => { setSelectedId(undefined); openEdit(selected) }} className="flex items-center gap-2 px-4 py-2 bg-[#C72C41] text-white rounded-lg text-sm font-medium"><Pencil size={14} /> Edit Account</button>}>
          {detailQuery.isLoading && <div className="py-8 text-center text-sm text-gray-400">Loading account...</div>}
          {detailQuery.isError && <div className="py-8 text-center text-sm text-red-600">{apiErrorMessage(detailQuery.error)}</div>}
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${selected.role === 'admin' ? 'bg-[#A50034]' : 'bg-[#C72C41]'}`}>{initials(selected.name)}</div>
                <div>
                  <h4 className="font-bold text-[#1A1A2E]">{selected.name}</h4>
                  <p className="text-sm text-gray-500">{selected.member_id ?? 'No member ID'}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <div className="flex gap-2 mt-2"><Badge variant={selected.status} /><Badge variant={selected.role === 'admin' ? 'approved' : 'active'} label={selected.role === 'admin' ? 'Admin' : 'Member'} /></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['Requests', selected.borrow_requests_count], ['All Loans', selected.loans_count], ['Active Loans', selected.active_loans_count]].map(([label, value]) => <div key={label as string} className="bg-[#F5F5F5] rounded-xl p-3 text-center"><p className="text-xl font-bold text-[#1A1A2E]">{value}</p><p className="text-xs text-gray-400">{label}</p></div>)}
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-xs text-gray-400">Registered</dt><dd className="font-medium mt-0.5">{formatDate(selected.created_at)}</dd></div>
                <div><dt className="text-xs text-gray-400">Last Login</dt><dd className="font-medium mt-0.5">{formatDate(selected.last_login_at)}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-gray-400">Created By</dt><dd className="font-medium mt-0.5">{selected.created_by?.name ?? 'Public registration / system seed'}</dd></div>
              </dl>
            </div>
          )}
        </Modal>
      )}

      {accountModal && (
        <Modal
          title={accountModal.mode === 'create' ? 'Create Account' : 'Edit Account'}
          onClose={() => setAccountModal(null)}
          footer={<><button onClick={() => setAccountModal(null)} className="px-4 py-2 border border-[#D9D9D9] rounded-lg text-sm text-gray-600">Cancel</button><button disabled={saving} onClick={() => void saveAccount()} className="px-4 py-2 bg-[#C72C41] hover:bg-[#A50034] text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save Account'}</button></>}
        >
          {modalError && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{modalError}</div>}
          <div className="space-y-4">
            <div><label className="field-label">Full Name *</label><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="form-input" /></div>
            <div><label className="field-label">Email *</label><input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="form-input" /></div>
            {accountModal.mode === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="field-label">Role *</label><select value={form.role} onChange={(event) => changeRole(event.target.value as UserRole)} className="form-input"><option value="user">Library Member</option><option value="admin">Admin / Librarian</option></select></div>
                <div><label className="field-label">Initial Status *</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserStatus }))} className="form-input"><option value="active">Active</option>{form.role === 'user' && <option value="pending">Pending Approval</option>}<option value="inactive">Inactive</option></select></div>
              </div>
            )}
            {form.role === 'user' && <div><label className="field-label">Member ID *</label><input required value={form.member_id} onChange={(event) => setForm((current) => ({ ...current, member_id: event.target.value }))} className="form-input" placeholder="MEM-10001" /></div>}
            {accountModal.mode === 'edit' && <div className="rounded-lg bg-[#F5F5F5] px-3 py-2 text-xs text-gray-500">Role and status use separate protected workflows and cannot be changed in this form.</div>}
            {accountModal.mode === 'create' && (
              <>
                <div><label className="field-label">Temporary Password *</label><div className="relative"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="form-input pr-10" /><button type="button" aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
                <div><label className="field-label">Confirm Temporary Password *</label><input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password_confirmation} onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))} className="form-input" /><p className="text-xs text-gray-400 mt-1">The account holder must change this password at first login.</p></div>
              </>
            )}
          </div>
        </Modal>
      )}

      {actionError && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{actionError}</div>}

      <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#D9D9D9]">
          <div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#D9D9D9] rounded-lg px-3 py-2 flex-1 min-w-52">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="bg-transparent text-sm outline-none placeholder:text-gray-400 w-full" placeholder="Search name, email, or member ID..." />
          </div>
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }} className="border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm bg-white outline-none"><option value="">All roles</option><option value="user">Members</option><option value="admin">Admins</option></select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm bg-white outline-none"><option value="">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option></select>
          <button onClick={openCreate} className="ml-auto flex items-center gap-2 bg-[#C72C41] hover:bg-[#A50034] text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={15} /> Create Account</button>
        </div>

        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#F5F5F5] text-xs text-gray-500"><th className="text-left px-5 py-3 font-medium">Account</th><th className="text-left px-5 py-3 font-medium">Member ID</th><th className="text-left px-5 py-3 font-medium">Role</th><th className="text-left px-5 py-3 font-medium">Registered</th><th className="text-center px-5 py-3 font-medium">Active Loans</th><th className="text-left px-5 py-3 font-medium">Status</th><th className="text-left px-5 py-3 font-medium">Actions</th></tr></thead>
            <tbody>{accounts.map((account) => (
              <tr key={account.id} className={`border-t border-[#F5F5F5] hover:bg-gray-50/50 ${account.status !== 'active' ? 'opacity-70' : ''}`}>
                <td className="px-5 py-3"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${account.role === 'admin' ? 'bg-[#A50034]' : 'bg-[#C72C41]'}`}>{initials(account.name)}</div><div><span className="font-medium text-[#1A1A2E]">{account.name}</span><p className="text-xs text-gray-400">{account.email}</p></div></div></td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{account.member_id ?? '—'}</td>
                <td className="px-5 py-3"><span className="inline-flex items-center gap-1.5 text-xs text-gray-600">{account.role === 'admin' ? <ShieldCheck size={14} className="text-[#A50034]" /> : <UsersRound size={14} className="text-[#C72C41]" />}{account.role === 'admin' ? 'Admin' : 'Member'}</span></td>
                <td className="px-5 py-3 text-gray-500">{formatDate(account.created_at)}</td>
                <td className="px-5 py-3 text-center">{account.active_loans_count}</td>
                <td className="px-5 py-3"><Badge variant={account.status} /></td>
                <td className="px-5 py-3"><div className="flex items-center gap-1.5"><button onClick={() => setSelectedId(account.id)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="View"><Eye size={14} /></button><button onClick={() => openEdit(account)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg" title="Edit"><Pencil size={14} /></button><button disabled={account.id === currentAdmin?.id || statusMutation.isPending} onClick={() => void updateStatus(account)} className={`p-1.5 rounded-lg disabled:opacity-25 ${account.status === 'active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`} title={account.id === currentAdmin?.id ? 'You cannot change your own status' : account.status === 'active' ? 'Deactivate' : account.status === 'pending' ? 'Approve' : 'Activate'}>{account.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}</button></div></td>
              </tr>
            ))}</tbody>
          </table>
          {usersQuery.isLoading && <div className="py-12 text-center text-sm text-gray-400">Loading accounts...</div>}
          {usersQuery.isError && <div className="py-12 text-center text-sm text-red-600">{apiErrorMessage(usersQuery.error)}</div>}
          {!usersQuery.isLoading && !usersQuery.isError && accounts.length === 0 && <div className="py-12 text-center text-sm text-gray-400"><UsersRound size={30} className="mx-auto mb-2 text-gray-300" />No accounts match these filters.</div>}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[#D9D9D9] text-sm text-gray-500">
          <span>{meta?.total ? `Showing ${meta.from}–${meta.to} of ${meta.total} accounts` : 'No accounts'}</span>
          <div className="flex items-center gap-2"><button aria-label="Previous page" disabled={!meta || meta.current_page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button><span className="px-3 py-1 bg-[#C72C41] text-white rounded-lg text-xs font-medium">{meta?.current_page ?? 1} / {meta?.last_page ?? 1}</span><button aria-label="Next page" disabled={!meta || meta.current_page >= meta.last_page} onClick={() => setPage((current) => current + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button></div>
        </div>
      </div>
    </div>
  )
}

