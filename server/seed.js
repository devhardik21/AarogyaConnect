import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arogyaconnect');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing users
        await User.deleteMany({});

        const users = [
            {
                name: 'Rajesh Kumar',
                email: 'rajesh@patient.com',
                password: 'password123',
                role: 'patient',
                profile: {
                    age: 45,
                    gender: 'Male',
                    village: 'Durg, CG',
                    lastAiScan: {
                        riskScores: { sickleCell: 87, anemia: 'Moderate' },
                        bodyParts: ['Lower Back', 'Left Knee'],
                        summary: 'High risk of Sickle Cell detected. Anemia levels are moderate.'
                    },
                    meds: [
                        { name: 'Hydroxyurea', dosage: '500mg daily' },
                        { name: 'Folic Acid', dosage: '5mg daily' }
                    ],
                    vitals: { spo2: 96 }
                }
            },
            {
                name: 'Dr. Sameer Khan',
                email: 'sameer@doctor.com',
                password: 'password123',
                role: 'doctor',
                profile: {
                    specialty: 'General Physician',
                    experience: '12 Years',
                    online: true
                }
            },
            {
                name: 'Dr. Priya Sharma',
                email: 'priya@doctor.com',
                password: 'password123',
                role: 'doctor',
                profile: {
                    specialty: 'Hematologist',
                    experience: '8 Years',
                    online: true
                }
            }
        ];

        for (const u of users) {
            await User.create(u);
        }

        console.log('✅ Seeding complete!');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
