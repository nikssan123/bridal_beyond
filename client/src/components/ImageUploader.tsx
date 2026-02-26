import React, { useRef, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { getAvatarUrl } from '@/lib/avatarUrl';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  /** When provided, files are uploaded to the server and the returned URL is added. Otherwise data URLs are used. */
  onUpload?: (file: File) => Promise<string>;
}

const ImageUploader: React.FC<Props> = ({ images, onChange, onUpload }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    if (onUpload) {
      setUploading(true);
      try {
        const urls = await Promise.all(files.map((file) => onUpload(file)));
        onChange([...images, ...urls]);
      } finally {
        setUploading(false);
      }
    } else {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            onChange([...images, ev.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const displaySrc = (img: string) => getAvatarUrl(img) || img;

  return (
    <Box>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={uploading} />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <Box
            key={idx}
            sx={{
              width: 100, height: 100, borderRadius: 2, overflow: 'hidden',
              position: 'relative', border: '1px solid', borderColor: 'divider',
            }}
          >
            <img src={displaySrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          onClick={() => !uploading && fileRef.current?.click()}
          sx={{
            width: 100, height: 100, borderRadius: 2, border: '2px dashed', borderColor: 'primary.main',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: uploading ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: uploading ? 0.7 : 1,
            '&:hover': uploading ? {} : { bgcolor: 'primary.light', borderColor: 'primary.dark' },
          }}
        >
          {uploading ? (
            <CircularProgress size={24} sx={{ color: 'primary.dark' }} />
          ) : (
            <>
              <AddPhotoAlternateOutlinedIcon sx={{ color: 'primary.dark', mb: 0.5 }} />
              <Typography variant="caption" color="primary.dark">Добави</Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ImageUploader;
