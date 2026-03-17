import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    speciality: { type: String, required: true },
    experience: { type: Number },   // in years
    available: { type: Boolean, default: true },
    location: { type: String, default: 'Durg, CG' },
    imageUrl: { type: String },
}, { timestamps: true });

export default mongoose.model('Doctor', DoctorSchema);
