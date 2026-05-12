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
// ── POST /api/leads/bulk ── Bulk create leads ──
router.post('/bulk', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ownerEmail = req.userEmail;
    if (!ownerEmail) return res.status(401).json({ error: 'Unauthorized' });

    const leadsData = Array.isArray(req.body) ? req.body : [req.body];
    
    const leadsWithOwners = leadsData.map(lead => ({
      ...lead,
      ownerEmail
    }));

    const leads = await Lead.insertMany(leadsWithOwners);
    res.status(201).json({ message: `Successfully imported ${leads.length} leads.`, count: leads.length });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk import leads' });
  }
});

// ── POST /api/leads/seed-my-data ── Populate personal demo data ──
router.post('/seed-my-data', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ownerEmail = req.userEmail;
    
    // Check if user already has data to avoid double seeding
    const existingCount = await Lead.countDocuments({ ownerEmail });
    if (existingCount > 0) {
      return res.status(400).json({ error: 'Dashboard already has data. Cannot seed again.' });
    }

    const now = new Date();
    const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
    const today = () => { const t = new Date(); t.setHours(14, 0, 0, 0); return t; };
    const yesterday = () => { const t = new Date(); t.setDate(t.getDate() - 1); t.setHours(10, 0, 0, 0); return t; };

    const demoLeadsData = [
      { name: 'Sarah Chen', company: 'TechVision Inc.', phone: '+1-555-0101', email: 'sarah.chen@techvision.com', status: 'Qualified', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://techvision.com', requirements: 'Need enterprise CRM integration.', lastDiscussion: 'Very interested in enterprise plan.', followUpAt: today(), ownerEmail, createdAt: d(15), updatedAt: d(1) },
      { name: 'Marcus Johnson', company: 'DataFlow Systems', phone: '+1-555-0102', email: 'marcus@dataflow.io', status: 'Proposal Sent', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://dataflow.io', requirements: 'Looking for 50-seat license.', lastDiscussion: 'Sent proposal. Awaiting approval.', followUpAt: today(), ownerEmail, createdAt: d(22), updatedAt: d(2) },
      { name: 'Emily Rodriguez', company: 'GreenScale Analytics', phone: '+1-555-0103', email: 'emily.r@greenscale.com', status: 'Contacted', industry: 'Finance', hasWebsite: true, websiteUrl: 'https://greenscale.com', requirements: 'Want data analytics dashboard.', lastDiscussion: 'Had introductory call.', followUpAt: yesterday(), ownerEmail, createdAt: d(10), updatedAt: d(3) },
      { name: 'Priya Sharma', company: 'CloudNine Platform', phone: '+1-555-0105', email: 'priya@cloudnine.dev', status: 'Won', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://cloudnine.dev', requirements: 'Cloud hosting migration.', lastDiscussion: 'Contract signed!', followUpAt: null, ownerEmail, createdAt: d(45), updatedAt: d(5) },
      { name: 'Daniel Thompson', company: 'Apex Industries', phone: '+1-555-0108', email: 'dthompson@apex-ind.com', status: 'Qualified', industry: 'Manufacturing', hasWebsite: true, websiteUrl: 'https://apex-ind.com', requirements: 'Custom ERP integration.', lastDiscussion: 'Needs custom integration.', followUpAt: yesterday(), ownerEmail, createdAt: d(18), updatedAt: d(2) }
    ];

    const leads = await Lead.insertMany(demoLeadsData);
    
    // Add some discussions for the first few leads
    const discsData = [
      { leadId: leads[0]!._id, note: 'Initial outreach via LinkedIn. Sarah responded positively.', ownerEmail, createdAt: d(14) },
      { leadId: leads[0]!._id, note: 'Discovery call completed. 200+ employees.', ownerEmail, createdAt: d(10) },
      { leadId: leads[1]!._id, note: 'Sent proposal for 50-seat license.', ownerEmail, createdAt: d(2) },
      { leadId: leads[3]!._id, note: 'Contract signed! Onboarding starts Monday.', ownerEmail, createdAt: d(5) }
    ];

    await Discussion.insertMany(discsData);

    res.json({ message: 'Personal dashboard seeded successfully!', count: leads.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed personal data' });
  }
});

export default router;
