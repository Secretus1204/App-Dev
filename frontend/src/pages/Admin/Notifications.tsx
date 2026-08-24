import { AlertTriangle, Bell, BookOpen, CheckCircle, RotateCcw } from 'lucide-react'
import { apiErrorMessage } from '@/api/client'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications'
import type { LibraryNotification } from '@/types/notification'

const icons: Record<string, typeof Bell> = {
  borrow_request_submitted: BookOpen,
  borrow_request_reviewed: CheckCircle,
  loan_created: BookOpen,
  loan_due_soon: AlertTriangle,
  loan_returned: RotateCcw,
  loan_overdue: AlertTriangle,
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function NotificationRow({ notification, onRead }: { notification: LibraryNotification; onRead: (id: string) => void }) {
  const Icon = icons[notification.type] ?? Bell
  return <div className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50/50 ${notification.is_read ? '' : 'bg-red-50/20'}`}><div className="w-9 h-9 rounded-full bg-red-50 text-[#C72C41] flex items-center justify-center shrink-0"><Icon size={16} /></div><div className="flex-1"><p className="text-xs font-semibold text-gray-500 mb-0.5">{notification.title}</p><p className="text-sm leading-snug">{notification.message}</p><p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p></div>{!notification.is_read && <button onClick={() => onRead(notification.id)} className="text-xs text-[#C72C41] hover:underline shrink-0">Mark read</button>}</div>
}

export default function Notifications() {
  const query = useNotifications(50)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const notifications = query.data?.data ?? []

  return <div className="p-6"><div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#D9D9D9] shadow-sm overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-[#D9D9D9]"><div><h3 className="font-semibold">All Notifications</h3><p className="text-xs text-gray-400">{query.data?.meta?.unread_count ?? 0} unread</p></div><button disabled={markAll.isPending || (query.data?.meta?.unread_count ?? 0) === 0} onClick={() => markAll.mutate()} className="text-xs text-[#C72C41] font-medium hover:underline disabled:opacity-40">Mark all as read</button></div><div className="divide-y divide-[#F5F5F5]">{query.isLoading && <p className="py-12 text-center text-sm text-gray-400">Loading notifications...</p>}{query.isError && <p className="py-12 text-center text-sm text-red-600">{apiErrorMessage(query.error)}</p>}{notifications.map((notification) => <NotificationRow key={notification.id} notification={notification} onRead={(id) => markRead.mutate(id)} />)}{!query.isLoading && !query.isError && notifications.length === 0 && <div className="py-14 text-center text-gray-400"><Bell size={30} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No notifications yet.</p></div>}</div></div></div>
}
