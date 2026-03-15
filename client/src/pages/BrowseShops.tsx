import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Grid,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Typography,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { Link } from 'react-router-dom';
import TuneIcon from '@mui/icons-material/Tune';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchShops } from '@/features/shops/shopsSlice';
import { fetchListings } from '@/features/listings/listingsSlice';
import { useTranslation } from 'react-i18next';
import SeoHelmet from '@/components/SeoHelmet';
import { getAvatarUrl } from '@/lib/avatarUrl';

const PAGE_SIZE = 12;

const BrowseShops: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops, shopsStatus } = useAppSelector((state) => state.shops);
  const { listings, total, hasMore, status, loadingMore } = useAppSelector((state) => state.listings);
  const filters = useAppSelector((state) => state.filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchListings({ fromShop: true }));
    }, 250);
    return () => clearTimeout(timeout);
  }, [
    dispatch,
    filters.category,
    filters.size,
    filters.priceRange[0],
    filters.priceRange[1],
    filters.searchQuery,
    filters.sortBy,
  ]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && status !== 'loading') {
      dispatch(fetchListings({ append: true, fromShop: true }));
    }
  }, [dispatch, hasMore, loadingMore, status]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore, listings.length]);

  return (
    <PageContainer>
      <SeoHelmet
        title={t('shops.metaTitle', 'Shops & Boutiques – LoveReWorn')}
        description={t(
          'shops.metaDescription',
          'Browse dresses from verified shops and boutiques. Pre-owned wedding, graduation and evening dresses.'
        )}
      />
      <SectionHeader
        title={t('shops.title', 'Shops & Boutiques')}
        subtitle={t('shops.subtitle', 'Dresses from verified shops and boutiques')}
      />

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
        {t('shops.browseShops', 'Browse shops')}
      </Typography>
      {shopsStatus === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      ) : shops.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('shops.noShopsYet', 'No shops yet.')}</Typography>
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {shops.map((shop) => (
            <Grid item xs={12} sm={6} md={4} key={shop.id}>
              <Card
                component={Link}
                to={`/shops/${shop.slug || shop.id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardMedia
                  sx={{
                    height: 160,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {shop.logoUrl ? (
                    <Box
                      component="img"
                      src={getAvatarUrl(shop.logoUrl) || shop.logoUrl}
                      alt=""
                      sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', p: 2 }}
                    />
                  ) : (
                    <StorefrontOutlinedIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                    {shop.name}
                  </Typography>
                  {shop.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
                      {shop.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {t('shops.listingsCount', { count: shop.listingsCount })} • {t('shops.viewShop', 'View shop')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {t('shops.allShopListings', 'All listings from shops')}
      </Typography>
      {isMobile && (
        <Button startIcon={<TuneIcon />} onClick={() => setFilterOpen(true)} sx={{ mb: 2, color: 'text.primary' }}>
          {t('listings.filters')}
        </Button>
      )}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
        <FilterSidebar open={filterOpen} onClose={() => setFilterOpen(false)} hideCondition />
        <Box sx={{ flexGrow: 1 }}>
          {status === 'loading' && listings.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: 'primary.dark' }} />
            </Box>
          ) : listings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {t('listings.noResults')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('listings.tryDifferentFilters')}
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {listings.map((listing) => (
                  <Grid item xs={12} sm={6} md={4} key={listing.id}>
                    <ListingCard listing={listing} />
                  </Grid>
                ))}
              </Grid>
              <div ref={sentinelRef} style={{ minHeight: 1 }} aria-hidden />
              {loadingMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: 'primary.dark' }} />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
};

export default BrowseShops;
