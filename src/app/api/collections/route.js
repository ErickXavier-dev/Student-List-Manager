import dbConnect from '@/lib/db';
import { Collection } from '@/models/Schemas';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  try {
    const collections = await Collection.find({}).sort({ date: -1 });
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const { title, amount } = await request.json();

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const newCollection = await Collection.create({
      title,
      amount: Number(amount),
    });

    return NextResponse.json(newCollection, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  await dbConnect();
  try {
    const { id, title, amount } = await request.json();

    if (!id || !title || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      { title, amount: Number(amount) },
      { new: true }
    );

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCollection);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await Collection.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
