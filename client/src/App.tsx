import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import theme from './theme/theme';
import { store } from './app/store';
import { fetchMe } from './features/auth/authSlice';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import BrowseListings from './pages/BrowseListings';
import ListingDetails from './pages/ListingDetails';
import CreateListing from './pages/CreateListing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !store.getState().auth.user) {
      store.dispatch(fetchMe());
    }
  }, []);

  return (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<BrowseListings />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/create" element={<CreateListing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </Provider>
);

};

export default App;
