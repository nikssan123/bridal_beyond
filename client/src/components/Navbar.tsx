import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import PersonIcon from '@mui/icons-material/Person';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  selectNotifications,
  selectUnreadCount,
  markAllNotificationsRead,
  fetchNotifications,
} from '@/features/notifications/notificationsSlice';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { logout } from '@/features/auth/authSlice';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch]);

  const navLinks = [
    { label: t('nav.listings', 'Listings'), path: '/listings', icon: <ViewListIcon /> },
  ];

  const handleAddListingClick = () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    navigate('/create');
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
    if (unreadCount > 0) {
      dispatch(markAllNotificationsRead());
    }
  };

  const handleCloseNotifications = () => {
    setNotificationsAnchorEl(null);
  };

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              px: 0,
              minHeight: { xs: 56, sm: 64 },
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'common.black',
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontStyle: 'italic',
                letterSpacing: 1,
                maxWidth: { xs: 140, sm: 'none' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t('brand')}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1 },
                color: 'primary.main',
              }}
            >
              {isMobile ? (
                <IconButton
                  onClick={handleAddListingClick}
                  sx={{ color: 'primary.main' }}
                  aria-label={t('nav.addListing')}
                >
                  <AddIcon />
                </IconButton>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddListingClick}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.light',
                      color: 'primary.dark',
                    },
                  }}
                >
                  {t('nav.addListing')}
                </Button>
              )}
              {isAuthenticated && (
                <IconButton
                  component={Link}
                  to="/favorites"
                  sx={{ color: 'inherit' }}
                  aria-label={t('nav.favorites')}
                >
                  <FavoriteBorderIcon />
                </IconButton>
              )}
              {isAuthenticated && (
                <>
                  <IconButton
                    sx={{ color: 'inherit' }}
                    aria-label={t('nav.notifications', 'Notifications')}
                    onClick={handleOpenNotifications}
                  >
                    <Badge
                      color="secondary"
                      variant={unreadCount > 0 ? 'dot' : 'standard'}
                      badgeContent={unreadCount > 0 ? unreadCount : undefined}
                    >
                      <NotificationsNoneIcon />
                    </Badge>
                  </IconButton>
                  <Menu
                    anchorEl={notificationsAnchorEl}
                    open={Boolean(notificationsAnchorEl)}
                    onClose={handleCloseNotifications}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { minWidth: 260 } }}
                  >
                    {notifications.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          {t('nav.noNotifications', 'No notifications')}
                        </Typography>
                      </MenuItem>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <MenuItem
                          key={n.id}
                          onClick={() => {
                            if (n.href) {
                              navigate(n.href);
                              handleCloseNotifications();
                            }
                          }}
                          sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1 }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                              {n.title}
                            </Typography>
                            {n.body && (
                              <Typography variant="caption" color="text.secondary">
                                {n.body}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Menu>
                </>
              )}
              <Box component="span" sx={{ color: 'common.black' }}>
                <LanguageSwitcher />
              </Box>
              {!isAuthenticated &&
                (isMobile ? (
                  <IconButton
                    onClick={() => navigate('/login')}
                    sx={{ color: 'primary.main' }}
                    aria-label={t('nav.login')}
                  >
                    <LoginIcon />
                  </IconButton>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LoginIcon />}
                    onClick={() => navigate('/login')}
                    sx={{ ml: 1, whiteSpace: 'nowrap' }}
                  >
                    {t('nav.login')}
                  </Button>
                ))}
              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{ color: 'secondary.main' }}
                aria-label={t('nav.menu')}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box
          sx={{
            width: 280,
            pt: 2,
            color: 'primary.main',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              px: 3,
              pb: 2,
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontWeight: 600,
              color: 'common.black',
            }}
          >
            {t('brand')}
          </Typography>
          <List sx={{ flexGrow: 1 }}>
            {navLinks.map((link) => (
              <ListItem
                key={link.path}
                component={Link}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
                sx={{ color: 'inherit', '&:hover': { bgcolor: 'primary.light' } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'common.black' }}>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
            {isAuthenticated ? (
              <>
                <ListItem
                  component={Link}
                  to="/profile"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ color: 'inherit', '&:hover': { bgcolor: 'primary.light' } }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'common.black' }}>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.profile', 'Profile')} />
                </ListItem>
                <ListItem
                  component={Link}
                  to="/messages"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ color: 'inherit', '&:hover': { bgcolor: 'primary.light' } }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'common.black' }}>
                    <ChatBubbleOutlineIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.messages', 'Messages')} />
                </ListItem>
              </>
            ) : (
              <ListItem
                component={Link}
                to="/login"
                onClick={() => setDrawerOpen(false)}
                sx={{ color: 'inherit', '&:hover': { bgcolor: 'primary.light' } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'common.black' }}>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.loginOrRegister', 'Sign in / Register')} />
              </ListItem>
            )}
          </List>
          {isAuthenticated && (
            <>
              <Divider />
              <ListItem
                onClick={() => {
                  dispatch(logout());
                  setDrawerOpen(false);
                  navigate('/');
                }}
                sx={{ color: 'inherit', '&:hover': { bgcolor: 'primary.light' } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'common.black' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.logout', 'Logout')} />
              </ListItem>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
