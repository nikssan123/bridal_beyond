import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ImageUploader from '@/components/ImageUploader';
import SafetyInfoCard from '@/components/SafetyInfoCard';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createListing, uploadListingImage } from '@/features/listings/listingsSlice';
import { fetchMyShop } from '@/features/shops/shopsSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per image
const MAX_TOTAL_SIZE = 40 * 1024 * 1024; // 40MB total for all listing images
const MIN_PRICE_EUR = 10;

const CreateListing: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [images, setImages] = useState<string[]>([]);
  const [uploadedSizes, setUploadedSizes] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showNoPaymentModal, setShowNoPaymentModal] = useState(false);
  const [listAsShop, setListAsShop] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', originalPrice: '',
    category: '', size: '', condition: '', color: '', brand: '',
    bust: '', waist: '', hips: '', length: '',
  });
  const { myShop } = useAppSelector((state) => state.shops);

  React.useEffect(() => {
    if (user) dispatch(fetchMyShop());
  }, [dispatch, user]);

  React.useEffect(() => {
    if (myShop?.status === 'approved') setListAsShop(true);
  }, [myShop?.id, myShop?.status]);

  const update =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }) => {
      setForm({ ...form, [field]: e.target.value });
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.hasStripeAccount) {
      setShowNoPaymentModal(true);
      return;
    }
    await doCreate();
  };

  const doCreate = async () => {
    if (!user) return;
    if (images.length < 2) {
      setImageError(t('listing.imagesAtLeastTwo', 'Please upload at least two photos.'));
      return;
    }
    const requiredMessage = t('listing.fieldRequired', 'This field is required.');
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = requiredMessage;
    if (!form.description.trim()) errors.description = requiredMessage;
    const priceNum = Number(form.price);
    if (form.price === '' || !Number.isFinite(priceNum)) {
      errors.price = requiredMessage;
    } else if (priceNum < MIN_PRICE_EUR) {
      errors.price = t('listing.minPrice', 'Minimum price is 10 €.');
    }
    if (!form.category) errors.category = requiredMessage;
    if (!form.size) errors.size = requiredMessage;
    if (!form.condition) errors.condition = requiredMessage;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    try {
      await dispatch(
        createListing({
          title: form.title,
          description: form.description,
          price: Number(form.price),
          originalPrice: Number(form.originalPrice),
          category: form.category as 'wedding' | 'graduation' | 'evening' | 'sport_dances',
          size: form.size,
          condition: form.condition as 'new' | 'like-new' | 'good' | 'fair',
          color: form.color,
          brand: form.brand,
          measurements: {
            bust: form.bust,
            waist: form.waist,
            hips: form.hips,
            length: form.length,
          },
          images,
          shopId: listAsShop && myShop?.status === 'approved' ? myShop.id : undefined,
        })
      ).unwrap();
      setShowNoPaymentModal(false);
      setSubmitted(true);
      setTimeout(() => navigate('/listings'), 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t('listing.createFailed', 'Failed to create listing. Please try again.');
      setSubmitError(msg);
    }
  };

  // When user has no payment method, we still show the form; on submit we show a confirmation modal.
  if (!user) {
    return (
      <PageContainer maxWidth="sm">
        <SectionHeader
          title={t('listing.addListing')}
          subtitle={t('checkout.title', 'Protected checkout')}
        />
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {t('auth.login', 'Please sign in to create a listing.')}
        </Alert>
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          {t('nav.login', 'Sign in')}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md">
      <Dialog open={showNoPaymentModal} onClose={() => setShowNoPaymentModal(false)}>
        <DialogTitle>
          {t('listing.noPaymentModalTitle', 'No payment method set up yet')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              'listing.noPaymentModalBody',
              "You haven't set up a payment method yet. You can still publish your listing, but you won't receive any payments or be able to complete a sale until you connect a payment method in your Profile. Do you want to proceed anyway?"
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNoPaymentModal(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowNoPaymentModal(false);
              doCreate();
            }}
          >
            {t('listing.proceedAnyway', 'Proceed anyway')}
          </Button>
        </DialogActions>
      </Dialog>
      <SectionHeader title={t('listing.addListing')} subtitle={t('listing.addListingSubtitle')} />
      <SafetyInfoCard
        title={t('safety.keepCommunicationOnPlatformTitle')}
        body={t('safety.keepCommunicationOnPlatformBody')}
      />
      {submitError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      {submitted && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {t('listing.createSuccess')}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 0.5, fontFamily: "'Playfair Display', serif" }}
        >
          {t('listing.photos')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            'listing.photosHint',
            'For best results upload at least three photos: front of the dress, back of the dress, and one photo where you are wearing it.'
          )}
        </Typography>
        <ImageUploader
          images={images}
          onChange={(urls) => {
            setImages(urls);
            setImageError(null);
            setUploadedSizes((prev) => {
              const next: Record<string, number> = {};
              urls.forEach((u) => {
                if (prev[u] !== undefined) next[u] = prev[u];
              });
              return next;
            });
          }}
          onUpload={async (file) => {
            try {
              const allowed = ['image/jpeg', 'image/png', 'image/webp'];
              if (!allowed.includes(file.type)) {
                const msg = t(
                  'listing.imagesInvalidType',
                  'File must be an image (JPEG, PNG or WebP).'
                );
                setImageError(msg);
                throw new Error(msg);
              }
              if (file.size > MAX_FILE_SIZE) {
                const msg = t(
                  'listing.imagesTooLarge',
                  'File is too large. Maximum size is 20MB per image.'
                );
                setImageError(msg);
                throw new Error(msg);
              }
              const currentTotal = images.reduce((s, u) => s + (uploadedSizes[u] ?? 0), 0);
              if (currentTotal + file.size > MAX_TOTAL_SIZE) {
                const msg = t(
                  'listing.imagesTotalTooLarge',
                  'Total images size would exceed 40MB. Remove some or use smaller files.'
                );
                setImageError(msg);
                throw new Error(msg);
              }
              const url = await dispatch(uploadListingImage(file)).unwrap();
              setUploadedSizes((prev) => ({ ...prev, [url]: file.size }));
              return url;
            } catch (err: any) {
              const status = err?.response?.status;
              let msg: string;
              if (status === 413) {
                msg = t(
                  'listing.imagesTooLarge',
                  'File is too large. Maximum size is 20MB per image.'
                );
              } else if (err?.code === 'ECONNABORTED' || err?.message?.toLowerCase().includes('timeout')) {
                msg = t(
                  'listing.imageUploadTimeout',
                  'Upload took too long. Try a smaller image or better connection.'
                );
              } else {
                msg =
                  err?.response?.data?.message ||
                  (err as Error)?.message ||
                  t('listing.imageUploadFailed', 'Image upload failed. Please try again.');
              }
              setImageError(msg);
              throw err;
            }
          }}
        />
        {imageError && (
          <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }} onClose={() => setImageError(null)}>
            {imageError}
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('listing.titleLabel')}
              value={form.title}
              onChange={update('title')}
              error={!!fieldErrors.title}
              helperText={fieldErrors.title}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('listing.description')}
              multiline
              rows={4}
              value={form.description}
              onChange={update('description')}
              error={!!fieldErrors.description}
              helperText={fieldErrors.description}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label={t('listing.price')}
              type="number"
              inputProps={{ min: MIN_PRICE_EUR, step: 0.01 }}
              helperText={fieldErrors.price || t('listing.minPriceHelp', 'Minimum 10 € for protected checkout')}
              value={form.price}
              onChange={update('price')}
              error={!!fieldErrors.price}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label={t('listing.originalPrice')}
              type="number"
              value={form.originalPrice}
              onChange={update('originalPrice')}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth error={!!fieldErrors.category}>
              <InputLabel>{t('listing.category')}</InputLabel>
              <Select value={form.category} label={t('listing.category')} onChange={update('category')}>
                <MenuItem value="wedding">{t('listing.category_wedding')}</MenuItem>
                <MenuItem value="graduation">{t('listing.category_graduation')}</MenuItem>
                <MenuItem value="evening">{t('listing.category_evening')}</MenuItem>
                <MenuItem value="sport_dances">{t('listing.category_sport_dances', 'Sport dances')}</MenuItem>
              </Select>
              {fieldErrors.category && <FormHelperText>{fieldErrors.category}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth error={!!fieldErrors.size}>
              <InputLabel>{t('listing.size')}</InputLabel>
              <Select value={form.size} label={t('listing.size')} onChange={update('size')}>
                {['XS', 'S', 'M', 'L', 'XL'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
              {fieldErrors.size && <FormHelperText>{fieldErrors.size}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth error={!!fieldErrors.condition}>
              <InputLabel>{t('listing.condition')}</InputLabel>
              <Select value={form.condition} label={t('listing.condition')} onChange={update('condition')}>
                <MenuItem value="new">{t('listing.condition_new')}</MenuItem>
                <MenuItem value="like-new">{t('listing.condition_like-new')}</MenuItem>
                <MenuItem value="good">{t('listing.condition_good')}</MenuItem>
                <MenuItem value="fair">{t('listing.condition_fair')}</MenuItem>
              </Select>
              {fieldErrors.condition && <FormHelperText>{fieldErrors.condition}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label={t('listing.color')} value={form.color} onChange={update('color')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label={t('listing.brand')} value={form.brand} onChange={update('brand')} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: "'Playfair Display', serif", mt: 1 }}>{t('listing.measurements')}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label={t('listing.bust')} value={form.bust} onChange={update('bust')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label={t('listing.waist')} value={form.waist} onChange={update('waist')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label={t('listing.hips')} value={form.hips} onChange={update('hips')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label={t('listing.length')} value={form.length} onChange={update('length')} /></Grid>

          {myShop?.status === 'approved' && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={listAsShop}
                    onChange={(e) => setListAsShop(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('listing.listAsShop', 'List as {{shopName}}', { shopName: myShop.name })}
              />
            </Grid>
          )}
        </Grid>

        <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 4, py: 1.5 }}>
          {t('listing.publish')}
        </Button>
      </Box>
    </PageContainer>
  );
};

export default CreateListing;
