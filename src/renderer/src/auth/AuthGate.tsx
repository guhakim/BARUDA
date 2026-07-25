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

  if (loading) return <p>Loading...</p>

  if (!session) {
    return (
      <div style={{ maxWidth: 320 }}>
        <h3>로그인</h3>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="button" onClick={() => signIn(email, password)}>
          로그인
        </button>
        <button type="button" onClick={() => signUp(email, password)} style={{ marginLeft: 8 }}>
          회원가입
        </button>
      </div>
    )
  }

  return <>{children(session)}</>
}

export default AuthGate
