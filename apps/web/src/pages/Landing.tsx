import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    title: 'Smart Medication Tracking',
    desc: 'Never miss a dose. HealthDose intelligently tracks your medications and reminds you at the right time.',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: 'Health Analytics',
    desc: 'Get detailed insights about your health journey. Visualise trends and share reports with your doctor.',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    title: 'AI Health Assistant',
    desc: 'Chat with our AI assistant for medication information, dosage guidance, and drug interaction checks.',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: 'Secure & Private',
    desc: 'Your health data is encrypted end-to-end. HIPAA-compliant storage ensures your information stays safe.',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    title: 'Smart Reminders',
    desc: 'Customisable notifications that fit your schedule. Get reminders via push, email, or SMS.',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    title: 'Family Health Hub',
    desc: "Manage medications for your entire family. Add family members and track everyone's health from one dashboard.",
  },
]

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '2M+', label: 'Doses Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'App Rating' },
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-[hsl(var(--eg-100))] dark:border-[hsl(var(--eg-900))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--eg-500))] flex items-center justify-center shadow-lg shadow-[hsl(var(--eg-500)/0.3)]">
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
            <span className="text-lg font-bold text-[hsl(var(--eg-700))] dark:text-[hsl(var(--eg-300))] tracking-tight">
              HealthDose
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a
              href="#features"
              className="hover:text-[hsl(var(--eg-600))] transition-colors no-underline hover:no-underline"
            >
              Features
            </a>
            <a
              href="#stats"
              className="hover:text-[hsl(var(--eg-600))] transition-colors no-underline hover:no-underline"
            >
              About
            </a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-[hsl(var(--eg-600))] hover:text-[hsl(var(--eg-700))] transition-colors px-3 py-1.5"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/get-started')}
              className="text-sm font-semibold px-4 py-2 bg-[hsl(var(--eg-500))] hover:bg-[hsl(var(--eg-600))] text-white rounded-xl transition-all shadow-md shadow-[hsl(var(--eg-500)/0.25)] hover:shadow-lg hover:shadow-[hsl(var(--eg-500)/0.35)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-[hsl(var(--eg-400)/0.12)] rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-[hsl(var(--eg-300)/0.08)] rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-[hsl(var(--eg-500)/0.06)] blur-3xl rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--eg-50))] border border-[hsl(var(--eg-200))] text-[hsl(var(--eg-700))] text-sm font-medium mb-8 fade-in-up fade-in-up-delay-1">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--eg-500))] pulse-green" />
            Trusted by 50,000+ health-conscious individuals
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6 fade-in-up fade-in-up-delay-2">
            Your Personal{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--eg-500))] to-[hsl(var(--eg-400))]">
              Health Companion
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed fade-in-up fade-in-up-delay-3">
            Track medications, manage dosages, and stay on top of your health journey. HealthDose
            makes medication management effortless, so you can focus on living well.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-in-up fade-in-up-delay-4">
            <button
              onClick={() => navigate('/get-started')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[hsl(var(--eg-500))] hover:bg-[hsl(var(--eg-600))] text-white font-semibold text-base rounded-2xl transition-all shadow-xl shadow-[hsl(var(--eg-500)/0.35)] hover:shadow-2xl hover:shadow-[hsl(var(--eg-500)/0.45)] hover:-translate-y-1 active:translate-y-0"
            >
              Get Started — It&apos;s Free
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[hsl(var(--eg-300))] text-[hsl(var(--eg-700))] dark:text-[hsl(var(--eg-300))] hover:border-[hsl(var(--eg-500))] hover:bg-[hsl(var(--eg-50))] dark:hover:bg-[hsl(var(--eg-900)/0.5)] font-semibold text-base rounded-2xl transition-all"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Sign In
            </button>
          </div>

          {/* Hero visual — phone mockups */}
          <div className="relative flex justify-center float-anim">
            <div className="relative w-64 h-auto">
              {/* Phone frame */}
              <div className="bg-[hsl(var(--eg-900))] rounded-[2.5rem] p-2 shadow-2xl shadow-[hsl(var(--eg-900)/0.5)] border border-[hsl(var(--eg-700))]">
                {/* Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-[hsl(var(--eg-950))] rounded-full z-10" />
                {/* Screen */}
                <div className="rounded-[2rem] overflow-hidden bg-[hsl(var(--eg-950))] aspect-[9/19]">
                  <div className="flex flex-col h-full">
                    {/* App header */}
                    <div className="bg-[hsl(var(--eg-900))] px-4 pt-10 pb-3 flex items-center justify-between">
                      <span className="text-[hsl(var(--eg-300))] font-semibold text-sm">
                        HealthDose
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-[hsl(var(--eg-400))]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {/* Medication list preview */}
                    {['Aspirin 100mg', 'Metformin 500mg', 'Lisinopril 10mg', 'Vitamin D3'].map(
                      (med, i) => (
                        <div
                          key={med}
                          className="flex items-center gap-3 px-4 py-2.5 border-b border-[hsl(var(--eg-900))]"
                        >
                          <div className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{med[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[hsl(var(--eg-200))] text-xs font-medium truncate">
                              {med}
                            </div>
                            <div className="text-[hsl(var(--eg-600))] text-[10px]">
                              {i === 0
                                ? '8:00 AM · Daily'
                                : i === 1
                                  ? '2:00 PM · Twice daily'
                                  : i === 2
                                    ? 'Bedtime · Daily'
                                    : '9:00 AM · Daily'}
                            </div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-[hsl(var(--eg-400))]" />
                        </div>
                      )
                    )}
                    <div className="flex-1 bg-[hsl(var(--eg-950))]" />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -right-12 top-16 bg-white dark:bg-[hsl(var(--eg-800))] rounded-2xl shadow-xl px-3 py-2 border border-[hsl(var(--eg-100))] dark:border-[hsl(var(--eg-700))]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💊</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-[hsl(var(--eg-200))] whitespace-nowrap">
                      Dose reminder
                    </div>
                    <div className="text-xs text-[hsl(var(--eg-500))]">in 30 min</div>
                  </div>
                </div>
              </div>

              {/* Floating badge 2 */}
              <div className="absolute -left-14 bottom-20 bg-white dark:bg-[hsl(var(--eg-800))] rounded-2xl shadow-xl px-3 py-2 border border-[hsl(var(--eg-100))] dark:border-[hsl(var(--eg-700))]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-[hsl(var(--eg-200))] whitespace-nowrap">
                      Dose taken!
                    </div>
                    <div className="text-xs text-[hsl(var(--eg-500))]">streak: 14 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        id="stats"
        className="py-16 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--eg-50))] dark:bg-[hsl(var(--eg-900)/0.4)]"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-[hsl(var(--eg-600))] dark:text-[hsl(var(--eg-400))] mb-1">
                {s.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Everything you need for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--eg-500))] to-[hsl(var(--eg-400))]">
                better health
              </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              Powerful features designed to simplify your medication management and improve health
              outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-[hsl(var(--eg-100))] dark:border-[hsl(var(--eg-800))] bg-white dark:bg-[hsl(var(--eg-900)/0.5)] hover:border-[hsl(var(--eg-300))] dark:hover:border-[hsl(var(--eg-700))] hover:shadow-lg hover:shadow-[hsl(var(--eg-500)/0.08)] transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--eg-50))] dark:bg-[hsl(var(--eg-800))] text-[hsl(var(--eg-500))] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--eg-500))] group-hover:text-white transition-all duration-200">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-[hsl(var(--eg-600))] to-[hsl(var(--eg-800))] p-10 text-center overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Start your health journey today
              </h2>
              <p className="text-[hsl(var(--eg-200))] text-lg mb-8 max-w-lg mx-auto">
                Join thousands of users who trust HealthDose to manage their medications and improve
                their wellbeing.
              </p>
              <button
                onClick={() => navigate('/get-started')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[hsl(var(--eg-700))] font-bold text-base rounded-2xl hover:bg-[hsl(var(--eg-50))] transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Create Free Account
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[hsl(var(--eg-100))] dark:border-[hsl(var(--eg-900))]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[hsl(var(--eg-500))] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              HealthDose
            </span>
          </div>
          <p className="text-sm text-gray-400">© 2026 HealthDose. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a
              href="#"
              className="hover:text-[hsl(var(--eg-500))] transition-colors no-underline hover:no-underline"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-[hsl(var(--eg-500))] transition-colors no-underline hover:no-underline"
            >
              Terms
            </a>
            <a
              href="#"
              className="hover:text-[hsl(var(--eg-500))] transition-colors no-underline hover:no-underline"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
