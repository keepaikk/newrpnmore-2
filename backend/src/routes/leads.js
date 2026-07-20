import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/* ─── Input sanitization helpers ─── */
function sanitizeString(val, maxLen = 500) {
  if (typeof val !== 'string') return '';
  return val.trim().substring(0, maxLen);
}

router.post('/contact', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const email = sanitizeString(req.body.email, 100);
    const service = sanitizeString(req.body.service, 50);
    const message = sanitizeString(req.body.message, 2000);
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const lead = await prisma.contactLead.create({
      data: { name, email, service, message },
    });
    res.json({ success: true, lead });
  } catch (err) {
    console.error('[Leads/Contact] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/car', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const carModel = sanitizeString(req.body.carModel, 100);
    const budget = sanitizeString(req.body.budget, 50);
    const budgetCurrency = sanitizeString(req.body.budgetCurrency, 10) || 'USD';
    const destinationPort = sanitizeString(req.body.destinationPort, 100);
    const notes = sanitizeString(req.body.notes, 1000);
    if (!name || !carModel) return res.status(400).json({ error: 'Name and car model are required' });
    const lead = await prisma.carLead.create({
      data: { name, carModel, budget, budgetCurrency, destinationPort, notes },
    });
    res.json({ success: true, lead });
  } catch (err) {
    console.error('[Leads/Car] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/property', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const propertyInterest = sanitizeString(req.body.propertyInterest, 100);
    const budget = sanitizeString(req.body.budget, 50);
    const timeline = sanitizeString(req.body.timeline, 50);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const lead = await prisma.propertyLead.create({
      data: { name, propertyInterest, budget, timeline },
    });
    res.json({ success: true, lead });
  } catch (err) {
    console.error('[Leads/Property] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/ai', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const businessName = sanitizeString(req.body.businessName, 100);
    const need = sanitizeString(req.body.need, 2000);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const lead = await prisma.aiLead.create({
      data: { name, businessName, need },
    });
    res.json({ success: true, lead });
  } catch (err) {
    console.error('[Leads/AI] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoints for admin dashboard
router.get('/contact', async (_req, res) => {
  try {
    const leads = await prisma.contactLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    console.error('[Leads/Contact] GET Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/car', async (_req, res) => {
  try {
    const leads = await prisma.carLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    console.error('[Leads/Car] GET Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/property', async (_req, res) => {
  try {
    const leads = await prisma.propertyLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    console.error('[Leads/Property] GET Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ai', async (_req, res) => {
  try {
    const leads = await prisma.aiLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    console.error('[Leads/AI] GET Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
