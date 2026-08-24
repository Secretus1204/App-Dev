import { useState } from 'react'
import { Eye, EyeOff, LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export default function Profile({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const { user, changePassword } = useAuth()
  const [tab, setTab] = useState<'profile' | 'password'>('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirmation) {
      setError('The new password confirmation does not match.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await changePassword(currentPassword, password, confirmation)
      navigate('/login', { replace: true, state: { notice: 'Password changed successfully. Sign in with your new password.' } })
    } catch (changeError) {
      setError(apiErrorMessage(changeError))
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'AD'

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#A50034] text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-md">{initials}</div>
            <div>
              <h3 className="text-lg font-bold text-[#1A1A2E]">{user?.name ?? 'Administrator'}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-[#A50034] text-white text-xs font-medium rounded-full">Admin</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D9D9D9] shadow-sm overflow-hidden">
          <div className="flex border-b border-[#D9D9D9]">
            <button onClick={() => setTab('profile')} className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'profile' ? 'text-[#C72C41] border-b-2 border-[#C72C41]' : 'text-gray-500 hover:text-[#1A1A2E]'}`}>Account</button>
            <button onClick={() => setTab('password')} className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'password' ? 'text-[#C72C41] border-b-2 border-[#C72C41]' : 'text-gray-500 hover:text-[#1A1A2E]'}`}>Change Password</button>
          </div>

          <div className="p-6">
            {tab === 'profile' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F5F5F5]"><UserRound className="text-[#C72C41]" size={20} /><div><p className="text-xs text-gray-400">Full name</p><p className="text-sm font-medium text-[#1A1A2E]">{user?.name}</p></div></div>
                <div><label className="field-label">Email</label><input readOnly value={user?.email ?? ''} className="form-input bg-gray-50 text-gray-600" /></div>
                <div><label className="field-label">Role</label><input readOnly value="Admin / Librarian" className="form-input bg-gray-50 text-gray-600" /></div>
                <p className="text-xs text-gray-400">Account information is loaded from the authenticated Laravel session. Profile changes are managed from User Management.</p>
              </div>
            ) : (
              <form onSubmit={submitPassword} className="space-y-4">
                {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
                {[
                  ['Current Password', currentPassword, setCurrentPassword, 'current-password'],
                  ['New Password', password, setPassword, 'new-password'],
                  ['Confirm New Password', confirmation, setConfirmation, 'new-password'],
                ].map(([label, value, setter, autoComplete]) => (
                  <div key={label as string}>
                    <label className="field-label">{label as string}</label>
                    <div className="relative">
                      <input required minLength={label === 'Current Password' ? undefined : 8} type={showPassword ? 'text' : 'password'} autoComplete={autoComplete as string} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="form-input pr-10" />
                      <button aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    </div>
                  </div>
                ))}
                <button disabled={saving} type="submit" className="w-full bg-[#C72C41] hover:bg-[#A50034] text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">{saving ? 'Updating...' : 'Update Password'}</button>
              </form>
            )}
          </div>
        </div>

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors"><LogOut size={16} /> Logout</button>
      </div>
    </div>
  )
}
