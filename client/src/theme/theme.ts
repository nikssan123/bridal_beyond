import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#D4A99A',
      light: '#E8CFC6',
      dark: '#B8897A',
      contrastText: '#2D2D2D',
    },
    secondary: {
      main: '#2D2D2D',
      light: '#4A4A4A',
      dark: '#1A1A1A',
      contrastText: '#FAF7F5',
    },
    background: {
      default: '#FAF7F5',
      paper: '#FDFBFA',
    },
    text: {
      primary: '#2D2D2D',
      secondary: '#6B6B6B',
    },
    divider: '#E8E0DC',
  },
  typography: {
    fontFamily: "'Work Sans', sans-serif",
    h1: { fontFamily: "'Playfair Display', serif", fontWeight: 600 },
    h2: { fontFamily: "'Playfair Display', serif", fontWeight: 600 },
    h3: { fontFamily: "'Playfair Display', serif", fontWeight: 500 },
    h4: { fontFamily: "'Playfair Display', serif", fontWeight: 500 },
    h5: { fontFamily: "'Playfair Display', serif", fontWeight: 500 },
    h6: { fontFamily: "'Playfair Display', serif", fontWeight: 500 },
    button: { fontFamily: "'Work Sans', sans-serif", fontWeight: 500, textTransform: 'none' as const },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #D4A99A 0%, #C4918A 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #C4918A 0%, #B8897A 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid #E8E0DC',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FAF7F5',
          color: '#2D2D2D',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
      },
    },
  },
});

export default theme;
