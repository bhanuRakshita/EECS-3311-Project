import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { processPayment, getPaymentHistory, getPaymentMethods, addPaymentMethod, deletePaymentMethod, getClientBookings, getServices, getUsers } from '../../shared/lib/api'
import { getUserId } from '../../shared/lib/auth'
import { PaymentMethodSelector } from '../../shared/components/PaymentMethodSelector'

const PAYMENT_TYPES = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER']

const STATUS_COLORS = {
  SUCCESS: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  REFUNDED: 'bg-gray-500/20 text-gray-400',
}

const TYPE_ICONS = {
  CREDIT_CARD: (
    <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="4" fill="#1e40af" />
      <rect x="0" y="8" width="32" height="5" fill="#1d4ed8" />
      <rect x="4" y="15" width="8" height="3" rx="1" fill="#93c5fd" />
    </svg>
  ),
  DEBIT_CARD: (
    <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="4" fill="#065f46" />
      <rect x="0" y="8" width="32" height="5" fill="#047857" />
      <rect x="4" y="15" width="8" height="3" rx="1" fill="#6ee7b7" />
    </svg>
  ),
  PAYPAL: (
    <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="4" fill="#1e3a5f" />
      <text x="4" y="16" fontSize="9" fill="#60a5fa" fontFamily="Arial" fontWeight="bold">PayPal</text>
    </svg>
  ),
  BANK_TRANSFER: (
    <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="24" rx="4" fill="#3b1f6e" />
      <text x="4" y="16" fontSize="8" fill="#c4b5fd" fontFamily="Arial">BANK</text>
    </svg>
  ),
}

function Field({ label, value, onChange, placeholder, type = 'text', required = true }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  )
}

function PaymentFields({ type, fields, set }) {
  if (type === 'CREDIT_CARD' || type === 'DEBIT_CARD') return (
    <>
      <Field label="Card number" value={fields.cardNumber ?? ''} onChange={(v) => set('cardNumber', v)} placeholder="4111 1111 1111 1111" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiry (MM/YY)" value={fields.expiryDate ?? ''} onChange={(v) => set('expiryDate', v)} placeholder="12/26" />
        <Field label="CVV" value={fields.cvv ?? ''} onChange={(v) => set('cvv', v)} placeholder="123" />
      </div>
      <Field label="Cardholder name" value={fields.cardholderName ?? ''} onChange={(v) => set('cardholderName', v)} placeholder="John Doe" />
    </>
  )
  if (type === 'PAYPAL') return (
    <Field label="PayPal email" type="email" value={fields.paypalEmail ?? ''} onChange={(v) => set('paypalEmail', v)} placeholder="you@paypal.com" />
  )
  if (type === 'BANK_TRANSFER') return (
    <>
      <Field label="Account number" value={fields.accountNumber ?? ''} onChange={(v) => set('accountNumber', v)} placeholder="123456789" />
      <Field label="Routing number" value={fields.routingNumber ?? ''} onChange={(v) => set('routingNumber', v)} placeholder="021000021" />
    </>
  )
  return null
}

function PayNowForm({ booking, savedMethods, onSuccess }) {
  const [useSaved, setUseSaved] = useState(savedMethods.length > 0)
  const [selectedMethodId, setSelectedMethodId] = useState(savedMethods[0]?.id ?? null)
  const [type, setType] = useState('CREDIT_CARD')
  const [fields, setFields] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const clientId = getUserId()
      let paymentDetails
      if (useSaved && selectedMethodId) {
        const m = savedMethods.find((m) => m.id === selectedMethodId)
        paymentDetails = { type: m?.paymentType ?? m?.type ?? type }
      } else {
        paymentDetails = {
          type,
          ...fields,
          ...(fields.cardNumber ? { cardNumber: fields.cardNumber.replace(/\s+/g, '') } : {}),
          ...(fields.cvv ? { cvv: fields.cvv.replace(/\s+/g, '') } : {}),
        }
      }
      await processPayment({ bookingId: booking.id, clientId: Number(clientId), amount: booking.amount, paymentDetails })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const selectorMethods = savedMethods.map((m) => ({
    id: m.id,
    icon: TYPE_ICONS[m.paymentType ?? m.type] ?? TYPE_ICONS.CREDIT_CARD,
    label: (m.paymentType ?? m.type ?? '').replace(/_/g, ' '),
    description: m.lastFour ? `•••• ${m.lastFour}` : m.email ?? '',
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {savedMethods.length > 0 && (
        <div className="flex gap-3 mb-2">
          <button type="button" onClick={() => setUseSaved(true)}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${useSaved ? 'bg-indigo-600 text-white' : 'bg-[#2e303a] text-gray-400 hover:text-gray-200'}`}>
            Saved Methods
          </button>
          <button type="button" onClick={() => setUseSaved(false)}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${!useSaved ? 'bg-indigo-600 text-white' : 'bg-[#2e303a] text-gray-400 hover:text-gray-200'}`}>
            New Card
          </button>
        </div>
      )}

      {useSaved && savedMethods.length > 0 ? (
        <PaymentMethodSelector
          title="Select Payment Method"
          actionText=""
          methods={selectorMethods}
          defaultSelectedId={selectorMethods[0]?.id}
          onSelectionChange={setSelectedMethodId}
        />
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Payment method</label>
            <select value={type} onChange={(e) => { setType(e.target.value); setFields({}) }}
              className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <PaymentFields type={type} fields={fields} set={set} />
        </>
      )}

      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
        {loading ? 'Processing…' : `Pay for Booking #${booking.id}`}
      </button>
    </form>
  )
}

function AddMethodForm({ clientId, onAdded }) {
  const [type, setType] = useState('CREDIT_CARD')
  const [fields, setFields] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const sanitized = {
        ...fields,
        ...(fields.cardNumber ? { cardNumber: fields.cardNumber.replace(/\s+/g, '') } : {}),
        ...(fields.cvv ? { cvv: fields.cvv.replace(/\s+/g, '') } : {}),
      }
      await addPaymentMethod(clientId, { type, ...sanitized })
      setFields({})
      onAdded()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save method')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Payment type</label>
        <select value={type} onChange={(e) => { setType(e.target.value); setFields({}) }}
          className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <PaymentFields type={type} fields={fields} set={set} />
      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
        {loading ? 'Saving…' : 'Save Payment Method'}
      </button>
    </form>
  )
}

