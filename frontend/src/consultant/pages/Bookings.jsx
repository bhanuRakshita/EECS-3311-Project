import { useEffect, useState } from 'react'
import { getConsultantBookings, acceptBooking, rejectBooking, completeBooking, getUsers, getServices } from '../../shared/lib/api'
import { getUserId } from '../../shared/lib/auth'

const STATUS_COLORS = {
  REQUESTED: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PAID: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-gray-500/20 text-gray-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
}

const FILTERS = ['ALL', 'REQUESTED', 'CONFIRMED', 'PAID', 'COMPLETED', 'REJECTED', 'CANCELLED']

export default function ConsultantBookings() {
  const consultantId = getUserId()
  const [bookings, setBookings] = useState([])
  const [usersMap, setUsersMap] = useState({})
  const [servicesMap, setServicesMap] = useState({})
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const status = filter === 'ALL' ? undefined : filter
    try {
      const [bookingsRes, usersRes, servicesRes] = await Promise.all([
        getConsultantBookings(consultantId, status),
        getUsers(),
        getServices(),
      ])
      setBookings(bookingsRes.data)
      const uMap = {}
      for (const u of usersRes.data) uMap[u.id] = u
      setUsersMap(uMap)
      const sMap = {}
      for (const s of servicesRes.data) sMap[s.id] = s
      setServicesMap(sMap)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const action = async (fn, bookingId) => {
    try {
      await fn(consultantId, bookingId)
      load()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Action failed')
    }
  }

  const clientName = (id) => {
    const u = usersMap[id]
    if (!u) return 'Client'
    return u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email ?? 'Client'
  }

  const serviceName = (id) => servicesMap[id]?.title ?? 'Consulting Session'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-4">Booking Requests</h2>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setFilter('ALL')}
          className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2e303a] text-gray-400 hover:bg-[#3a3c48] hover:text-gray-200'
          }`}
        >
          All
        </button>
        <select
          value={filter === 'ALL' ? '' : filter}
          onChange={(e) => setFilter(e.target.value || 'ALL')}
          className="bg-[#2e303a] border border-[#444] text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">Filter by status…</option>
          {FILTERS.filter((f) => f !== 'ALL').map((f) => (
            <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {filter !== 'ALL' && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[filter] ?? 'bg-gray-500/20 text-gray-400'}`}>
            {filter}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading…</div>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500 text-sm">No bookings found.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-[#1F2023] rounded-xl border border-[#2e303a] px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-200">{serviceName(b.serviceId)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">from {clientName(b.clientId)}</p>
                  <p className="text-xs text-gray-600">
                    {b.requestedStartAt ? new Date(b.requestedStartAt).toLocaleString() : '—'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {b.status === 'REQUESTED' && (
                    <>
                      <button
                        onClick={() => action(acceptBooking, b.id)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => action(rejectBooking, b.id)}
                        className="text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === 'PAID' && (
                    <button
                      onClick={() => action(completeBooking, b.id)}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
