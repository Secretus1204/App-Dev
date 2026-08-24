import { useEffect, useState } from 'react'
import { Eye, EyeOff, BookOpen } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('jomtravilla21@gmail.com')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const notice = (location.state as { notice?: string } | null)?.notice

  useEffect(() => {
    if (user?.role === 'admin') navigate('/', { replace: true })
  }, [navigate, user])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      setError('Please enter your email address and password.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await login({ email, password }, remember)
      const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(requestedPath ?? '/', { replace: true })
    } catch (loginError) {
      setError(apiErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[45%] bg-[#A50034] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 0%, transparent 60%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)' }} />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <BookOpen size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">Library<br />Management<br />System</h1>
          <p className="text-white/70 text-base mt-4 max-w-xs">Manage the library catalog, members, and borrowing workflow from one secure admin panel.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-2 pb-4 opacity-20">
          {[60, 80, 70, 90, 65, 85, 75].map((height, index) => (
            <div key={index} className="bg-white rounded-t" style={{ width: 18, height }} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F5F5F5]">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#C72C41] rounded-xl flex items-center justify-center">
              <BookOpen size={22} className="text-white" />
            </div>
            <span className="font-bold text-[#1A1A2E]">Library Management System</span>
          </div>

          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your admin account to continue</p>

          {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm mb-5">{notice}</div>}
          {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Email address</label>
              <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#D9D9D9] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C72C41] focus:border-transparent transition-all" placeholder="admin@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#D9D9D9] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C72C41] focus:border-transparent transition-all" placeholder="Enter your password" />
                <button type="button" aria-label={showPass ? 'Hide password' : 'Show password'} onClick={() => setShowPass((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="w-4 h-4 rounded accent-[#C72C41]" />
              Remember me on this device
            </label>
            <button type="submit" disabled={loading} className="w-full bg-[#C72C41] hover:bg-[#A50034] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8">Library Management System · Admin access only</p>
        </div>
      </div>
    </div>
  )
}
