import { Router, Request, Response } from 'express';
import { Settings } from '../models/Settings.js';

const router = Router();

// Get settings (returns the single global settings doc)
router.get('/', async (_req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ notificationEmail: '', enableNotifications: false, apifyApiKey: '' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.patch('/', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const { notificationEmail, enableNotifications, apifyApiKey } = req.body;
    
    if (notificationEmail !== undefined) settings.notificationEmail = notificationEmail;
    if (enableNotifications !== undefined) settings.enableNotifications = enableNotifications;
    if (apifyApiKey !== undefined) settings.apifyApiKey = apifyApiKey;
    
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
