import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the student.'],
  },
  registerNumber: {
    type: String,
    required: [true, 'Please provide a register number.'],
    unique: true,
  },
  // Map of Collection ID -> String (PAID/NA/PENDING)
  payments: {
    type: Map,
    of: String,
    default: {}
  }
}, { timestamps: true });

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
  }
}, { timestamps: true });

// Prevent overwriting models upon recompilation
export const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const Collection = mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
