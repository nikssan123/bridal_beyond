import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { enlistShop, uploadShopLogo } from '@/features/shops/shopsSlice';
import { useTranslation } from 'react-i18next';
import { API_ORIGIN } from '@/lib/apiBase';

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

const EnlistShop: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myShopStatus } = useAppSelector((state) => state.shops);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === slugFromName(name)) {
      setSlug(slugFromName(v));
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setLogoError(null);
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError(t('shops.logoInvalidType', 'Use JPEG, PNG or WebP.'));
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError(t('shops.logoTooBig', 'Image must be 2 MB or smaller.'));
      return;
    }
    setLogoLoading(true);
    try {
      const url = await dispatch(uploadShopLogo(file)).unwrap();
      setLogoUrl(url);
    } catch (err) {
      setLogoError((err as string) || t('shops.logoUploadFailed', 'Upload failed.'));
    } finally {
      setLogoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nameTrim = name.trim();
    if (!nameTrim) return;
    const slugTrim = (slug || slugFromName(nameTrim)).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slugTrim) {
      setSubmitError(t('shops.slugRequired', 'Please enter a shop name that can be used to generate a URL slug.'));
      return;
    }
    try {
      await dispatch(
        enlistShop({
          name: nameTrim,
          slug: slugTrim,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
        })
      ).unwrap();
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as string) || t('shops.enlistFailed', 'Failed to submit. Try again.');
      setSubmitError(msg);
    }
  };

  if (success) {
    return (
      <PageContainer maxWidth="sm">
        <SectionHeader
          title={t('shops.enlistTitle', 'Enlist your shop')}
          subtitle={t('shops.enlistSubtitle', 'Apply to list your boutique on LoveReWorn')}
        />
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('shops.enlistSuccess', 'Your shop request has been submitted. We will review it and get back to you once approved.')}
          </Alert>
          <Button variant="contained" fullWidth onClick={() => navigate('/profile')}>
            {t('shops.goToProfile', 'Go to my profile')}
          </Button>
        </Paper>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <SectionHeader
        title={t('shops.enlistTitle', 'Enlist your shop')}
        subtitle={t('shops.enlistSubtitle', 'Apply to list your boutique on LoveReWorn')}
      />
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, borderRadius: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}
        <TextField
          fullWidth
          required
          label={t('shops.shopName', 'Shop name')}
          value={name}
          onChange={handleNameChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label={t('shops.slug', 'URL slug')}
          placeholder={slugFromName(name) || 'my-boutique'}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          margin="normal"
          helperText={t('shops.slugHelp', 'Used in the shop page URL. Leave empty to generate from name.')}
        />
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {t('shops.logoLabel', 'Shop logo')}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
            {t('shops.logoHelp', 'Recommended: 400×400 px (square) or 400×200 px (landscape). JPEG, PNG or WebP, max 2 MB.')}
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_LOGO_TYPES.join(',')}
            hidden
            onChange={handleLogoChange}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={logoLoading ? <CircularProgress size={18} /> : <ImageIcon />}
              disabled={logoLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoLoading ? t('common.loading', 'Loading…') : t('shops.chooseLogo', 'Choose image')}
            </Button>
            {logoUrl && (
              <Box
                component="img"
                src={logoUrl.startsWith('/') ? `${API_ORIGIN}${logoUrl}` : logoUrl}
                alt=""
                sx={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
              />
            )}
          </Box>
          {logoError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {logoError}
            </Typography>
          )}
        </Box>
        <TextField
          fullWidth
          label={t('shops.description', 'Description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />
        <TextField
          fullWidth
          label={t('shops.address', 'Address')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={myShopStatus === 'loading'}
          sx={{ mt: 3 }}
        >
          {myShopStatus === 'loading' ? <CircularProgress size={24} color="inherit" /> : t('shops.submitEnlist', 'Submit request')}
        </Button>
      </Paper>
    </PageContainer>
  );
};

export default EnlistShop;
