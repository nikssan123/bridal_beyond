import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <Box sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', mt: 8, pt: 6, pb: 4 }}>
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', mb: 2 }}>
            Грация
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            Пазарът за предварително притежавани сватбени и абитуриентски рокли в България. 
            Елегантност на достъпна цена.
          </Typography>
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            Навигация
          </Typography>
          {[
            { label: 'Начало', to: '/' },
            { label: 'Обяви', to: '/listings' },
            { label: 'Добави обява', to: '/create' },
          ].map((link) => (
            <MuiLink
              key={link.to}
              component={Link}
              to={link.to}
              sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 1, textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: 'primary.main' } }}
            >
              {link.label}
            </MuiLink>
          ))}
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            Категории
          </Typography>
          {['Сватбени рокли', 'Абитуриентски', 'Вечерни рокли'].map((cat) => (
            <MuiLink
              key={cat}
              component={Link}
              to="/listings"
              sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 1, textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: 'primary.main' } }}
            >
              {cat}
            </MuiLink>
          ))}
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            Контакти
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            info@gracia.bg<br />
            София, България
          </Typography>
        </Grid>
      </Grid>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 4 }} />
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        © 2025 Грация. Всички права запазени.
      </Typography>
    </Container>
  </Box>
);

export default Footer;
