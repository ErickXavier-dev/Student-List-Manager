import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { getSession, isHOD, isTeacher, isRep } from '@/lib/auth-utils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getSession();
  const { id } = await params;

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, registerNumber } = await request.json();
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Permission check: HOD, Teacher, or Rep of the same class
    const canEdit = isHOD(session) || ((isTeacher(session) || isRep(session)) && String(session.classId) === String(student.classId));
    if (!canEdit) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    student.name = name || student.name;
    student.registerNumber = registerNumber || student.registerNumber;
    await student.save();

    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getSession();
  const { id } = await params;

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Permission check: HOD, Teacher, or Rep of the same class
    const canDelete = isHOD(session) || ((isTeacher(session) || isRep(session)) && String(session.classId) === String(student.classId));
    if (!canDelete) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    await Student.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
