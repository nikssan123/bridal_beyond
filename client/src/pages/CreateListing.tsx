import React, { useState } from 'react';
import {
  Box, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Typography, Alert,
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ImageUploader from '@/components/ImageUploader';
import { useAppDispatch } from '@/app/hooks';
import { createListing } from '@/features/listings/listingsSlice';
import { useNavigate } from 'react-router-dom';

const CreateListing: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', originalPrice: '',
    category: '', size: '', condition: '', color: '', brand: '',
    bust: '', waist: '', hips: '', length: '',
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(createListing({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      category: form.category as 'wedding' | 'graduation' | 'evening',
      size: form.size,
      condition: form.condition as 'new' | 'like-new' | 'good' | 'fair',
      color: form.color,
      brand: form.brand,
      measurements: { bust: form.bust, waist: form.waist, hips: form.hips, length: form.length },
      images: images.length > 0 ? images : ['/placeholder.svg'],
    }));
    setSubmitted(true);
    setTimeout(() => navigate('/listings'), 1500);
  };

  return (
    <PageContainer maxWidth="md">
      <SectionHeader title="Добави обява" subtitle="Продайте роклята си бързо и лесно" />
      {submitted && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Обявата е създадена успешно!</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, fontFamily: "'Playfair Display', serif" }}>Снимки</Typography>
        <ImageUploader images={images} onChange={setImages} />

        <Grid container spacing={2.5} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Заглавие" value={form.title} onChange={update('title')} required />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Описание" multiline rows={4} value={form.description} onChange={update('description')} required />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Цена (лв.)" type="number" value={form.price} onChange={update('price')} required />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Оригинална цена (лв.)" type="number" value={form.originalPrice} onChange={update('originalPrice')} required />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth required>
              <InputLabel>Категория</InputLabel>
              <Select value={form.category} label="Категория" onChange={update('category')}>
                <MenuItem value="wedding">Сватбена</MenuItem>
                <MenuItem value="graduation">Абитуриентска</MenuItem>
                <MenuItem value="evening">Вечерна</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth required>
              <InputLabel>Размер</InputLabel>
              <Select value={form.size} label="Размер" onChange={update('size')}>
                {['XS', 'S', 'M', 'L', 'XL'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth required>
              <InputLabel>Състояние</InputLabel>
              <Select value={form.condition} label="Състояние" onChange={update('condition')}>
                <MenuItem value="new">Нова</MenuItem>
                <MenuItem value="like-new">Като нова</MenuItem>
                <MenuItem value="good">Добро</MenuItem>
                <MenuItem value="fair">Задоволително</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Цвят" value={form.color} onChange={update('color')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Марка" value={form.brand} onChange={update('brand')} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: "'Playfair Display', serif", mt: 1 }}>Размери</Typography>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Бюст" value={form.bust} onChange={update('bust')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Талия" value={form.waist} onChange={update('waist')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Ханш" value={form.hips} onChange={update('hips')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Дължина" value={form.length} onChange={update('length')} /></Grid>
        </Grid>

        <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 4, py: 1.5 }}>
          Публикувай обявата
        </Button>
      </Box>
    </PageContainer>
  );
};

export default CreateListing;
