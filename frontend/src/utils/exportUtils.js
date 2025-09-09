
import httpService from '../config/httpService';
import { generateTimestampedFileName, sanitizeFileName } from './commonUtils';

/**
 * Fetches waste records from the backend API and exports them to an Excel file.
 * The entire file generation process is handled by the server.
 * @param {String} fileName - The desired name for the exported file (without extension).
 * @returns {Promise<boolean>} - A promise that resolves to true if the download is initiated successfully, false otherwise.
 */
export const exportToExcel = async (fileName) => {
  console.log('=== exportToExcel function (backend-powered) called ===');

  try {
    const response = await httpService.get('/export/waste-records', {
      responseType: 'blob', // Important: expect a binary response (the file)
    });

    // Create a Blob from the response data
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] 
    });

    // Sanitize and generate the final timestamped filename
    const cleanFileName = sanitizeFileName(fileName);
    const fullFileName = generateTimestampedFileName(cleanFileName, 'xlsx');

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fullFileName;
    
    // Append to the document, click, and then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(link.href);
    
    console.log('Excel file download initiated successfully.');
    return true;

  } catch (error) {
    console.error('Failed to export Excel file from backend:', error);
    // Here you could add user notification, e.g., using a toast message
    // notificationService.showError('导出失败，请稍后重试');
    return false;
  }
};
