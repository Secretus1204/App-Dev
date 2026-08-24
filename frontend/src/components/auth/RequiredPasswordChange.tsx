import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export default function RequiredPasswordChange() {
  const navigate = useNavigate()
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#D9D9D9] w-full max-w-md p-6">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-[#C72C41] flex items-center justify-center mb-4"><KeyRound size={23} /></div>
        <h2 className="text-xl font-bold text-[#1A1A2E]">Change your temporary password</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">For security, the seeded Admin password must be replaced before using the admin panel.</p>
        {error && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="field-label">Current Password</label><input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-input" /></div>
          <div><label className="field-label">New Password</label><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-input" /><p className="text-xs text-gray-400 mt-1">Use at least 8 characters and do not reuse the temporary password.</p></div>
          <div><label className="field-label">Confirm New Password</label><input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="form-input" /></div>
          <button disabled={saving} type="submit" className="w-full px-4 py-2.5 bg-[#C72C41] hover:bg-[#A50034] text-white rounded-lg text-sm font-semibold disabled:opacity-60">{saving ? 'Changing password...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  )
}

