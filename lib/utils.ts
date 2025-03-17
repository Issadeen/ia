import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function exportToCSV(documents: any[], filename: string) {
  // Define the CSV headers
  const headers = [
    'Truck Number',
    'Loaded Date',
    'Product',
    'From (AT20 Depot)',
    'Destination',
    'Created At'
  ];
  
  // Format document data for CSV
  const data = documents.map(doc => [
    doc.truckNumber,
    new Date(doc.loadedDate).toLocaleDateString(),
    doc.product,
    doc.at20Depot,
    doc.destination,
    new Date(doc.createdAt).toLocaleDateString()
  ]);
  
  // Combine headers and data
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
