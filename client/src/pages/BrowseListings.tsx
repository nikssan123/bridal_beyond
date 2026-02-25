import React, { useEffect, useState, useMemo } from 'react';
import { Grid, Box, Button, useMediaQuery, useTheme, CircularProgress, Typography } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListings } from '@/features/listings/listingsSlice';

const BrowseListings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { listings, status } = useAppSelector((state) => state.listings);
  const filters = useAppSelector((state) => state.filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchListings());
  }, [dispatch, filters.category, filters.size, filters.condition, filters.priceRange[0], filters.priceRange[1], filters.searchQuery, filters.sortBy]);

  const filtered = useMemo(() => listings, [listings]);

  return (
    <PageContainer>
      <SectionHeader title="Обяви" subtitle={`${filtered.length} рокли са намерени`} />
      {isMobile && (
        <Button startIcon={<TuneIcon />} onClick={() => setFilterOpen(true)} sx={{ mb: 2, color: 'text.primary' }}>
          Филтри
        </Button>
      )}
      <Box sx={{ display: 'flex' }}>
        <FilterSidebar open={filterOpen} onClose={() => setFilterOpen(false)} />
        <Box sx={{ flexGrow: 1 }}>
          {status === 'loading' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: 'primary.dark' }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">Няма намерени обяви</Typography>
              <Typography variant="body2" color="text.secondary">Опитайте с различни филтри</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((listing) => (
                <Grid item xs={12} sm={6} md={4} key={listing.id}>
                  <ListingCard listing={listing} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
};

export default BrowseListings;
