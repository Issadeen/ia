import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Get ImgBB API key from environment variables
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export async function uploadFile(file: File): Promise<string> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    const base64Data = base64.split(',')[1];
    
    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY || '');
    formData.append('image', base64Data);
    
    // Upload to ImgBB
    const response = await axios.post('https://api.imgbb.com/1/upload', formData);
    
    if (response.data?.data?.url) {
      return response.data.data.url;
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Helper function to convert File to base64 string
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export async function uploadFileToFirestore(file: File, userId: string, type: 'gatePass' | 'tr812'): Promise<string> {
  // Only allow files smaller than 1MB (Firestore limit for document size is 1MB)
  if (file.size > 1024 * 1024) {
    throw new Error('File is too large. Please upload a file smaller than 1MB');
  }
  
  try {
    // Convert to base64
    const base64 = await fileToBase64(file);
    
    // Generate a unique ID for the file
    const fileId = `${Date.now()}-${file.name.replace(/[^\w\s.-]/gi, '')}`;
    
    // Store in a separate collection for files
    const fileRef = doc(db, 'files', `${userId}_${type}_${fileId}`);
    await setDoc(fileRef, {
      userId,
      type,
      fileName: file.name,
      fileType: file.type,
      base64,
      createdAt: new Date().toISOString()
    });
    
    // Return a reference ID that can be used to fetch the file
    return fileRef.id;
  } catch (error) {
    console.error('Error storing file:', error);
    throw error;
  }
}
