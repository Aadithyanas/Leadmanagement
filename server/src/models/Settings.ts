import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  notificationEmail: string;
  enableNotifications: boolean;
  apifyApiKey: string;
  ownerEmail: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    notificationEmail: { type: String, default: '', trim: true, lowercase: true },
    enableNotifications: { type: Boolean, default: false },
    apifyApiKey: { type: String, default: '', trim: true },
    ownerEmail: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
