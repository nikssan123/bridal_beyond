import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';

const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageContainer maxWidth="md">
      <SectionHeader
        title={t('legal.privacyTitle')}
        subtitle={t('legal.privacySubtitle')}
        align="left"
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('legal.effectiveDate')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {t('legal.languageNotice')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.privacy.dataWeCollectTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.privacy.dataWeCollectText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.privacy.dataWeCollectText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.privacy.howWeUseDataTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.privacy.howWeUseDataText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.privacy.howWeUseDataText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.privacy.paymentsStripeTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.privacy.paymentsStripeText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.privacy.paymentsStripeText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.privacy.dataRetentionTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.privacy.dataRetentionText1')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.privacy.rightsTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.privacy.rightsText1')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.contactTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.contactText')}
        </Typography>
      </Box>
    </PageContainer>
  );
};

export default Privacy;

