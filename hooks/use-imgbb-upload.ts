import { useState } from 'react';
import axios from 'axios';

// Get ImgBB API key from environment variables
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

interface UseImgBBUploadResult {
  uploadFile: (file: File) => Promise<string>;
  isUploading: boolean;
  error: string | null;
}

export function useImgBBUpload(): UseImgBBUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY || '');
      formData.append('image', file);
      
      // Upload to ImgBB
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data?.data?.url) {
        return response.data.data.url;
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      setError(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
}
