import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Class } from '@/models/Schemas';

export async function GET() {
  try {
    await dbConnect();
    const classes = await Class.find({}, 'name').sort({ name: 1 });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
