import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscussion extends Document {
  leadId: mongoose.Types.ObjectId;
  note: string;
  followUpAt: Date | null;
  createdAt: Date;
}

const DiscussionSchema = new Schema<IDiscussion>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    note: { type: String, required: true, trim: true },
    followUpAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Discussion = mongoose.model<IDiscussion>('Discussion', DiscussionSchema);
