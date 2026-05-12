/**
 * Seed script — populates MongoDB with demo leads and discussions.
 * Run: cd server && npm run seed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Lead } from './models/Lead.js';
import { Discussion } from './models/Discussion.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadflow';

const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
const future = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000);
const today = () => { const t = new Date(); t.setHours(14, 0, 0, 0); return t; };
const yesterday = () => { const t = new Date(); t.setDate(t.getDate() - 1); t.setHours(10, 0, 0, 0); return t; };

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Lead.deleteMany({});
  await Discussion.deleteMany({});
  console.log('Cleared existing data');

  const leads = await Lead.insertMany([
    { name: 'Sarah Chen', company: 'TechVision Inc.', phone: '+1-555-0101', email: 'sarah.chen@techvision.com', status: 'Qualified', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://techvision.com', requirements: 'Need enterprise CRM integration with existing ERP system. 200+ users.', lastDiscussion: 'Very interested in enterprise plan. Wants demo next week.', followUpAt: today(), createdAt: d(15), updatedAt: d(1) },
    { name: 'Marcus Johnson', company: 'DataFlow Systems', phone: '+1-555-0102', email: 'marcus@dataflow.io', status: 'Proposal Sent', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://dataflow.io', requirements: 'Looking for 50-seat license with API access and custom dashboard.', lastDiscussion: 'Sent proposal for 50-seat license. Awaiting CFO approval.', followUpAt: today(), createdAt: d(22), updatedAt: d(2) },
    { name: 'Emily Rodriguez', company: 'GreenScale Analytics', phone: '+1-555-0103', email: 'emily.r@greenscale.com', status: 'Contacted', industry: 'Finance', hasWebsite: true, websiteUrl: 'https://greenscale.com', requirements: 'Want data analytics dashboard for their financial reporting team.', lastDiscussion: 'Had introductory call. Interested but budget cycle is Q2.', followUpAt: yesterday(), createdAt: d(10), updatedAt: d(3) },
    { name: 'Alex Kim', company: 'NovaBright Solutions', phone: '+1-555-0104', email: 'alex.kim@novabright.co', status: 'New', industry: 'E-Commerce', hasWebsite: false, websiteUrl: '', requirements: 'Need a complete e-commerce website built from scratch with payment integration.', lastDiscussion: '', followUpAt: future(3), createdAt: d(2), updatedAt: d(2) },
    { name: 'Priya Sharma', company: 'CloudNine Platform', phone: '+1-555-0105', email: 'priya@cloudnine.dev', status: 'Won', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://cloudnine.dev', requirements: 'Cloud hosting migration + managed services for 100 seats.', lastDiscussion: 'Contract signed! 100-seat annual deal. Onboarding starts Monday.', followUpAt: null, createdAt: d(45), updatedAt: d(5) },
    { name: "James O'Brien", company: 'Meridian Corp', phone: '+1-555-0106', email: 'jobrien@meridian.com', status: 'Lost', industry: 'Manufacturing', hasWebsite: true, websiteUrl: 'https://meridian-corp.com', requirements: 'Wanted inventory management system with real-time tracking.', lastDiscussion: 'Went with competitor. Keep relationship warm for renewal cycle.', followUpAt: future(30), createdAt: d(60), updatedAt: d(8) },
    { name: 'Lisa Wang', company: 'PixelForge Studios', phone: '+1-555-0107', email: 'lisa.wang@pixelforge.art', status: 'Contacted', industry: 'Other', hasWebsite: false, websiteUrl: '', requirements: 'Need portfolio website and online booking system for design studio.', lastDiscussion: 'Left voicemail. Will try email follow-up tomorrow.', followUpAt: future(1), createdAt: d(5), updatedAt: d(1) },
    { name: 'Daniel Thompson', company: 'Apex Industries', phone: '+1-555-0108', email: 'dthompson@apex-ind.com', status: 'Qualified', industry: 'Manufacturing', hasWebsite: true, websiteUrl: 'https://apex-ind.com', requirements: 'Custom ERP integration with their manufacturing pipeline.', lastDiscussion: 'Needs custom integration. Scheduled technical review.', followUpAt: yesterday(), createdAt: d(18), updatedAt: d(2) },
    { name: 'Raj Patel', company: 'Spice Garden Restaurant', phone: '+1-555-0109', email: 'raj@spicegarden.com', status: 'New', industry: 'Restaurant', hasWebsite: false, websiteUrl: '', requirements: 'Need a restaurant website with online menu, table reservations, and food delivery ordering system.', lastDiscussion: '', followUpAt: future(2), createdAt: d(1), updatedAt: d(1) },
    { name: 'Maria Santos', company: 'Fresh Bites Cafe', phone: '+1-555-0110', email: 'maria@freshbites.co', status: 'Contacted', industry: 'Food & Beverage', hasWebsite: false, websiteUrl: '', requirements: 'Want online ordering app, loyalty program, and social media marketing for their cafe chain (3 locations).', lastDiscussion: 'Discussed requirements. Very excited about online ordering feature.', followUpAt: today(), createdAt: d(4), updatedAt: d(1) },
  ]);

  console.log(`Created ${leads.length} leads`);

  const discs = await Discussion.insertMany([
    { leadId: leads[0]!._id, note: 'Initial outreach via LinkedIn. Sarah responded positively.', followUpAt: d(10), createdAt: d(14) },
    { leadId: leads[0]!._id, note: 'Discovery call completed. 200+ employees, looking for CRM solution.', followUpAt: d(5), createdAt: d(10) },
    { leadId: leads[0]!._id, note: 'Very interested in enterprise plan. Wants demo next week.', followUpAt: today(), createdAt: d(1) },
    { leadId: leads[1]!._id, note: 'Referral from existing client. High potential.', createdAt: d(20) },
    { leadId: leads[1]!._id, note: 'Sent proposal for 50-seat license. Awaiting CFO approval.', followUpAt: today(), createdAt: d(2) },
    { leadId: leads[2]!._id, note: 'Had introductory call. Interested but budget cycle is Q2.', followUpAt: yesterday(), createdAt: d(3) },
    { leadId: leads[4]!._id, note: 'First meeting — very enthusiastic about the platform.', createdAt: d(40) },
    { leadId: leads[4]!._id, note: 'POC completed successfully. Moving to contract negotiation.', createdAt: d(20) },
    { leadId: leads[4]!._id, note: 'Contract signed! 100-seat annual deal. Onboarding starts Monday.', createdAt: d(5) },
    { leadId: leads[7]!._id, note: 'Met at industry conference. Exchanged cards.', createdAt: d(17) },
    { leadId: leads[7]!._id, note: 'Needs custom integration. Scheduled technical review.', followUpAt: yesterday(), createdAt: d(2) },
    { leadId: leads[9]!._id, note: 'Discussed requirements. Very excited about online ordering feature.', followUpAt: today(), createdAt: d(1) },
  ]);

  console.log(`Created ${discs.length} discussions`);
  console.log('✅ Seed complete!');

  await mongoose.disconnect();
}

seed().catch(console.error);
