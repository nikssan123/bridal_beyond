import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { setStoredLanguage } from '@/i18n';

const LANGUAGES = [
  { code: 'bg', labelKey: 'common.bg' },
  { code: 'en', labelKey: 'common.en' },
] as const;

const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentLng = i18n.language?.split('-')[0] || 'bg';

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setStoredLanguage(code);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ color: 'inherit' }}
        aria-label={t('common.language')}
        size="small"
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {LANGUAGES.map(({ code, labelKey }) => (
          <MenuItem key={code} onClick={() => handleSelect(code)}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {currentLng === code ? <CheckIcon fontSize="small" /> : null}
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">{t(labelKey)}</Typography>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
