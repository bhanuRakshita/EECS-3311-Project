import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

export default function Navbar() {
  const { user, logout, roles } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isClient = roles.some((r) => r.toUpperCase() === 'CLIENT')
  const isConsultant = roles.some((r) => r.toUpperCase() === 'CONSULTANT')
  const isAdmin = roles.some((r) => r.toUpperCase() === 'ADMIN')

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
