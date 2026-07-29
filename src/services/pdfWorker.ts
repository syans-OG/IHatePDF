import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker for reliable cross-browser execution without Vite worker bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;

export { pdfjsLib };
