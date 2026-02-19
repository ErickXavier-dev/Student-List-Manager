import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextResponse } from 'next/server';

export async function POST(request) {
  await dbConnect();

  try {
    const { students } = await request.json();

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    let updatedCount = 0;
    let createdCount = 0;
    const errors = [];

    // Drop stale index if it exists (Fix for Roll Number -> Register Number migration)
    try {
      await Student.collection.dropIndex('rollNumber_1');
      console.log('Dropped stale index: rollNumber_1');
    } catch (e) {
      // Ignore if index doesn't exist
    }

    for (const studentData of students) {
      // Normalize keys (assuming headers might vary slightly, but enforcing 'Name' and 'Register Number')
      // We expect the frontend to map this to { name, registerNumber }
      const { name, registerNumber } = studentData;

      if (!name || !registerNumber) continue;

      try {
        const existing = await Student.findOne({ registerNumber });
        if (existing) {
          existing.name = name; // Update name if changed
          await existing.save();
          updatedCount++;
        } else {
          await Student.create({ name, registerNumber: String(registerNumber) });
          createdCount++;
        }
      } catch (err) {
        if (err.code === 11000) {
          errors.push(`Duplicate Register Number: ${registerNumber}`);
        } else {
          errors.push(`Error processing ${name}: ${err.message}`);
        }
      }
    }

    if (errors.length > 0 && createdCount === 0 && updatedCount === 0) {
      return NextResponse.json({
        error: 'Upload failed with errors.',
        details: errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${students.length} rows. Created ${createdCount}, Updated ${updatedCount}.`, // ${errors.length > 0 ? `Errors: ${errors.length}` : ''}
      inputErrors: errors
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
