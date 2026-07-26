import { useState, type FormEvent } from 'react'
import PostureCamera from './posture/PostureCamera'
import Dashboard from './dashboard/Dashboard'

const CONTACT_EMAIL = 'felpen@naver.com'

function MiniBarIcon(): React.JSX.Element {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1a1a1a"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={16} width={18} height={5} rx={1.5} />
      <path d="M6 4v9M18 4v9M6 13l3-3M18 13l-3-3" />
    </svg>
  )
}

function MailIcon(): React.JSX.Element {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1a1a1a"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="M3 7l9 6l9-6" />
    </svg>
  )
}

function ContactModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    const subject = encodeURIComponent(`[BARUDA 문의] ${name}`)
    const body = encodeURIComponent(`이름: ${name}\n이메일: ${email}\n\n${message}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>문의하기</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {submitted ? (
          <p className="hint">문의가 접수되었습니다. 감사합니다!</p>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              className="field"
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="field"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea
              className="field contact-textarea"
              placeholder="문의 내용"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">
              문의 보내기
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Auth + billing (see auth/, billing/) are wired up but not shown yet —
// signup and subscription are deferred, so the dashboard renders unlocked.
function App(): React.JSX.Element {
  const [showStats, setShowStats] = useState(false)
  const [showContact, setShowContact] = useState(false)

  return (
    <div className="app">
      <header className="app-header row">
        <button
          type="button"
          className="icon-btn"
          onClick={() => window.electron.ipcRenderer.send('minibar:show')}
          aria-label="작은 바로 보기"
          title="작은 바로 보기"
        >
          <MiniBarIcon />
        </button>
        <div>
          <h1>BARUDA</h1>
          <p>바른 자세를 자연스럽게</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowContact(true)}
            aria-label="문의하기"
          >
            <MailIcon />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowStats((v) => !v)}
            aria-label="자세 데이터 보기"
          >
            ☰
          </button>
        </div>
      </header>
      <PostureCamera />
      {showStats && <Dashboard />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  )
}

export default App
