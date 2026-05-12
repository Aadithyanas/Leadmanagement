import { Router, Request, Response } from 'express';
import { Discussion } from '../models/Discussion.js';
import { Lead } from '../models/Lead.js';

const router = Router();

// ── GET /api/discussions/:leadId ── Get discussions for a lead ──
router.get('/:leadId', async (req: Request, res: Response) => {
  try {
    const discussions = await Discussion.find({ leadId: req.params.leadId })
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { leadId, note, followUpAt } = req.body;
    if (!leadId || !note?.trim()) {
      return res.status(400).json({ error: 'leadId and note are required' });
    }

    // Create discussion
    const discussion = await Discussion.create({
      leadId,
      note: note.trim(),
      followUpAt: followUpAt ? new Date(followUpAt) : null,
    });

    // Update parent lead's lastDiscussion and followUpAt
    const updateData: Record<string, unknown> = {
      lastDiscussion: note.trim(),
      updatedAt: new Date(),
    };
    if (followUpAt) {
      updateData.followUpAt = new Date(followUpAt);
    }
    await Lead.findByIdAndUpdate(leadId, { $set: updateData });

    res.status(201).json(discussion.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

export default router;
