import React from 'react';
import { Box, Typography, Avatar, Rating, Chip, Divider, Tooltip, Button } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '@/lib/avatarUrl';

interface Props {
  seller: {
    name: string;
    avatar: string;
    rating: number;
    listings: number;
    location: string;
    memberSince: string;
    isVerified?: boolean;
  };
  sellerId?: string;
}

const SellerCard: React.FC<Props> = ({ seller, sellerId }) => {
  const { t } = useTranslation();
  return (
  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Avatar
        src={getAvatarUrl(seller.avatar) || undefined}
        sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.2rem', fontFamily: "'Playfair Display', serif" }}
      >
        {seller.name.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>{seller.name}</Typography>
          {seller.isVerified === true && (
            <Tooltip title={t('profile.verifiedAccount')}>
              <VerifiedIcon sx={{ fontSize: 18, color: 'primary.dark' }} />
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2">{seller.location}</Typography>
        </Box>
      </Box>
    </Box>
    <Divider sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Rating value={seller.rating} precision={0.1} readOnly size="small" />
      <Typography variant="body2" fontWeight={500}>{seller.rating}</Typography>
    </Box>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      <Chip label={t('profile.listingsCount', { count: seller.listings })} size="small" variant="outlined" />
      <Chip label={`${t('profile.memberSince')} ${seller.memberSince}`} size="small" variant="outlined" />
      {sellerId && (
        <Button
          component={Link}
          to={`/sellers/${sellerId}`}
          size="small"
          startIcon={<PersonOutlineIcon />}
          sx={{ ml: 'auto' }}
        >
          {t('profile.viewSellerProfile', 'View profile')}
        </Button>
      )}
    </Box>
  </Box>
  );
};

export default SellerCard;
