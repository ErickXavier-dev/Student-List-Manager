import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import { Class } from '@/models/Schemas';

export async function POST(request) {
  try {
    const { password, role, classId } = await request.json();
    await dbConnect();

    // 1. HOD Login
    if (role === 'hod') {
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      if (!ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Server misconfiguration: ADMIN_PASSWORD not set' }, { status: 500 });
      }

      if (password === ADMIN_PASSWORD) {
        await setAuthCookie('hod', null);
        return NextResponse.json({ success: true, role: 'hod' });
      }
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // 2. Teacher or Rep Login
    if (!classId) return NextResponse.json({ error: 'Class must be selected' }, { status: 400 });

    const targetClass = await Class.findById(classId);
    if (!targetClass) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const isTeacher = role === 'teacher';
    const classPassword = isTeacher ? targetClass.teacherPassword : targetClass.repPassword;
    const expiry = isTeacher ? targetClass.teacherPasswordExpires : targetClass.repPasswordExpires;
    const isRevoked = isTeacher ? targetClass.teacherPasswordRevoked : targetClass.repPasswordRevoked;

    if (!classPassword) {
      return NextResponse.json({ error: 'Password not set for this role' }, { status: 401 });
    }

    if (password !== classPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (isRevoked) {
      return NextResponse.json({ error: 'Password has been revoked' }, { status: 401 });
    }

    if (expiry && new Date() > new Date(expiry)) {
      return NextResponse.json({ error: 'Password has expired' }, { status: 401 });
    }

    await setAuthCookie(role, classId);
    return NextResponse.json({ success: true, role });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function setAuthCookie(role, classId) {
  const cookieData = JSON.stringify({ role, classId, authenticated: true });
  (await cookies()).set('admin_token', cookieData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

