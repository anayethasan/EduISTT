import mongoose, { Schema, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
    user: Types.ObjectId;
    action: string;
    details?: string;
    createdAt: Date;
    updatedAt: Date;
}

const activitiesLogSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    },
    action: { type: String, required: true },
    details: { type: String },
}, {
    timestamps: true
});

export default mongoose.model<IActivityLog>(
    "ActivitiesLog",
    activitiesLogSchema
);