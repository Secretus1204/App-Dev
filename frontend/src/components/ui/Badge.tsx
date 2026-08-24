type BadgeVariant = 'available' | 'unavailable' | 'limited' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'borrowed' | 'returned' | 'overdue' | 'due-soon' | 'active' | 'inactive' | 'lost' | 'damaged' | 'archived'

const styles: Record<BadgeVariant, string> = {
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unavailable: 'bg-gray-100 text-gray-500 border border-gray-200',
  limited: 'bg-amber-50 text-amber-700 border border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
  borrowed: 'bg-blue-50 text-blue-700 border border-blue-200',
  returned: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  overdue: 'bg-red-50 text-red-600 border border-red-200',
  'due-soon': 'bg-orange-50 text-orange-600 border border-orange-200',
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
  lost: 'bg-red-50 text-red-600 border border-red-200',
  damaged: 'bg-orange-50 text-orange-700 border border-orange-200',
  archived: 'bg-gray-100 text-gray-500 border border-gray-200',
}

export default function Badge({ variant, label }: { variant: BadgeVariant; label?: string }) {
  const text = label ?? variant.charAt(0).toUpperCase() + variant.slice(1).replace('-', ' ')
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {text}
    </span>
  )
}
