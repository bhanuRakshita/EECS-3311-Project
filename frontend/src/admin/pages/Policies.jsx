import { useState } from 'react'
import { updatePolicy } from '../../shared/lib/api'

const KEY_TEMPLATES = {
  '': '',
  'PRICING_STRATEGY': JSON.stringify({ strategyType: 'DYNAMIC', dynamicMultiplier: 1.2, discountPercentage: 0.15 }, null, 2),
  'REFUND_POLICY': JSON.stringify({ tiers: [ { hoursBefore: 24, refundPercentage: 1.0 }, { hoursBefore: 12, refundPercentage: 0.4 }, { hoursBefore: 5, refundPercentage: 0.1 } ] }, null, 2),
  'NOTIFICATION_SETTINGS': JSON.stringify({ emailEnabled: true, smsEnabled: false, pushEnabled: false }, null, 2),
  'MODEL': JSON.stringify({ provider: 'Google', model_name: 'gemini-1.5-pro', temperature: 0.7 }, null, 2),
  'CANCELLATION_RULES': JSON.stringify({ allowed: true, penalty_fee: 50 }, null, 2)
}

export default function AdminPolicies() {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await updatePolicy(key, { value, description })
      setSuccess(`Policy "${key}" saved.`)
      setKey('')
      setValue('')
      setDescription('')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save policy')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-6">System Policies</h2>

      <div className="bg-[#1F2023] rounded-xl border border-[#2e303a] p-6">
        <p className="text-sm text-gray-500 mb-4">
          Create or update a system-wide policy by key. Existing keys are overwritten.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Policy key</label>
            <select
              required
              value={key}
              onChange={(e) => {
                const newKey = e.target.value
                setKey(newKey)
                if (KEY_TEMPLATES[newKey] !== undefined) {
                  setValue(KEY_TEMPLATES[newKey])
                }
              }}
              className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="" disabled>Select a policy key...</option>
              <option value="PRICING_STRATEGY">PRICING_STRATEGY</option>
              <option value="REFUND_POLICY">REFUND_POLICY</option>
              <option value="NOTIFICATION_SETTINGS">NOTIFICATION_SETTINGS</option>
              <option value="MODEL">MODEL</option>
              <option value="CANCELLATION_RULES">CANCELLATION_RULES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Value (JSON)</label>
            <textarea
              required
              rows={6}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. { ... }"
              className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this policy controls"
              className="w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {success && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">{success}</div>
          )}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Policy'}
          </button>
        </form>
      </div>
    </div>
  )
}
