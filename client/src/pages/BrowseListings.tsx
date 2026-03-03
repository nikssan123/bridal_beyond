import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Grid, Box, Button, useMediaQuery, useTheme, CircularProgress, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import TuneIcon from '@mui/icons-material/Tune';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListings } from '@/features/listings/listingsSlice';
import { setCategory } from '@/features/filters/filtersSlice';
import { useTranslation } from 'react-i18next';

const ALLOWED_CATEGORIES = ['wedding', 'graduation', 'evening'] as const;

const BrowseListings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { listings, total, hasMore, status, loadingMore } = useAppSelector((state) => state.listings);
  const filters = useAppSelector((state) => state.filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && (ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
      dispatch(setCategory(category));
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    dispatch(fetchListings({}));
  }, [dispatch, filters.category, filters.size, filters.condition, filters.priceRange[0], filters.priceRange[1], filters.searchQuery, filters.sortBy]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && status !== 'loading') {
      dispatch(fetchListings({ append: true }));
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
      <SectionHeader title={t('listings.title')} subtitle={t('listings.foundCount', { count: total })} />
      {isMobile && (
        <Button startIcon={<TuneIcon />} onClick={() => setFilterOpen(true)} sx={{ mb: 2, color: 'text.primary' }}>
          {t('listings.filters')}
        </Button>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 },
        }}
      >
        {!isMobile && <FilterSidebar open={filterOpen} onClose={() => setFilterOpen(false)} />}
        <Box sx={{ flexGrow: 1 }}>
          {status === 'loading' && listings.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: 'primary.dark' }} />
            </Box>
          ) : listings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">{t('listings.noResults')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('listings.tryDifferentFilters')}</Typography>
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

export default BrowseListings;
