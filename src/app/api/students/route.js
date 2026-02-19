import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  try {
    const students = await Student.find({}).sort({ registerNumber: 1 });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  await dbConnect();
  try {
    const { studentId, collectionId, status } = await request.json();

    if (!studentId || !collectionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify student.payments is initialized
    if (!student.payments) {
      student.payments = new Map();
    }

    // Update the Map
    // Status can be 'PAID', 'PENDING', 'NA' (or null to remove?)
    if (status) {
      student.payments.set(collectionId, status);
    } else {
      if (student.payments.has(collectionId)) {
        student.payments.delete(collectionId);
      }
    }

    student.markModified('payments'); // Ensure Mongoose detects the change
    await student.save();

    return NextResponse.json({ success: true, student });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
