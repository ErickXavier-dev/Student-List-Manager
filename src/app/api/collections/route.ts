import dbConnect from '@/lib/db';
import { Collection } from '@/models/Schemas';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  await dbConnect();
  const session = await getSession();

  const { searchParams } = new URL(request.url);
  let classId = searchParams.get('classId');

  try {
    let query = {};
    if (session) {
      if (session.role === 'hod') {
        if (classId) query = { $or: [{ classId }, { classId: null }] };
      } else {
        query = { $or: [{ classId: session.classId }, { classId: null }] };
      }
    } else {
      if (classId) {
        query = { $or: [{ classId }, { classId: null }] };
      }
    }

    const collections = await Collection.find(query).sort({ date: -1 });
    return NextResponse.json(collections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, amount, isGeneral, classId: providedClassId } = await request.json();

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    if (isGeneral && session.role !== 'hod') {
      return NextResponse.json({ error: 'Only HOD can create general collections' }, { status: 403 });
    }

    const newCollection = await Collection.create({
      title,
      amount: Number(amount),
      classId: isGeneral ? null : (session.role === 'hod' ? providedClassId : session.classId),
      createdByRole: session.role,
    });

    return NextResponse.json(newCollection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  await dbConnect();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, title, amount } = await request.json();

    const collection = await Collection.findById(id);
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    if (session.role === 'rep' && collection.createdByRole !== 'rep') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    collection.title = title;
    collection.amount = Number(amount);
    await collection.save();

    return NextResponse.json(collection);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  await dbConnect();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const collection = await Collection.findById(id);
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    if (session.role === 'rep' && collection.createdByRole !== 'rep') {
      return NextResponse.json({ error: 'Reps can only delete their own collections' }, { status: 403 });
    }

    await Collection.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
