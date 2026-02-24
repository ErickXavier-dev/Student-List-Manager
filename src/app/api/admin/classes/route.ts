import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Class } from '@/models/Schemas';
import { getSession, isHOD } from '@/lib/auth-utils';

export async function GET() {
  await dbConnect();
  const session = await getSession();
  if (!isHOD(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const classes = await Class.find({}).sort({ name: 1 });
    return NextResponse.json(classes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const session = await getSession();
  if (!isHOD(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const newClass = await Class.create({ name });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  await dbConnect();
  const session = await getSession();
  if (!isHOD(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await Class.findByIdAndDelete(id);
    // Note: In a real app, we should probably handle dangling students/collections
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
