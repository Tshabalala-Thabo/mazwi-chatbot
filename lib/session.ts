import { cookies } from 'next/headers';
import { User } from './auth';

const SESSION_COOKIE_NAME = 'prosuite_session';

export async function createSession(user: User) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenant_id
  });
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }
    
    const sessionData = JSON.parse(sessionCookie.value);
    return {
      id: sessionData.userId,
      email: sessionData.email,
      name: sessionData.name,
      tenant_id: sessionData.tenantId
    };
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
