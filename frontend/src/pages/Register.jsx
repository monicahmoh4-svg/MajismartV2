import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Droplets } from 'lucide-react'

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Machakos','Kakamega','Meru','Kilifi','Uasin Gishu','Other']
const ROLES = [
  { value: 'admin', label: 'System Admin' },
  { value: 'county_officer', label: 'County Water Officer' },
  { value: 'operator', label: 'Node Operator' },
  { value: 'community', label: 'Community Manager' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'operator', county:'', phone:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form)
      navigate('/app/dashboard')
    } catch (err) {
      console.error('Registration error details:', err)
      // Extract the real error message from Axios or fallback to a helpful hint
      const errorMsg = err?.error || err?.response?.data?.error || err?.message || 'Registration failed. Please check your network connection or ensure VITE_API_URL is set correctly in Vercel.'
      setError(errorMsg)
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Droplets className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">Join MajiSmart Kenya</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={submit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input id="name" name="name" type="text" required value={form.name} onChange={set('name')} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Full name" />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Phone number</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={set('phone')} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Phone number" />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input id="email" name="email" type="email" required value={form.email} onChange={set('email')} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required value={form.password} onChange={set('password')} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Password" />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
              <select id="role" name="role" value={form.role} onChange={set('role')} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700">County</label>
              <select id="county" name="county" value={form.county} onChange={set('county')} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 text-sm">
            Already registered? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
