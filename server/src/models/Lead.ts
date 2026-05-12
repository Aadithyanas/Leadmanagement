import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  industry: string;
  hasWebsite: boolean;
  websiteUrl: string;
  requirements: string;
  lastDiscussion: string;
  followUpAt: Date | null;
  ownerEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'],
      default: 'New',
    },
    industry: {
      type: String,
      default: 'Other',
    },
    hasWebsite: { type: Boolean, default: false },
    websiteUrl: { type: String, default: '', trim: true },
    requirements: { type: String, default: '', trim: true },
    lastDiscussion: { type: String, default: '' },
    followUpAt: { type: Date, default: null },
    ownerEmail: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
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

// Index for searching and filtering
LeadSchema.index({ name: 'text', company: 'text', email: 'text' });
LeadSchema.index({ status: 1 });
LeadSchema.index({ followUpAt: 1 });
LeadSchema.index({ ownerEmail: 1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
