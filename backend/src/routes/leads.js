import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.post('/contact', async (req, res) => {
  try {
    const { name, email, service, message } = req.body;
    const lead = await prisma.contactLead.create({
      data: { name, email, service, message },
    });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/car', async (req, res) => {
  try {
    const { name, carModel, budget, budgetCurrency, destinationPort, notes } = req.body;
    const lead = await prisma.carLead.create({
      data: { name, carModel, budget, budgetCurrency: budgetCurrency || 'USD', destinationPort, notes },
    });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/property', async (req, res) => {
  try {
    const { name, propertyInterest, budget, timeline } = req.body;
    const lead = await prisma.propertyLead.create({
      data: { name, propertyInterest, budget, timeline },
    });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai', async (req, res) => {
  try {
    const { name, businessName, need } = req.body;
    const lead = await prisma.aiLead.create({
      data: { name, businessName, need },
    });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET endpoints for admin dashboard
router.get('/contact', async (req, res) => {
  try {
    const leads = await prisma.contactLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/car', async (req, res) => {
  try {
    const leads = await prisma.carLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/property', async (req, res) => {
  try {
    const leads = await prisma.propertyLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ai', async (req, res) => {
  try {
    const leads = await prisma.aiLead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
