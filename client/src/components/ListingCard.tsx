import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
}

const ListingCard: React.FC<Props> = ({ listing }) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/listings/${listing.id}`)}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
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
          height={320}
          image={listing.images[0]}
          alt={listing.title}
          sx={{ objectFit: 'cover' }}
        />
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
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, mb: 0.5, lineHeight: 1.3 }}>
          {listing.title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
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
