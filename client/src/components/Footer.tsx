import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
  <Box
    sx={{
      bgcolor: 'secondary.main',
      color: 'secondary.contrastText',
      mt: { xs: 6, md: 8 },
      pt: { xs: 4, md: 6 },
      pb: { xs: 3, md: 4 },
    }}
  >
    <Container maxWidth="lg">
      <Grid container spacing={4} alignItems="flex-start">
        <Grid item xs={12} md={4}>
          <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', mb: 2 }}>
            {t('brand')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            {t('footer.tagline')}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {t('footer.navigation')}
          </Typography>
          {[
            { label: t('nav.home'), to: '/' },
            { label: t('nav.listings'), to: '/listings' },
            { label: t('nav.addListing'), to: '/create' },
            { label: t('footer.faq'), to: '/#faq' },
          ].map((link) => (
            <MuiLink
              key={link.to}
              component={Link}
              to={link.to}
              sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 1, textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: 'primary.main' } }}
            >
              {link.label}
            </MuiLink>
          ))}
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {t('footer.categories')}
          </Typography>
          {[
            { label: t('footer.weddingDresses'), to: '/listings?category=wedding' },
            { label: t('footer.graduationDresses'), to: '/listings?category=graduation' },
            { label: t('footer.eveningDresses'), to: '/listings?category=evening' },
          ].map((link) => (
            <MuiLink
              key={link.to}
              component={Link}
              to={link.to}
              sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 1, textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: 'primary.main' } }}
            >
              {link.label}
            </MuiLink>
          ))}
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {t('footer.contacts')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            info@gracia.bg<br />
            {t('footer.location')}
          </Typography>
        </Grid>
      </Grid>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 4 }} />
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        {t('footer.copyright')}
      </Typography>
    </Container>
  </Box>
  );
};

export default Footer;
