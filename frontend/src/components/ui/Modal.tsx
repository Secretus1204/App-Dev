import { X } from 'lucide-react'
import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'

export default function Modal({ title, children, onClose, footer }: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9D9D9]">
          <h3 id={titleId} className="text-base font-semibold text-[#1A1A2E]">{title}</h3>
          <button aria-label="Close dialog" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#C72C41]">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[#D9D9D9] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
