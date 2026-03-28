import { useEffect, useState } from 'react'
import { getServices, createAdminService } from '../../shared/lib/api'

const SERVICE_TYPES = ['CAREER', 'INTERVIEW', 'RESUME', 'MENTORING', 'LEGAL', 'FINANCIAL', 'TECH', 'BUSINESS']

const TYPE_COLORS = {
  CAREER: 'bg-blue-500/20 text-blue-400',
  INTERVIEW: 'bg-purple-500/20 text-purple-400',
  RESUME: 'bg-green-500/20 text-green-400',
  MENTORING: 'bg-orange-500/20 text-orange-400',
  LEGAL: 'bg-red-500/20 text-red-400',
  FINANCIAL: 'bg-emerald-500/20 text-emerald-400',
  TECH: 'bg-indigo-500/20 text-indigo-400',
  BUSINESS: 'bg-yellow-500/20 text-yellow-400',
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ serviceType: 'CAREER', title: '', description: '', durationMinutes: '', basePrice: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const load = () => {
    getServices()
      .then((r) => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await createAdminService({
        serviceType: form.serviceType,
        title: form.title,
        description: form.description,
        durationMinutes: parseInt(form.durationMinutes),
        basePrice: parseFloat(form.basePrice),
      })
      setSuccess(`Service "${form.title}" created.`)
      setForm({ serviceType: 'CAREER', title: '', description: '', durationMinutes: '', basePrice: '' })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create service')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Platform Services</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setError(''); setSuccess('') }}
          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Service'}
        </button>
      </div>

      {success && (
        <div className="mb-4 text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">{success}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1F2023] rounded-xl border border-[#2e303a] p-5 mb-6 space-y-4">
          <h3 className="font-medium text-gray-200">New Service</h3>

          <Field label="Service type">
            <select value={form.serviceType} onChange={(e) => set('serviceType', e.target.value)} className={inputCls}>
              {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Title">
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Career Strategy Session" className={inputCls} />
          </Field>

          <Field label="Description (optional)">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={2} placeholder="Brief description…" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (minutes)">
              <input required type="number" min="1" value={form.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)} placeholder="60" className={inputCls} />
            </Field>
            <Field label="Base price ($)">
              <input required type="number" min="0.01" step="0.01" value={form.basePrice}
                onChange={(e) => set('basePrice', e.target.value)} placeholder="99.99" className={inputCls} />
            </Field>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
            {submitting ? 'Creating…' : 'Create Service'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : services.length === 0 ? (
        <p className="text-gray-500 text-sm">No services yet. Create one above.</p>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => {
            const color = TYPE_COLORS[svc.serviceType?.toUpperCase()] ?? 'bg-gray-500/20 text-gray-400'
            return (
              <div key={svc.id} className="bg-[#1F2023] rounded-xl border border-[#2e303a] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-100">{svc.title}</p>
                      {svc.serviceType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${color}`}>
                          {svc.serviceType}
                        </span>
                      )}
                    </div>
                    {svc.description && <p className="text-sm text-gray-500">{svc.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-200">${Number(svc.basePrice).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{svc.durationMinutes} min</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
