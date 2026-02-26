import React, { useEffect } from 'react';
import { Grid, Box, Button, CircularProgress, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ListingCard from '@/components/ListingCard';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchFavorites, removeFavorite } from '@/features/favorites/favoritesSlice';
import { useTranslation } from 'react-i18next';

const Favorites: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { favoriteListings, listingIds, status } = useAppSelector((state) => state.favorites);

  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  return (
    <PageContainer>
      <SectionHeader
        title={t('favorites.title')}
        subtitle={t('favorites.subtitle', { count: favoriteListings.length })}
      />
      {status === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      ) : favoriteListings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {t('favorites.empty')}
          </Typography>
          <Button component={Link} to="/listings" variant="contained" color="primary">
            {t('favorites.browseListings')}
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favoriteListings.map((listing) => (
            <Grid item xs={12} sm={6} md={4} key={listing.id}>
              <ListingCard
                listing={listing}
                isFavorite={true}
                onRemoveFavorite={(e) => {
                  e.stopPropagation();
                  dispatch(removeFavorite(listing.id));
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
};

export default Favorites;
