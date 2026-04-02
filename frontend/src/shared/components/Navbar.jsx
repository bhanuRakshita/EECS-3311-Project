import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../lib/api'

const TYPE_LABEL = {
  PAYMENT_SUCCESS: 'Payment',
  BOOKING_REJECTED: 'Booking',
  BOOKING_CANCELLED: 'Booking',
  BOOKING_CONFIRMED: 'Booking',
  BOOKING_REQUESTED: 'Booking',
  PAYMENT_FAILED: 'Payment',
  PAYMENT_REFUNDED: 'Refund',
  POLICY_UPDATED: 'Policy',
}

const TYPE_COLOR = {
  PAYMENT_SUCCESS: 'text-green-400',
  BOOKING_REJECTED: 'text-red-400',
  BOOKING_CANCELLED: 'text-red-400',
  BOOKING_CONFIRMED: 'text-blue-400',
  BOOKING_REQUESTED: 'text-yellow-400',
  PAYMENT_FAILED: 'text-red-400',
  PAYMENT_REFUNDED: 'text-purple-400',
  POLICY_UPDATED: 'text-gray-400',
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Navbar() {
  const { user, logout, roles } = useAuth()
  const navigate = useNavigate()

  const isClient = roles.some((r) => r.toUpperCase() === 'CLIENT')
  const isConsultant = roles.some((r) => r.toUpperCase() === 'CONSULTANT')
  const isAdmin = roles.some((r) => r.toUpperCase() === 'ADMIN')

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const pollRef = useRef(null)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.data.count)
    } catch {
      // ignore
    }
  }, [user])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.data)
    } catch {
      // ignore
    }
  }, [])

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return
    fetchUnread()
    pollRef.current = setInterval(fetchUnread, 30000)
    return () => clearInterval(pollRef.current)
  }, [user, fetchUnread])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = async () => {
    if (!open) {
      await fetchNotifications()
    }
    setOpen((v) => !v)
  }

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#1F2023] border-b border-[#2e303a] px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-semibold text-indigo-400">
        ConsultHub
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/services" className="text-sm text-gray-400 hover:text-white transition-colors">Browse</Link>
        <Link to="/chatbot" className="text-sm text-gray-400 hover:text-white transition-colors">AI Assistant</Link>
        {isClient && (
          <>
            <Link to="/client/bookings" className="text-sm text-gray-400 hover:text-white transition-colors">My Bookings</Link>
            <Link to="/client/payments" className="text-sm text-gray-400 hover:text-white transition-colors">Payments</Link>
          </>
        )}
        {isConsultant && (
          <>
            <Link to="/consultant/services" className="text-sm text-gray-400 hover:text-white transition-colors">My Services</Link>
            <Link to="/consultant/availability" className="text-sm text-gray-400 hover:text-white transition-colors">Availability</Link>
            <Link to="/consultant/bookings" className="text-sm text-gray-400 hover:text-white transition-colors">Bookings</Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link to="/admin/approvals" className="text-sm text-gray-400 hover:text-white transition-colors">Approvals</Link>
            <Link to="/admin/services" className="text-sm text-gray-400 hover:text-white transition-colors">Services</Link>
            <Link to="/admin/policies" className="text-sm text-gray-400 hover:text-white transition-colors">Policies</Link>
          </>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2e303a] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#1F2023] border border-[#2e303a] rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e303a]">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[#2e303a]">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          n.isRead ? 'opacity-60' : 'hover:bg-[#2e303a]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`text-[11px] font-semibold uppercase tracking-wide ${TYPE_COLOR[n.notificationType] ?? 'text-gray-400'}`}>
                              {TYPE_LABEL[n.notificationType] ?? n.notificationType}
                            </span>
                            <p className="text-sm text-gray-200 mt-0.5 leading-snug">{n.payload}</p>
                            <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-400">{user.username || user.sub}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-[#2e303a] hover:bg-[#3a3c48] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
