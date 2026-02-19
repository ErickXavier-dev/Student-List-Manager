import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, registerNumber } = body;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { name, registerNumber },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    // Handle duplicate key error 
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Register number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