export default function ClientPayments() {
  const { state } = useLocation()
  const clientId = getUserId()
  const [history, setHistory] = useState([])
  const [methods, setMethods] = useState([])
  const [bookingsMap, setBookingsMap] = useState({})
  const [servicesMap, setServicesMap] = useState({})
  const [usersMap, setUsersMap] = useState({})
  const [paid, setPaid] = useState(false)
  const [showAddMethod, setShowAddMethod] = useState(false)

  const loadAll = async () => {
    try {
      const [histRes, methodsRes, bookingsRes, servicesRes, usersRes] = await Promise.all([
        getPaymentHistory(clientId).catch(() => ({ data: [] })),
        getPaymentMethods(clientId).catch(() => ({ data: [] })),
        getClientBookings(clientId).catch(() => ({ data: [] })),
        getServices().catch(() => ({ data: [] })),
        getUsers().catch(() => ({ data: [] })),
      ])
      setHistory(histRes.data)
      setMethods(methodsRes.data)
      const bMap = {}
      for (const b of bookingsRes.data) bMap[b.id] = b
      setBookingsMap(bMap)
      const sMap = {}
      for (const s of servicesRes.data) sMap[s.id] = s
      setServicesMap(sMap)
      const uMap = {}
      for (const u of usersRes.data) uMap[u.id] = u
      setUsersMap(uMap)
    } catch {}
  }

  useEffect(() => { loadAll() }, [paid])

  const handleDelete = async (methodId) => {
    if (!confirm('Remove this payment method?')) return
    try {
      await deletePaymentMethod(clientId, methodId)
      loadAll()
    } catch { /* ignore */ }
  }

  const selectorMethods = methods.map((m) => ({
    id: m.id,
    icon: TYPE_ICONS[m.paymentType ?? m.type] ?? TYPE_ICONS.CREDIT_CARD,
    label: (m.paymentType ?? m.type ?? '').replace(/_/g, ' '),
    description: m.lastFour ? `•••• ${m.lastFour}` : m.email ?? '',
  }))

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">

      {/* Pay Now (if navigated from bookings) */}
      {state?.booking && !paid && (
        <div className="bg-[#1F2023] rounded-2xl border border-[#2e303a] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {state.booking.serviceName ?? state.booking.serviceTitle ?? 'Complete Payment'}
          </h2>
          <PayNowForm booking={state.booking} savedMethods={methods} onSuccess={() => { setPaid(true); loadAll() }} />
        </div>
      )}
      {paid && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 text-green-400 text-sm font-medium">
          Payment successful!
        </div>
      )}

      {/* Saved Payment Methods */}
      <div>
        <PaymentMethodSelector
          title="Payment Methods"
          actionText={showAddMethod ? '' : 'Add Method'}
          methods={selectorMethods}
          defaultSelectedId={selectorMethods[0]?.id}
          onActionClick={() => setShowAddMethod((v) => !v)}
          onDelete={handleDelete}
        />

        {methods.length === 0 && !showAddMethod && (
          <p className="text-sm text-gray-500 mt-3 px-1">No saved payment methods.</p>
        )}

        {showAddMethod && (
          <div className="mt-4 bg-[#1F2023] rounded-xl border border-[#2e303a] p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200">Add New Method</h3>
              <button onClick={() => setShowAddMethod(false)} className="text-xs text-gray-500 hover:text-gray-300">✕ Cancel</button>
            </div>
            <AddMethodForm clientId={clientId} onAdded={() => { setShowAddMethod(false); loadAll() }} />
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Payment History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((p) => {
              const booking = bookingsMap[p.bookingId]
              const service = booking ? servicesMap[booking.serviceId] : null
              const consultant = booking ? usersMap[booking.consultantId] : null
              const consultantName = consultant
                ? (consultant.firstName && consultant.lastName ? `${consultant.firstName} ${consultant.lastName}` : consultant.email)
                : null
              const date = p.timestamp ? new Date(p.timestamp) : null
              const validDate = date && !isNaN(date)

              return (
                <div key={p.id} className="bg-[#1F2023] rounded-xl border border-[#2e303a] px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-100">
                          {service?.title ?? (p.bookingId ? `Booking #${p.bookingId}` : 'Consulting Session')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[p.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                          {p.status}
                        </span>
                      </div>
                      {consultantName && (
                        <p className="text-sm text-gray-400">with {consultantName}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {validDate && <span>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                        {p.paymentType && <span className="text-gray-600">· {p.paymentType.replace(/_/g, ' ')}</span>}
                        <span className="text-gray-600">· TXN {p.transactionId?.slice(-8)}</span>
                      </div>
                      {p.failureReason && (
                        <p className="text-xs text-red-400">{p.failureReason}</p>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-gray-100 shrink-0">${p.amount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
