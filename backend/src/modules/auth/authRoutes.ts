import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadAvatar as uploadAvatarMiddleware } from '../../middleware/uploadAvatar';
import { EMAIL_REGEX, EMAIL_INVALID_MESSAGE, EMAIL_MAX_LENGTH } from '../../lib/validation';
import * as authController from './authController';

const emailSchema = z
  .string()
  .max(EMAIL_MAX_LENGTH, EMAIL_INVALID_MESSAGE)
  .regex(EMAIL_REGEX, EMAIL_INVALID_MESSAGE);

const registerSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
};

const verifyEmailSchema = {
  body: z.object({
    email: emailSchema,
    code: z.string().min(1, 'Verification code is required').max(10),
  }),
};

const resendVerificationSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

const forgotPasswordSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

const googleSchema = {
  body: z.object({
    accessToken: z.string().min(1, 'Google access token is required'),
  }),
};

const metaSchema = {
  body: z.object({
    accessToken: z.string().min(1, 'Meta access token is required'),
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    location: z.string().max(255).nullable().optional(),
    avatarUrl: z
      .union([z.string().url(), z.string().startsWith('/'), z.literal('')])
      .optional(),
  }),
};

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validateRequest(resendVerificationSchema), authController.resendVerificationEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/google', validateRequest(googleSchema), authController.google);
router.post('/meta', validateRequest(metaSchema), authController.meta);
router.post('/meta/data-deletion', authController.metaDataDeletionCallback);
router.get('/me', authMiddleware, authController.me);
router.patch('/profile', authMiddleware, validateRequest(updateProfileSchema), authController.updateProfile);
router.post('/profile/avatar', authMiddleware, uploadAvatarMiddleware, authController.uploadAvatar);
router.delete('/me', authMiddleware, authController.deleteAccount);

export default router;
