import { cookies } from 'next/headers';

export interface Session {
  authenticated: boolean;
  role: 'hod' | 'teacher' | 'rep';
  classId?: string;
  name?: string;
  [key: string]: any;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;

  try {
    const session = JSON.parse(token) as Session;
    if (session && typeof session === 'object' && session.authenticated) {
      return session;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function isHOD(session: Session | null): boolean {
  return session?.role === 'hod';
}

export function isTeacher(session: Session | null): boolean {
  return session?.role === 'teacher';
}

export function isRep(session: Session | null): boolean {
  return session?.role === 'rep';
}
