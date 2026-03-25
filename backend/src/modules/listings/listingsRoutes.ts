import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadListingImage } from '../../middleware/uploadListingImage';
import * as listingsController from './listingsController';

const listingBodySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  price: z.number().min(10, 'Minimum price is 10 €'),
  originalPrice: z.number().positive().optional(),
  category: z.enum(['wedding', 'graduation', 'evening', 'sport_dances']),
  size: z.string().min(1).max(20),
  condition: z.enum(['new', 'like-new', 'good', 'fair']),
  color: z.string().max(100).optional().default(''),
  brand: z.string().max(255).optional().default(''),
  measurements: z.object({
    bust: z.string(),
    waist: z.string(),
    hips: z.string(),
    length: z.string(),
  }),
  images: z.array(z.string()).min(2, 'At least 2 images are required'),
  shopId: z.string().uuid().optional(),
});

const createListingSchema = {
  body: listingBodySchema,
};

const listQuerySchema = {
  query: z.object({
    category: z.string().optional(),
    size: z.string().optional(),
    condition: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['newest', 'price-asc', 'price-desc']).optional(),
    sellerId: z.string().optional(),
    shopId: z.string().optional(),
    fromShop: z.enum(['true', 'false']).optional(),
    status: z.string().optional(),
    featured: z.enum(['true', 'false']).optional(),
    includeMaxPrice: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    offset: z.coerce.number().min(0).optional(),
  }),
};

const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

const router = Router();

// Allow up to 3 minutes for large image uploads (20MB) to avoid timeout
const uploadTimeout = (_req: Request, _res: Response, next: NextFunction) => {
  _req.setTimeout(180000);
  next();
};

router.get('/', validateRequest(listQuerySchema), listingsController.list);
router.post('/upload-image', authMiddleware, uploadTimeout, uploadListingImage, listingsController.uploadImage);
router.get('/:id', validateRequest(idParamSchema), listingsController.getById);
router.post('/', authMiddleware, validateRequest(createListingSchema), listingsController.create);
router.put('/:id', authMiddleware, validateRequest({ ...idParamSchema, body: listingBodySchema }), listingsController.update);
router.delete('/:id', authMiddleware, validateRequest(idParamSchema), listingsController.remove);

export default router;
