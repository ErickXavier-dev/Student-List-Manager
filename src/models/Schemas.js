import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the class.'],
    unique: true,
  },
  teacherPassword: {
    type: String, // Hashed or plain for now as per project context
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

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the student.'],
  },
  registerNumber: {
    type: String,
    required: [true, 'Please provide a register number.'],
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false, // Will migrate soon
  },
  // Map of Collection ID -> String (PAID/NA/PENDING)
  payments: {
    type: Map,
    of: String,
    default: {}
  },
  // Map of Collection ID -> Boolean (true if NA)
  notApplicable: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, { timestamps: true });

// Compound index for uniqueness per class
StudentSchema.index({ registerNumber: 1, classId: 1 }, { unique: true });

const CollectionSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false, // null means general collection
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
export const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
export const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const Collection = mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);

