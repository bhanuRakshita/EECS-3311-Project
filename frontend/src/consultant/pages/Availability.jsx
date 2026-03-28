import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAvailability, createSlot, deleteSlot, getServices } from '../../shared/lib/api'
import { getUserId } from '../../shared/lib/auth'
import { Trash2 } from 'lucide-react'

export default function ConsultantAvailability() {
  const consultantId = getUserId()
  const location = useLocation()
  const preselectedServiceId = location.state?.serviceId ?? ''

  const [slots, setSlots] = useState([])
  const [services, setServices] = useState([])
  const [servicesMap, setServicesMap] = useState({})
  const [showForm, setShowForm] = useState(!!preselectedServiceId)
  const [form, setForm] = useState({ serviceId: preselectedServiceId, startAt: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    getAvailability(consultantId).then((r) => setSlots(r.data)).catch(() => {})
  }

  useEffect(() => {
    load()
    getServices().then((r) => {
      setServices(r.data)
      const map = {}
      for (const s of r.data) map[s.id] = s
      setServicesMap(map)
    }).catch(() => {})
  }, [])

  const selectedService = services.find((s) => String(s.id) === String(form.serviceId))
  const durationMinutes = selectedService?.durationMinutes ?? null
  const computedEndAt = form.startAt && durationMinutes
    ? new Date(new Date(form.startAt).getTime() + durationMinutes * 60000)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!computedEndAt) { setError('Select a service and start time'); return }
    setLoading(true)
    try {
      await createSlot(consultantId, {
        serviceId: parseInt(form.serviceId),
        startAt: new Date(form.startAt).toISOString(),
        endAt: computedEndAt.toISOString(),
      })
      setForm({ serviceId: '', startAt: '' })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create slot')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slotId) => {
    if (!confirm('Delete this slot?')) return
    try {
      await deleteSlot(consultantId, slotId)
      load()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete slot')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Availability</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Slot'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1F2023] rounded-xl border border-[#2e303a] p-5 mb-6 space-y-4">
          <h3 className="font-medium text-gray-200">New Availability Slot</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Service</label>
            <select
              required
              value={form.serviceId}
              onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
              className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start</label>
              <input
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End <span className="text-gray-600 font-normal">(auto — {durationMinutes ? `${durationMinutes} min` : 'select service'})</span>
              </label>
              <div className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-500">
                {computedEndAt ? computedEndAt.toLocaleString() : '—'}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Slot'}
          </button>
        </form>
      )}

      {slots.length === 0 ? (
        <p className="text-gray-500 text-sm">No slots yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="group bg-[#1F2023] rounded-xl border border-[#2e303a] px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {servicesMap[slot.serviceId]?.title ?? 'Service'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(slot.startAt).toLocaleString()} — {new Date(slot.endAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(slot.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
                title="Delete slot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
