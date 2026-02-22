import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth-utils';

export async function GET(request) {
  await dbConnect();
  const session = await getSession();

  const { searchParams } = new URL(request.url);
  let classId = searchParams.get('classId');

  // RBAC: If logged in and NOT HOD, force session classId
  if (session && session.role !== 'hod') {
    classId = session.classId;
  }

  try {
    const query = classId ? { classId } : {};
    const students = await Student.find(query).sort({ registerNumber: 1 });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function PATCH(request) {
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

    // Verifying student.payments and notApplicable is initialized is handled by Mongoose if defined in schema, 
    // but good to be safe if accessing directly.
    if (!student.payments) student.payments = new Map();
    if (!student.notApplicable) student.notApplicable = new Map();

    // Update the Map
    if (status === 'NA') {
      // Mark as Not Applicable. Preserve payment status.
      student.notApplicable.set(collectionId, true);
    } else if (status === 'APPLICABLE') {
      // Remove from Not Applicable map.
      if (student.notApplicable.has(collectionId)) {
        student.notApplicable.delete(collectionId);
      }
    } else {
      // It's a payment status update (PAID, PENDING -> null/delete)
      // If marking as PAID, we might want to ensure it's not NA? 
      // User said: "making not applicable should not affect the existing payment status"
      // But if I mark as PAID, does it imply it IS applicable? usually yes.
      // Let's safe-guard: if PAID, remove NA.
      if (status === 'PAID') {
        if (student.notApplicable.has(collectionId)) {
          student.notApplicable.delete(collectionId);
        }
      }

      if (status) { // PAID
        student.payments.set(collectionId, status);
      } else { // PENDING (null/undefined passed from frontend usually means remove from map)
        if (student.payments.has(collectionId)) {
          student.payments.delete(collectionId);
        }
      }
    }

    student.markModified('payments'); // Ensure Mongoose detects the change
    student.markModified('notApplicable');
    await student.save();

    return NextResponse.json({ success: true, student });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
