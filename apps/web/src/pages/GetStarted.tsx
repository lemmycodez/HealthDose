import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const steps = [
  { label: 'Account', icon: '👤' },
  { label: 'Health Profile', icon: '💊' },
  { label: 'Preferences', icon: '⚙️' },
]

export function GetStarted() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Health profile (decorative for now)
  const [conditions, setConditions] = useState<string[]>([])
  const [reminderPref, setReminderPref] = useState('push')

  const conditionOptions = [
    'Diabetes',
    'Hypertension',
    'Asthma',
    'Heart Disease',
    'Arthritis',
    'None',
  ]

  const toggleCondition = (c: string) => {
    if (c === 'None') {
      setConditions(['None'])
      return
    }
    setConditions(prev => {
      const without = prev.filter(x => x !== 'None')
      return without.includes(c) ? without.filter(x => x !== c) : [...without, c]
    })
  }

  const validateStep0 = () => {
    if (!name.trim()) {
      setError('Please enter your name.')
      return false
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return false
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password)
      navigate('/app')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('email-already-in-use')) {
        setError('An account with this email already exists.')
      } else if (message.includes('weak-password')) {
        setError('Password is too weak. Please choose a stronger password.')
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[hsl(var(--eg-950))]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[hsl(var(--eg-500))] to-[hsl(var(--eg-800))] items-center justify-center overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative text-center px-12">
          {/* Logo */}
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={1.5}
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">Join HealthDose</h2>
          <p className="text-[hsl(var(--eg-100))] text-lg leading-relaxed">
            Start your personalised health management journey today. It only takes 2 minutes.
          </p>

          {/* Progress illustration */}
          <div className="mt-12 space-y-4">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${i <= step ? 'bg-white/15' : 'bg-white/5'}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${i < step ? 'bg-[hsl(var(--eg-400))] text-white' : i === step ? 'bg-white text-[hsl(var(--eg-700))]' : 'bg-white/20 text-white/50'}`}
                >
                  {i < step ? '✓' : s.icon}
                </div>
                <div className="text-left">
                  <div
                    className={`font-semibold text-sm ${i <= step ? 'text-white' : 'text-white/50'}`}
                  >
                    Step {i + 1}
                  </div>
                  <div
                    className={`text-sm ${i <= step ? 'text-[hsl(var(--eg-100))]' : 'text-white/40'}`}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--eg-500))] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <span className="font-bold text-[hsl(var(--eg-700))]">HealthDose</span>
          </div>

          {/* Mobile step indicator */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-[hsl(var(--eg-500))] text-white' : i === step ? 'bg-[hsl(var(--eg-500))] text-white' : 'bg-gray-200 dark:bg-[hsl(var(--eg-800))] text-gray-400'}`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px w-8 ${i < step ? 'bg-[hsl(var(--eg-500))]' : 'bg-gray-200 dark:bg-[hsl(var(--eg-800))]'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              {step === 0
                ? 'Create your account'
                : step === 1
                  ? 'Your health profile'
                  : 'Almost there!'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {step === 0 ? (
                <>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-[hsl(var(--eg-600))] dark:text-[hsl(var(--eg-400))] font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </>
              ) : step === 1 ? (
                'Help us personalise your experience.'
              ) : (
                'Set your notification preferences.'
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-red-500 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form
            onSubmit={
              step === 2
                ? handleSubmit
                : e => {
                    e.preventDefault()
                    handleNext()
                  }
            }
          >
            {/* Step 0 — account details */}
            {step === 0 && (
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-gray-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[hsl(var(--eg-200))] dark:border-[hsl(var(--eg-800))] bg-white dark:bg-[hsl(var(--eg-900))] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--eg-500))] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-gray-400"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[hsl(var(--eg-200))] dark:border-[hsl(var(--eg-800))] bg-white dark:bg-[hsl(var(--eg-900))] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--eg-500))] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-gray-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-[hsl(var(--eg-200))] dark:border-[hsl(var(--eg-800))] bg-white dark:bg-[hsl(var(--eg-900))] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--eg-500))] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${password.length >= i * 2 ? (i <= 2 ? 'bg-red-400' : i === 3 ? 'bg-yellow-400' : 'bg-[hsl(var(--eg-500))]') : 'bg-gray-200 dark:bg-[hsl(var(--eg-800))]'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-gray-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-[hsl(var(--eg-900))] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--eg-500))] focus:border-transparent transition-all ${confirm && confirm !== password ? 'border-red-400' : 'border-[hsl(var(--eg-200))] dark:border-[hsl(var(--eg-800))]'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 — health profile */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Do you have any of these conditions? (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {conditionOptions.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleCondition(c)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${conditions.includes(c) ? 'border-[hsl(var(--eg-500))] bg-[hsl(var(--eg-50))] dark:bg-[hsl(var(--eg-800))] text-[hsl(var(--eg-700))] dark:text-[hsl(var(--eg-300))]' : 'border-gray-200 dark:border-[hsl(var(--eg-800))] text-gray-600 dark:text-gray-400 hover:border-[hsl(var(--eg-300))]'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[hsl(var(--eg-50))] dark:bg-[hsl(var(--eg-900)/0.5)] border border-[hsl(var(--eg-200))] dark:border-[hsl(var(--eg-800))]">
                  <p className="text-sm text-[hsl(var(--eg-700))] dark:text-[hsl(var(--eg-300))]">
                    This information helps us personalise medication reminders and health tips for
                    you. You can update it anytime in your profile settings.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2 — preferences */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How would you like to receive reminders?
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'push',
                        label: 'Push notifications',
                        desc: 'Get alerts on your device',
                        icon: '📱',
                      },
                      {
                        value: 'email',
                        label: 'Email',
                        desc: 'Reminders sent to your inbox',
                        icon: '📧',
                      },
                      {
                        value: 'both',
                        label: 'Both',
                        desc: 'Push and email notifications',
                        icon: '🔔',
                      },
                    ].map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setReminderPref(opt.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${reminderPref === opt.value ? 'border-[hsl(var(--eg-500))] bg-[hsl(var(--eg-50))] dark:bg-[hsl(var(--eg-800)/0.5)]' : 'border-gray-200 dark:border-[hsl(var(--eg-800))] hover:border-[hsl(var(--eg-300))]'}`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {opt.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</div>
                        </div>
                        {reminderPref === opt.value && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-[hsl(var(--eg-500))] flex items-center justify-center">
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3 h-3 text-white"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3.5 px-6 border border-[hsl(var(--eg-200))] dark:border-[hsl(var(--eg-800))] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-[hsl(var(--eg-50))] dark:hover:bg-[hsl(var(--eg-900))] transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-6 bg-[hsl(var(--eg-500))] hover:bg-[hsl(var(--eg-600))] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all shadow-lg shadow-[hsl(var(--eg-500)/0.3)] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Creating account…
                  </>
                ) : step < 2 ? (
                  'Continue'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Back to home */}
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full py-3 text-sm text-gray-400 hover:text-[hsl(var(--eg-500))] transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}
