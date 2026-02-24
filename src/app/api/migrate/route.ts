import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Class, Student, Collection } from '@/models/Schemas';

export async function GET() {
  try {
    await dbConnect();

    // 1. Create Default Class if it doesn't exist
    let defaultClass = await Class.findOne({ name: 'Default' });
    if (!defaultClass) {
      defaultClass = await Class.create({
        name: 'Default',
        teacherPassword: process.env.ADMIN_PASSWORD || 'password123',
        teacherPasswordExpires: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      });
    }

    // 2. Assign Students to Default Class
    const studentsResult = await Student.updateMany(
      { classId: { $exists: false } },
      { $set: { classId: defaultClass._id } }
    );

    // 3. Assign Collections to Default Class
    const collectionsResult = await Collection.updateMany(
      { classId: { $exists: false }, createdByRole: { $exists: false } },
      { $set: { classId: defaultClass._id, createdByRole: 'hod' } }
    );

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      details: {
        studentsUpdated: studentsResult.modifiedCount,
        collectionsUpdated: collectionsResult.modifiedCount,
        defaultClassId: defaultClass._id
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
