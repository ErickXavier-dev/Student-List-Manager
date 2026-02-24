import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  await dbConnect();
  const session = await getSession();

  const { searchParams } = new URL(request.url);
  let classId = searchParams.get('classId');

  // RBAC: If logged in and NOT HOD, force session classId
  if (session && session.role !== 'hod') {
    classId = session.classId || null;
  }

  try {
    const query = classId ? { classId } : {};
    const students = await Student.find(query).sort({ registerNumber: 1 });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  await dbConnect();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { studentId, collectionId, status } = await request.json();

    if (!studentId || !collectionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.payments) student.payments = new Map();
    if (!student.notApplicable) student.notApplicable = new Map();

    // Update the Map
    if (status === 'NA') {
      student.notApplicable.set(collectionId, true);
    } else if (status === 'APPLICABLE') {
      if (student.notApplicable.has(collectionId)) {
        student.notApplicable.delete(collectionId);
      }
    } else {
      if (status === 'PAID') {
        if (student.notApplicable.has(collectionId)) {
          student.notApplicable.delete(collectionId);
        }
      }

      if (status) { // PAID
        student.payments.set(collectionId, status);
      } else { // PENDING
        if (student.payments.has(collectionId)) {
          student.payments.delete(collectionId);
        }
      }
    }

    student.markModified('payments');
    student.markModified('notApplicable');
    await student.save();

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
