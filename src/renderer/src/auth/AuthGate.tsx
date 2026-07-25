import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useAuth } from './useAuth'

interface AuthGateProps {
  children: (session: Session) => React.ReactNode
}

function AuthGate({ children }: AuthGateProps): React.JSX.Element {
  const { session, loading, error, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
