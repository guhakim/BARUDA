import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useAuth } from './useAuth'
import { MOCK_AUTH_ENABLED } from '../lib/devMock'

interface AuthGateProps {
  children: (session: Session) => React.ReactNode
}

const MOCK_SESSION = {
  user: { id: 'mock-user-id', email: 'mock@local.test' },
  access_token: 'mock-access-token'
} as unknown as Session

function AuthGate({ children }: AuthGateProps): React.JSX.Element {
  const { session, loading, error, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (MOCK_AUTH_ENABLED) return <>{children(MOCK_SESSION)}</>

  if (loading) return <div className="card hint">불러오는 중...</div>

  if (!session) {
    return (
      <div className="card">
        <input
          type="email"
          placeholder="이메일"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => signIn(email, password)}>
            로그인
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => signUp(email, password)}>
            회원가입
          </button>
        </div>
      </div>
    )
  }

  return <>{children(session)}</>
}

export default AuthGate
