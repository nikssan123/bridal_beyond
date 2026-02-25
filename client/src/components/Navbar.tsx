import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Box, Drawer,
  List, ListItem, ListItemText, useMediaQuery, useTheme, Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import { useAppSelector } from '@/app/hooks';

const Navbar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const navLinks = [
    { label: 'Начало', path: '/' },
    { label: 'Обяви', path: '/listings' },
  ];

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: 0 }}>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'secondary.main',
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontStyle: 'italic',
                letterSpacing: 1,
              }}
            >
              Грация
            </Typography>

            {isMobile ? (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'secondary.main' }}>
                <MenuIcon />
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    component={Link}
                    to={link.path}
                    sx={{ color: 'text.primary', fontWeight: 400, fontSize: '0.95rem' }}
                  >
                    {link.label}
                  </Button>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/create')}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.dark',
                    ml: 1,
                    '&:hover': { borderColor: 'primary.dark', backgroundColor: 'primary.light' },
                  }}
                >
                  Добави обява
                </Button>
                {isAuthenticated ? (
                  <IconButton sx={{ color: 'primary.dark' }}>
                    <FavoriteBorderIcon />
                  </IconButton>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/login')}
                    sx={{ ml: 1 }}
                  >
                    Вход
                  </Button>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography
            variant="h5"
            sx={{ px: 3, pb: 2, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 600 }}
          >
            Грация
          </Typography>
          <List>
            {navLinks.map((link) => (
              <ListItem
                key={link.path}
                component={Link}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
                sx={{ color: 'text.primary', '&:hover': { bgcolor: 'primary.light' } }}
              >
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
            <ListItem
              component={Link}
              to="/create"
              onClick={() => setDrawerOpen(false)}
              sx={{ color: 'primary.dark' }}
            >
              <ListItemText primary="Добави обява" />
            </ListItem>
            <ListItem
              component={Link}
              to="/login"
              onClick={() => setDrawerOpen(false)}
              sx={{ color: 'text.primary' }}
            >
              <ListItemText primary="Вход / Регистрация" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
