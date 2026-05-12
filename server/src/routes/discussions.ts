import { Router, Response } from 'express';
import { Discussion } from '../models/Discussion.js';
import { Lead } from '../models/Lead.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ── GET /api/discussions/:leadId ── Get discussions for a lead ──
router.get('/:leadId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const discussions = await Discussion.find({ 
      leadId: req.params.leadId,
      ownerEmail: req.userEmail 
    })
      .sort({ createdAt: -1 })
      .lean();
    const formatted = discussions.map((d) => ({
      ...d,
      id: d._id.toString(),
      leadId: d.leadId.toString(),
      _id: undefined,
      __v: undefined,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// ── POST /api/discussions ── Create discussion + update parent lead ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { leadId, note, followUpAt } = req.body;
    if (!leadId || !note?.trim()) {
      return res.status(400).json({ error: 'leadId and note are required' });
    }

    // Verify lead ownership
    const parentLead = await Lead.findOne({ _id: leadId, ownerEmail: req.userEmail });
    if (!parentLead) {
      return res.status(404).json({ error: 'Parent lead not found or access denied' });
    }

    // Create discussion
    const discussion = await Discussion.create({
      leadId,
      note: note.trim(),
      followUpAt: followUpAt ? new Date(followUpAt) : null,
      ownerEmail: req.userEmail
    });

    // Update parent lead's lastDiscussion and followUpAt
    const updateData: Record<string, unknown> = {
      lastDiscussion: note.trim(),
      updatedAt: new Date(),
    };
    if (followUpAt) {
      updateData.followUpAt = new Date(followUpAt);
    }
    await Lead.updateOne(
      { _id: leadId, ownerEmail: req.userEmail }, 
      { $set: updateData }
    );

    res.status(201).json(discussion.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

export default router;
