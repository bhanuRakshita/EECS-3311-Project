import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientBookings, cancelBooking, getUsers, getServices, getPolicy } from '../../shared/lib/api'
import { getUserId } from '../../shared/lib/auth'

const STATUS_COLORS = {
  REQUESTED: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PAID: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-gray-500/20 text-gray-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
}

export default function ClientBookings() {
  const [bookings, setBookings] = useState([])
  const [usersMap, setUsersMap] = useState({})
  const [servicesMap, setServicesMap] = useState({})
  const [refundPolicy, setRefundPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    const clientId = getUserId()
    try {
      const [bookingsRes, usersRes, servicesRes, policyRes] = await Promise.all([
        getClientBookings(clientId),
        getUsers(),
        getServices(),
        getPolicy('REFUND_POLICY').catch(() => ({ data: null }))
      ])
      setBookings(bookingsRes.data)
      const uMap = {}
      for (const u of usersRes.data) uMap[u.id] = u
      setUsersMap(uMap)
      const sMap = {}
      for (const s of servicesRes.data) sMap[s.id] = s
      setServicesMap(sMap)
      
      if (policyRes.data && policyRes.data.policyValue) {
        setRefundPolicy(JSON.parse(policyRes.data.policyValue))
      }
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const getRefundEstimate = (booking) => {
    if (!refundPolicy || !refundPolicy.tiers || !booking.requestedStartAt) return 100

    const hoursUntilStart = (new Date(booking.requestedStartAt) - new Date()) / (1000 * 60 * 60)
    let refundPercentage = 0

    const applicableTiers = refundPolicy.tiers.filter(tier => hoursUntilStart >= tier.hoursBefore)
    if (applicableTiers.length > 0) {
      const bestTier = applicableTiers.reduce((max, tier) => 
        tier.hoursBefore > max.hoursBefore ? tier : max
      )
      refundPercentage = bestTier.refundPercentage * 100
    }

    return refundPercentage
  }

  const handleCancel = async (booking) => {
    const refundEstimate = booking.status === 'PAID' ? getRefundEstimate(booking) : 100
    const msg = booking.status === 'PAID' ? `Cancel this booking? Based on our policy, you will receive a ${refundEstimate}% refund for this paid booking.` : 'Cancel this booking?'
    
    if (!confirm(msg)) return
    try {
      await cancelBooking(booking.id)
      load()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Could not cancel booking')
    }
  }

  const consultantName = (id) => {
    const u = usersMap[id]
    if (!u) return 'Consultant'
    return u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email ?? 'Consultant'
  }

  const serviceName = (id) => servicesMap[id]?.title ?? 'Consulting Session'

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-6">My Bookings</h2>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No bookings yet.{' '}
          <button className="text-indigo-400 hover:underline" onClick={() => navigate('/client/services')}>
            Browse services
          </button>
        </div>
      )}

      {refundPolicy && refundPolicy.tiers && (
        <div className="mb-6 bg-[#1F2023] rounded-xl border border-[#2e303a] p-4 text-sm">
          <h3 className="font-semibold text-white mb-2">Refund Policy</h3>
          <ul className="text-gray-400 space-y-1">
            {refundPolicy.tiers.sort((a, b) => b.hoursBefore - a.hoursBefore).map((tier, idx) => (
              <li key={idx}>Cancel at least {tier.hoursBefore}h before: {tier.refundPercentage * 100}% refund</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="bg-[#1F2023] rounded-xl border border-[#2e303a] px-5 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-200">{serviceName(b.serviceId)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-gray-400">with {consultantName(b.consultantId)}</p>
              <p className="text-xs text-gray-600">
                {b.requestedStartAt ? new Date(b.requestedStartAt).toLocaleString() : '—'}
              </p>
              {b.rejectionReason && (
                <p className="text-xs text-red-400 mt-1">Reason: {b.rejectionReason}</p>
              )}
            </div>

            <div className="flex gap-2">
              {b.status === 'CONFIRMED' && (
                <button
                  onClick={() => navigate('/client/payments', { state: { booking: { ...b, serviceName: serviceName(b.serviceId), amount: servicesMap[b.serviceId]?.basePrice ?? 1 } } })}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Pay
                </button>
              )}
              {['REQUESTED', 'CONFIRMED', 'PAID'].includes(b.status) && (
                <button
                  onClick={() => handleCancel(b)}
                  className="text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
