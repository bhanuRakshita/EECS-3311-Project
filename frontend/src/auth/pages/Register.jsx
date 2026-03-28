import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../../shared/lib/api'

const inputCls =
  'w-full bg-[#16171d] border border-[#333333] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

function RegisterForm({ role, onBack }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', adminCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const isConsultant = role === 'CONSULTANT'
  const isAdmin = role === 'ADMIN'

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, role })
      navigate('/login', {
        state: {
          message: isConsultant
            ? 'Application submitted! Please log in — your account will be active once an admin approves it.'
            : 'Account created! Please log in.',
        },
      })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.length) {
        setError(data.errors.map((e) => `${e.field}: ${e.message}`).join(', '))
      } else {
        setError(data?.message ?? data?.error ?? 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const badge = isAdmin
    ? 'bg-red-500/15 text-red-400'
    : isConsultant
    ? 'bg-indigo-500/15 text-indigo-400'
    : 'bg-green-500/15 text-green-400'

  const badgeLabel = isAdmin ? 'Admin Account' : isConsultant ? 'Consultant Application' : 'Client Account'

  return (
    <div className="w-full max-w-sm bg-[#1F2023] rounded-2xl border border-[#2e303a] p-8">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mb-5 transition-colors">
        ← Back
      </button>

      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${badge}`}>
          {badgeLabel}
        </div>
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        {isConsultant && (
          <p className="text-sm text-gray-400 mt-1">
            Your application will be reviewed and approved by an admin before you can accept bookings.
          </p>
        )}
        {isAdmin && (
          <p className="text-sm text-gray-400 mt-1">
            Admin registration requires a secret code.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">First name</label>
            <input name="firstName" required value={form.firstName} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Last name</label>
            <input name="lastName" required value={form.lastName} onChange={handleChange} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <input type="password" name="password" required value={form.password} onChange={handleChange} className={inputCls} />
        </div>
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Code</label>
            <input
              type="password"
              name="adminCode"
              required
              value={form.adminCode}
              onChange={handleChange}
              placeholder="Enter admin registration code"
              className={inputCls}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : isConsultant ? 'Submit Application' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export default function Register() {
  const [role, setRole] = useState(null)

  if (role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#16171d] p-4">
        <RegisterForm role={role} onBack={() => setRole(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#16171d] p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Join ConsultHub</h1>
          <p className="text-gray-400 mt-2">How would you like to use the platform?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Client */}
          <button
            onClick={() => setRole('CLIENT')}
            className="bg-[#1F2023] hover:bg-[#2a2c32] border border-[#2e303a] hover:border-green-500/50 rounded-2xl p-6 text-left transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white text-lg mb-1">I'm a Client</h2>
            <p className="text-sm text-gray-400">
              Browse services, book sessions, and manage payments.
            </p>
            <div className="mt-4 text-sm font-medium text-green-400 group-hover:text-green-300">
              Get started →
            </div>
          </button>

          {/* Consultant */}
          <button
            onClick={() => setRole('CONSULTANT')}
            className="bg-[#1F2023] hover:bg-[#2a2c32] border border-[#2e303a] hover:border-indigo-500/50 rounded-2xl p-6 text-left transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white text-lg mb-1">I'm a Consultant</h2>
            <p className="text-sm text-gray-400">
              Offer expertise, set availability, and manage bookings.
            </p>
            <div className="mt-4 flex flex-col gap-0.5">
              <span className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300">Apply now →</span>
              <span className="text-xs text-gray-600">Requires admin approval</span>
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => setRole('ADMIN')}
            className="bg-[#1F2023] hover:bg-[#2a2c32] border border-[#2e303a] hover:border-red-500/50 rounded-2xl p-6 text-left transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white text-lg mb-1">I'm an Admin</h2>
            <p className="text-sm text-gray-400">
              Manage consultants, services, and platform policies.
            </p>
            <div className="mt-4 flex flex-col gap-0.5">
              <span className="text-sm font-medium text-red-400 group-hover:text-red-300">Register →</span>
              <span className="text-xs text-gray-600">Requires admin code</span>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
