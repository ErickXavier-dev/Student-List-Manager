import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextResponse } from 'next/server';

export async function POST(request) {
  await dbConnect();

  try {
    const { students, classId } = await request.json();

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json({ error: 'Target class is required for upload' }, { status: 400 });
    }

    let updatedCount = 0;
    let createdCount = 0;
    const errors = [];

    // Drop stale global unique index on registerNumber if it exists
    try {
      await Student.collection.dropIndex('registerNumber_1');
      console.log('Dropped stale global index: registerNumber_1');
    } catch (e) {
      // Ignore if index doesn't exist
    }

    for (const studentData of students) {
      const { name, registerNumber } = studentData;

      if (!name || !registerNumber) continue;

      try {
        // Look for student within the specific class
        const existing = await Student.findOne({ registerNumber, classId });
        if (existing) {
          existing.name = name;
          await existing.save();
          updatedCount++;
        } else {
          await Student.create({
            name,
            registerNumber: String(registerNumber),
            classId: classId
          });
          createdCount++;
        }
      } catch (err) {
        if (err.code === 11000) {
          errors.push(`Duplicate Register Number: ${registerNumber} in this class`);
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
      message: `Processed ${students.length} rows. Created ${createdCount}, Updated ${updatedCount}.`,
      inputErrors: errors
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
