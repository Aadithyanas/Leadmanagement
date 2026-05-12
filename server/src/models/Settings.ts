import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  notificationEmail: string;
  enableNotifications: boolean;
  apifyApiKey: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    notificationEmail: { type: String, default: '', trim: true, lowercase: true },
    enableNotifications: { type: Boolean, default: false },
    apifyApiKey: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
