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
    const { studentId, collectionId, hasPaid } = await request.json();

    if (!studentId || !collectionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update the Map
    student.payments.set(collectionId, hasPaid);
    await student.save();

    return NextResponse.json({ success: true, student });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
