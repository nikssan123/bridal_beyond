import React, { useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleFavorite } from '@/features/favorites/favoritesSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import type { Listing } from '@/data/mockData';

const conditionLabels: Record<string, string> = {
  new: 'Нова',
  'like-new': 'Като нова',
  good: 'Добро',
  fair: 'Задоволително',
};

const categoryLabels: Record<string, string> = {
  wedding: 'Сватбена',
  graduation: 'Абитуриентска',
  evening: 'Вечерна',
};

interface Props {
  listing: Listing;
  isFavorite?: boolean;
  onRemoveFavorite?: (e: React.MouseEvent) => void;
}

const ListingCard: React.FC<Props> = ({ listing, isFavorite: isFavoriteProp, onRemoveFavorite }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const listingIds = useAppSelector((state) => state.favorites.listingIds);
  const isFavorite = isFavoriteProp ?? listingIds.includes(listing.id);
  const images = listing.images?.length ? listing.images : [listing.images?.[0]].filter(Boolean) as string[];
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFavorite) {
      onRemoveFavorite(e);
    } else {
      dispatch(toggleFavorite(listing.id));
    }
  };

  const displayImage = images[currentIndex] ?? images[0];

  return (
    <Card
      onClick={() => navigate(`/listings/${listing.id}`)}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: { xs: '0 4px 16px rgba(0,0,0,0.06)', sm: '0 8px 30px rgba(0,0,0,0.08)' },
        },
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          image={getAvatarUrl(displayImage) || displayImage}
          alt={listing.title}
          sx={{
            height: { xs: 260, sm: 300, md: 320 },
            objectFit: 'cover',
            width: '100%',
            transition: 'opacity 0.3s ease',
          }}
        />
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 0.5,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((_, idx) => (
              <Box
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                sx={{
                  width: currentIndex === idx ? 8 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: currentIndex === idx ? 'primary.main' : 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                aria-label={`Image ${idx + 1} of ${images.length}`}
              />
            ))}
          </Box>
        )}
        {isAuthenticated && (
          <IconButton
            onClick={handleFavoriteClick}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <FavoriteIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            ) : (
              <FavoriteBorderIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            )}
          </IconButton>
        )}
        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 0.5 }}>
          <Chip
            label={categoryLabels[listing.category]}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}
          />
          <Chip
            label={conditionLabels[listing.condition]}
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 500, fontSize: '0.75rem' }}
          />
        </Box>
      </Box>
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2, md: 2.5 },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            mb: 0.5,
            lineHeight: 1.3,
            fontSize: { xs: '0.95rem', md: '1.05rem' },
          }}
        >
          {listing.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 1.5,
            fontSize: { xs: '0.8rem', md: '0.875rem' },
          }}
        >
          Размер: {listing.size} · {listing.seller.location}
        </Typography>
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
            {listing.price} лв.
          </Typography>
          <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
            {listing.originalPrice} лв.
          </Typography>
          <Chip
            label={`-${Math.round((1 - listing.price / listing.originalPrice) * 100)}%`}
            size="small"
            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.7rem', height: 22 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
