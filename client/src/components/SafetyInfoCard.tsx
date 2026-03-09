import React from 'react';
import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface Props {
  title: string;
  body: string;
}

const SafetyInfoCard: React.FC<Props> = ({ title, body }) => {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: { xs: 2.5, sm: 3 },
        mb: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <InfoOutlinedIcon sx={{ color: 'primary.main', mt: 0.3 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {body}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SafetyInfoCard;

