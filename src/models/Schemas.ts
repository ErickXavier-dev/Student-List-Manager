import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClass extends Document {
  name: string;
  teacherPassword?: string;
  teacherPasswordExpires?: Date;
  teacherPasswordRevoked: boolean;
  repPassword?: string;
  repPasswordExpires?: Date;
  repPasswordRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudent extends Document {
  name: string;
  registerNumber: string;
  classId?: mongoose.Types.ObjectId;
  payments: Map<string, string>;
  notApplicable: Map<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollection extends Document {
  title: string;
  amount: number;
  date: Date;
  classId?: mongoose.Types.ObjectId;
  createdByRole: 'hod' | 'teacher' | 'rep';
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: {
    type: String,
    required: [true, 'Please provide a name for the class.'],
    unique: true,
  },
  teacherPassword: {
    type: String,
  },
  teacherPasswordExpires: {
    type: Date,
  },
  teacherPasswordRevoked: {
    type: Boolean,
    default: false,
  },
  repPassword: {
    type: String,
  },
  repPasswordExpires: {
    type: Date,
  },
  repPasswordRevoked: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const StudentSchema = new Schema<IStudent>({
  name: {
    type: String,
    required: [true, 'Please provide a name for the student.'],
  },
  registerNumber: {
    type: String,
    required: [true, 'Please provide a register number.'],
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: false,
  },
  payments: {
    type: Map,
    of: String,
    default: {}
  },
  notApplicable: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, { timestamps: true });

// Compound index for uniqueness per class
StudentSchema.index({ registerNumber: 1, classId: 1 }, { unique: true });

const CollectionSchema = new Schema<ICollection>({
  title: {
    type: String,
    required: [true, 'Please provide a title for the collection.'],
  },
  amount: {
    type: Number,
    required: [true, 'Please provide the amount.'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: false,
  },
  createdByRole: {
    type: String,
    enum: ['hod', 'teacher', 'rep'],
    default: 'hod',
  },
  createdById: {
    type: String,
  }
}, { timestamps: true });

// Prevent overwriting models upon recompilation
export const Class: Model<IClass> = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
export const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export const Collection: Model<ICollection> = mongoose.models.Collection || mongoose.model<ICollection>('Collection', CollectionSchema);
