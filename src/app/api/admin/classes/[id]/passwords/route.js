import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Class } from '@/models/Schemas';
import { getSession, isHOD, isTeacher } from '@/lib/auth-utils';

export async function PUT(request, { params }) {
  await dbConnect();
  const session = await getSession();
  const { id } = await params;

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { targetRole, password, action } = await request.json(); // targetRole: 'teacher' or 'rep', action: 'update' or 'revoke'

    // Auth Check: 
    // HOD can manage both.
    // Teacher can ONLY manage Rep of THEIR class.
    const canManage = isHOD(session) || (isTeacher(session) && session.classId === id && targetRole === 'rep');

    if (!canManage) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const targetClass = await Class.findById(id);
    if (!targetClass) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    if (action === 'revoke') {
      if (targetRole === 'teacher') targetClass.teacherPasswordRevoked = true;
      else targetClass.repPasswordRevoked = true;
    } else {
      // Update password with 6 months validity
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 6);

      if (targetRole === 'teacher') {
        targetClass.teacherPassword = password;
        targetClass.teacherPasswordExpires = expiry;
        targetClass.teacherPasswordRevoked = false;
      } else {
        targetClass.repPassword = password;
        targetClass.repPasswordExpires = expiry;
        targetClass.repPasswordRevoked = false;
      }
    }

    await targetClass.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
