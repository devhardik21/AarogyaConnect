import mongoose from 'mongoose';

const VitalSchema = new mongoose.Schema({
    userId: { type: String, default: 'anonymous' },
    heartRate: { type: Number },  // bpm
    spo2: { type: Number },  // %
    temperature: { type: Number },  // °C
    recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Vital', VitalSchema);
