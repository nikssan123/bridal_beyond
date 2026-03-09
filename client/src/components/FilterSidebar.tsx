import React from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Slider, Button, Drawer,
  useMediaQuery, useTheme, Divider,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCategory, setSize, setCondition, setPriceRange, resetFilters } from '@/features/filters/filtersSlice';

interface Props {
  open: boolean;
  onClose: () => void;
}

const FilterContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const backendMaxPrice = useAppSelector((state) => state.listings.maxPrice);
  const fallbackMax = 5000;
  const sliderMax = backendMaxPrice && backendMaxPrice > 0 ? backendMaxPrice : fallbackMax;
  const sliderValue: [number, number] = [
    Math.max(0, Math.min(filters.priceRange[0], sliderMax)),
    Math.max(0, Math.min(filters.priceRange[1], sliderMax)),
  ];

  return (
    <Box sx={{ p: 3, width: { xs: 300, md: 'auto' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif" }}>Филтри</Typography>
        <Button size="small" onClick={() => dispatch(resetFilters())} sx={{ color: 'text.secondary' }}>
          Изчисти
        </Button>
      </Box>

      <FormControl fullWidth sx={{ mb: 2.5 }} size="small">
        <InputLabel>Категория</InputLabel>
        <Select value={filters.category} label="Категория" onChange={(e) => dispatch(setCategory(e.target.value))}>
          <MenuItem value="">Всички</MenuItem>
          <MenuItem value="wedding">Сватбени</MenuItem>
          <MenuItem value="graduation">Абитуриентски</MenuItem>
          <MenuItem value="evening">Вечерни</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2.5 }} size="small">
        <InputLabel>Размер</InputLabel>
        <Select value={filters.size} label="Размер" onChange={(e) => dispatch(setSize(e.target.value))}>
          <MenuItem value="">Всички</MenuItem>
          {['XS', 'S', 'M', 'L', 'XL'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2.5 }} size="small">
        <InputLabel>Състояние</InputLabel>
        <Select value={filters.condition} label="Състояние" onChange={(e) => dispatch(setCondition(e.target.value))}>
          <MenuItem value="">Всички</MenuItem>
          <MenuItem value="new">Нова</MenuItem>
          <MenuItem value="like-new">Като нова</MenuItem>
          <MenuItem value="good">Добро</MenuItem>
          <MenuItem value="fair">Задоволително</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Цена (€)</Typography>
      <Slider
        value={sliderValue}
        onChange={(_, val) => dispatch(setPriceRange(val as [number, number]))}
        min={0}
        max={sliderMax}
        step={50}
        valueLabelDisplay="auto"
        sx={{ color: 'primary.dark', mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">{filters.priceRange[0]} €</Typography>
        <Typography variant="caption" color="text.secondary">{filters.priceRange[1]} €</Typography>
      </Box>

      {onClose && (
        <Button fullWidth variant="contained" onClick={onClose} sx={{ mt: 3 }}>
          Приложи
        </Button>
      )}
    </Box>
  );
};

const FilterSidebar: React.FC<Props> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Drawer anchor="left" open={open} onClose={onClose}>
        <FilterContent onClose={onClose} />
      </Drawer>
    );
  }

  return (
    <Box sx={{ minWidth: 260, pr: 3 }}>
      <FilterContent />
    </Box>
  );
};

export default FilterSidebar;
export { TuneIcon };
