import React, { useRef, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

const ImageUploader: React.FC<Props> = ({ images, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onChange([...images, ev.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <Box>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <Box
            key={idx}
            sx={{
              width: 100, height: 100, borderRadius: 2, overflow: 'hidden',
              position: 'relative', border: '1px solid', borderColor: 'divider',
            }}
          >
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton
              size="small"
              onClick={() => removeImage(idx)}
              sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', p: 0.3, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        <Box
          onClick={() => fileRef.current?.click()}
          sx={{
            width: 100, height: 100, borderRadius: 2, border: '2px dashed', borderColor: 'primary.main',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.dark' },
          }}
        >
          <AddPhotoAlternateOutlinedIcon sx={{ color: 'primary.dark', mb: 0.5 }} />
          <Typography variant="caption" color="primary.dark">Добави</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ImageUploader;
