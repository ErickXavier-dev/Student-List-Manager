import { Class, Student, Collection } from '../models/Schemas';
import dbConnect from './db';
// dotenv.config({ path: '.env.local' });

async function migrate() {
  try {
    await dbConnect();
    console.log('Connected to database for migration');

    // 1. Create Default Class if it doesn't exist
    let defaultClass = await Class.findOne({ name: 'Default' });
    if (!defaultClass) {
      defaultClass = await Class.create({
        name: 'Default',
        teacherPassword: process.env.ADMIN_PASSWORD || 'password123', // Temp default
        teacherPasswordExpires: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      });
      console.log('Created Default Class');
    }

    // 2. Assign Students to Default Class
    const studentsResult = await Student.updateMany(
      { classId: { $exists: false } },
      { $set: { classId: defaultClass._id } }
    );
    console.log(`Updated ${studentsResult.modifiedCount} students`);

    // 3. Assign Collections to Default Class (treat existing as class-specific)
    const collectionsResult = await Collection.updateMany(
      { classId: { $exists: false }, createdByRole: { $exists: false } },
      { $set: { classId: defaultClass._id, createdByRole: 'hod' } }
    );
    console.log(`Updated ${collectionsResult.modifiedCount} collections`);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
