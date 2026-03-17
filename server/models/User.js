import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
    profile: {
        age: Number,
        gender: String,
        village: { type: String, default: 'Durg, CG' },
        specialty: String, // For doctors
        experience: String, // For doctors
        online: { type: Boolean, default: false },
        lastAiScan: {
            riskScores: {
                sickleCell: { type: Number, default: 0 },
                anemia: { type: String, default: 'Normal' }
            },
            bodyParts: [String],
            summary: String
        },
        meds: [{ name: String, dosage: String }],
        vitals: {
            spo2: Number
        }
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
