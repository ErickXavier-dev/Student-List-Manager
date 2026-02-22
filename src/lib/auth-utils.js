import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;

  try {
    const session = JSON.parse(token);
    if (session && typeof session === 'object' && session.authenticated) {
      return session;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function isHOD(session) {
  return session?.role === 'hod';
}

export function isTeacher(session) {
  return session?.role === 'teacher';
}

export function isRep(session) {
  return session?.role === 'rep';
}
