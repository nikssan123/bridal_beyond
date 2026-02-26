import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadListingImage } from '../../middleware/uploadListingImage';
import * as listingsController from './listingsController';

const createListingSchema = {
  body: z.object({
    title: z.string().min(1).max(500),
    description: z.string().min(1),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
    category: z.enum(['wedding', 'graduation', 'evening']),
    size: z.string().min(1).max(20),
    condition: z.enum(['new', 'like-new', 'good', 'fair']),
    color: z.string().min(1).max(100),
    brand: z.string().min(1).max(255),
    measurements: z.object({
      bust: z.string(),
      waist: z.string(),
      hips: z.string(),
      length: z.string(),
    }),
    images: z.array(z.string()).min(2, 'At least 2 images are required'),
  }),
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
    status: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    offset: z.coerce.number().min(0).optional(),
  }),
};

const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};

const router = Router();

router.get('/', validateRequest(listQuerySchema), listingsController.list);
router.post('/upload-image', authMiddleware, uploadListingImage, listingsController.uploadImage);
router.get('/:id', validateRequest(idParamSchema), listingsController.getById);
router.post('/', authMiddleware, validateRequest(createListingSchema), listingsController.create);

export default router;
