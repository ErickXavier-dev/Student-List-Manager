import dbConnect from '@/lib/db';
import { Student } from '@/models/Schemas';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  await dbConnect();
  try {
    const { collectionId, action } = await request.json();

    if (!collectionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'MARK_ALL_NA') {
      // Set NA in notApplicable map for students who haven't paid
      const paymentKey = `payments.${collectionId}`;
      const naKey = `notApplicable.${collectionId}`;

      // Update where payment is NOT 'PAID'
      await Student.updateMany(
        { [paymentKey]: { $ne: 'PAID' } },
        { $set: { [naKey]: true } }
      );

      return NextResponse.json({ success: true, message: 'All unpaid students marked as NA' });

    } else if (action === 'MARK_ALL_APPLICABLE') {
      // Revert 'NA' (remove from notApplicable map)
      const naKey = `notApplicable.${collectionId}`;

      await Student.updateMany(
        { [naKey]: true },
        { $unset: { [naKey]: 1 } }
      );

      return NextResponse.json({ success: true, message: 'All NA students marked as Applicable' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
