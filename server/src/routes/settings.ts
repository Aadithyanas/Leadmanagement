import { Router, Response } from 'express';
import { Settings } from '../models/Settings.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get settings (returns settings for current user)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await Settings.findOne({ ownerEmail: req.userEmail });
    if (!settings) {
      settings = await Settings.create({ 
        notificationEmail: '', 
        enableNotifications: false, 
        apifyApiKey: '',
        ownerEmail: req.userEmail
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.patch('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { notificationEmail, enableNotifications, apifyApiKey } = req.body;
    
    let settings = await Settings.findOneAndUpdate(
      { ownerEmail: req.userEmail },
      { 
        $set: { 
          notificationEmail, 
          enableNotifications, 
          apifyApiKey 
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
