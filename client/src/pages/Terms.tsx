import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';

const Terms: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageContainer maxWidth="md">
      <SectionHeader
        title={t('legal.termsTitle')}
        subtitle={t('legal.termsSubtitle')}
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
          {t('legal.terms.useOfServiceTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.terms.useOfServiceText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.terms.useOfServiceText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.terms.accountsPaymentsTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.terms.accountsPaymentsText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.terms.accountsPaymentsText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.terms.listingsTransactionsTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.terms.listingsTransactionsText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.terms.listingsTransactionsText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.terms.disputesTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.terms.disputesText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.terms.disputesText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.terms.liabilityTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('legal.terms.liabilityText1')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.terms.liabilityText2')}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('legal.terms.terminationTitle')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('legal.terms.terminationText1')}
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

export default Terms;

