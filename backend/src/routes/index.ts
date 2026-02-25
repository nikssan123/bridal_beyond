import { Router } from 'express';
import authRoutes from '../modules/auth/authRoutes';
import listingsRoutes from '../modules/listings/listingsRoutes';
import sellersRoutes from '../modules/sellers/sellersRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingsRoutes);
router.use('/sellers', sellersRoutes);

export default router;
