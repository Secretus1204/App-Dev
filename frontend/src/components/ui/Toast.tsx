import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

const icons = { success: CheckCircle, error: XCircle, info: AlertCircle }
const colors = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
}

export default function Toast({ message, type = 'success', onClose }: {
  message: string
  type?: ToastType
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = icons[type]
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl text-sm font-medium max-w-sm ${colors[type]}`}>
      <Icon size={18} />
      {message}
    </div>
  )
}
