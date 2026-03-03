import React, { useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Chip, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import heroImg from '@/assets/hero-wedding.jpg';
import ListingCard from '@/components/ListingCard';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListings } from '@/features/listings/listingsSlice';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { listings, status } = useAppSelector((state) => state.listings);
  const featured = listings.slice(0, 3);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchListings({}));
  }, [dispatch, status]);

  return (
    <>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '70vh', md: '80vh' },
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(45,45,45,0.55) 0%, rgba(45,45,45,0.2) 100%)',
            },
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ maxWidth: 600 }}>
            <Typography
              variant="h2"
              sx={{
                color: '#FAF7F5',
                fontWeight: 700,
                fontSize: { xs: '2.2rem', md: '3.5rem' },
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              {t('home.heroTitle')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(250,247,245,0.85)',
                fontWeight: 300,
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              {t('home.heroSubtitle')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/listings')}
                sx={{
                  bgcolor: '#FAF7F5',
                  color: '#2D2D2D',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#E8CFC6' },
                }}
              >
                {t('home.browseListings')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/create')}
                sx={{
                  borderColor: 'rgba(250,247,245,0.6)',
                  color: '#FAF7F5',
                  px: 4,
                  py: 1.5,
                  '&:hover': { borderColor: '#FAF7F5', bgcolor: 'rgba(250,247,245,0.1)' },
                }}
              >
                {t('home.sellDress')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <SectionHeader title={t('home.categories')} subtitle={t('home.categoriesSubtitle')} align="center" />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {[
            { label: t('home.wedding'), emoji: '👰', value: 'wedding' },
            { label: t('home.graduation'), emoji: '🎓', value: 'graduation' },
            { label: t('home.evening'), emoji: '✨', value: 'evening' },
          ].map((cat) => (
            <Chip
              key={cat.value}
              label={`${cat.emoji}  ${cat.label}`}
              onClick={() => navigate(`/listings?category=${cat.value}`)}
              sx={{
                px: 3, py: 3, fontSize: '1rem', borderRadius: 3,
                border: '1px solid', borderColor: 'divider',
                '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' },
              }}
            />
          ))}
        </Box>
      </Container>

      {/* Featured */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg">
          <SectionHeader title={t('home.featured')} subtitle={t('home.featuredSubtitle')} />
          {status === 'loading' && listings.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: 'primary.dark' }} />
            </Box>
          ) : (
            <>
          <Grid container spacing={3}>
            {featured.map((listing) => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <ListingCard listing={listing} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/listings')}
              sx={{ borderColor: 'secondary.main', color: 'secondary.main', px: 4 }}
            >
              {t('home.viewAllListings')}
            </Button>
          </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Trust */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <SectionHeader title={t('home.whyGracia')} align="center" />
        <Grid container spacing={4}>
          {[
            { icon: '🛡️', titleKey: 'home.trust1Title', descKey: 'home.trust1Desc' },
            { icon: '💎', titleKey: 'home.trust2Title', descKey: 'home.trust2Desc' },
            { icon: '🤝', titleKey: 'home.trust3Title', descKey: 'home.trust3Desc' },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.titleKey}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h3" sx={{ mb: 2 }}>{item.icon}</Typography>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>{t(item.titleKey)}</Typography>
                <Typography variant="body2" color="text.secondary">{t(item.descKey)}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ */}
      <Box id="faq" sx={{ bgcolor: 'background.default', py: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg">
          <SectionHeader
            title={t('home.faqTitle')}
            subtitle={t('home.faqSubtitle')}
            align="center"
          />
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {[
              { q: t('home.faq_q1'), a: t('home.faq_a1') },
              { q: t('home.faq_q2'), a: t('home.faq_a2') },
              { q: t('home.faq_q3'), a: t('home.faq_a3') },
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {item.q}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.a}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default Home;
