import { Router, Request, Response } from 'express';
import { Lead } from '../models/Lead.js';
import { Discussion } from '../models/Discussion.js';
import { sendExpiryNotification } from '../services/mailService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ── GET /api/leads ── List leads for current user ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.find({ ownerEmail: req.userEmail })
      .sort({ updatedAt: -1 })
      .lean();
    const formatted = leads.map((l) => ({
      ...l,
      id: l._id.toString(),
      _id: undefined,
      __v: undefined,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ── GET /api/leads/:id ── Get single lead ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ownerEmail: req.userEmail });
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });
    res.json(lead.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// ── POST /api/leads ── Create lead ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, company, phone, email, status, industry, hasWebsite, websiteUrl, requirements } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const lead = await Lead.create({
      name: name.trim(),
      company: company?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      status: status || 'New',
      industry: industry || 'Other',
      hasWebsite: !!hasWebsite,
      websiteUrl: websiteUrl?.trim() || '',
      requirements: requirements?.trim() || '',
      ownerEmail: req.userEmail
    });
    res.status(201).json(lead.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// ── PATCH /api/leads/:id ── Update lead ──
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, ownerEmail: req.userEmail },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });
    res.json(lead.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// ── PATCH /api/leads/:id/status ── Update status only ──
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, ownerEmail: req.userEmail },
      { status },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });
    res.json(lead.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── DELETE /api/leads/:id ── Delete lead + its discussions ──
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, ownerEmail: req.userEmail });
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });
    await Discussion.deleteMany({ leadId: req.params.id, ownerEmail: req.userEmail });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});
// ── POST /api/leads/test-notification ── Manual test trigger ──
router.post('/test-notification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const dummyLeads = [
      { name: 'Test Lead', company: 'LeadFlow Demo', status: 'Qualified', followUpAt: new Date() }
    ];

    const success = await sendExpiryNotification(email, dummyLeads);
    if (success) {
      res.json({ message: 'Test email sent successfully!' });
    } else {
      res.status(500).json({ error: 'Failed to send test email. Check server logs.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
