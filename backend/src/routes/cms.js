import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/* ─── Sanitize incoming CMS payloads ─── */
function sanitizePayload(body, allowedFields) {
  const out = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      if (typeof body[key] === 'string') {
        out[key] = body[key].trim().substring(0, 5000);
      } else if (typeof body[key] === 'boolean') {
        out[key] = body[key];
      } else if (typeof body[key] === 'number') {
        out[key] = body[key];
      } else {
        out[key] = body[key];
      }
    }
  }
  return out;
}

const BLOG_FIELDS = ['title','slug','category','author','date','excerpt','content','imageUrl','published'];
const CAR_FIELDS = ['title','imageUrl','year','engine','mileage','specs','price','currency','priceNote','shipping','status','featured'];
const PROP_FIELDS = ['title','imageUrl','location','size','roi','price','status','featured','badge'];
const TEST_FIELDS = ['name','role','text','rating','featured','projectUrl'];
const HERO_FIELDS = ['page','imageUrl','altText','active'];
const BOOK_FIELDS = ['title','author','description','coverImageUrl','pdfUrl','gumroadUrl','publishedYear','category','price','featured'];

// Blog Posts
router.get('/blog-posts', asyncHandler(async (_req, res) => {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(posts);
}));

router.get('/blog-posts/:id', asyncHandler(async (req, res) => {
  const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
}));

router.post('/blog-posts', asyncHandler(async (req, res) => {
  const post = await prisma.blogPost.create({ data: sanitizePayload(req.body, BLOG_FIELDS) });
  res.json(post);
}));

router.put('/blog-posts/:id', asyncHandler(async (req, res) => {
  const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: sanitizePayload(req.body, BLOG_FIELDS) });
  res.json(post);
}));

router.delete('/blog-posts/:id', asyncHandler(async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// Car Listings
router.get('/car-listings', asyncHandler(async (_req, res) => {
  const listings = await prisma.carListing.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(listings);
}));

router.get('/car-listings/:id', asyncHandler(async (req, res) => {
  const item = await prisma.carListing.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/car-listings', asyncHandler(async (req, res) => {
  const item = await prisma.carListing.create({ data: sanitizePayload(req.body, CAR_FIELDS) });
  res.json(item);
}));

router.put('/car-listings/:id', asyncHandler(async (req, res) => {
  const item = await prisma.carListing.update({ where: { id: req.params.id }, data: sanitizePayload(req.body, CAR_FIELDS) });
  res.json(item);
}));

router.delete('/car-listings/:id', asyncHandler(async (req, res) => {
  await prisma.carListing.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// Property Listings
router.get('/property-listings', asyncHandler(async (_req, res) => {
  const listings = await prisma.propertyListing.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(listings);
}));

router.get('/property-listings/:id', asyncHandler(async (req, res) => {
  const item = await prisma.propertyListing.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/property-listings', asyncHandler(async (req, res) => {
  const item = await prisma.propertyListing.create({ data: sanitizePayload(req.body, PROP_FIELDS) });
  res.json(item);
}));

router.put('/property-listings/:id', asyncHandler(async (req, res) => {
  const item = await prisma.propertyListing.update({ where: { id: req.params.id }, data: sanitizePayload(req.body, PROP_FIELDS) });
  res.json(item);
}));

router.delete('/property-listings/:id', asyncHandler(async (req, res) => {
  await prisma.propertyListing.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// Testimonials
router.get('/testimonials', asyncHandler(async (_req, res) => {
  const items = await prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
}));

router.get('/testimonials/:id', asyncHandler(async (req, res) => {
  const item = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/testimonials', asyncHandler(async (req, res) => {
  const item = await prisma.testimonial.create({ data: sanitizePayload(req.body, TEST_FIELDS) });
  res.json(item);
}));

router.put('/testimonials/:id', asyncHandler(async (req, res) => {
  const item = await prisma.testimonial.update({ where: { id: req.params.id }, data: sanitizePayload(req.body, TEST_FIELDS) });
  res.json(item);
}));

router.delete('/testimonials/:id', asyncHandler(async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// Hero Images
router.get('/hero-images', asyncHandler(async (_req, res) => {
  const items = await prisma.heroImage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
}));

router.get('/hero-images/:id', asyncHandler(async (req, res) => {
  const item = await prisma.heroImage.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/hero-images', asyncHandler(async (req, res) => {
  const { page, ...rest } = sanitizePayload(req.body, HERO_FIELDS);
  const item = await prisma.heroImage.upsert({
    where: { page },
    update: rest,
    create: sanitizePayload(req.body, HERO_FIELDS),
  });
  res.json(item);
}));

router.put('/hero-images/:id', asyncHandler(async (req, res) => {
  const item = await prisma.heroImage.update({ where: { id: req.params.id }, data: sanitizePayload(req.body, HERO_FIELDS) });
  res.json(item);
}));

router.delete('/hero-images/:id', asyncHandler(async (req, res) => {
  await prisma.heroImage.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// Books
router.get('/books', asyncHandler(async (_req, res) => {
  const items = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
}));

router.get('/books/:id', asyncHandler(async (req, res) => {
  const item = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
}));

router.post('/books', asyncHandler(async (req, res) => {
  const item = await prisma.book.create({ data: sanitizePayload(req.body, BOOK_FIELDS) });
  res.json(item);
}));

router.put('/books/:id', asyncHandler(async (req, res) => {
  const item = await prisma.book.update({ where: { id: req.params.id }, data: sanitizePayload(req.body, BOOK_FIELDS) });
  res.json(item);
}));

router.delete('/books/:id', asyncHandler(async (req, res) => {
  await prisma.book.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
