import mongoose from 'mongoose';

const SymptomLogSchema = new mongoose.Schema({
    userId: { type: String, default: 'anonymous' },
    bodyPart: { type: String, required: true },
    zone: { type: String },
    symptoms: [{ type: String }],
    messages: [{ role: String, text: String, timestamp: Date }],
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
}, { timestamps: true });

export default mongoose.model('SymptomLog', SymptomLogSchema);
