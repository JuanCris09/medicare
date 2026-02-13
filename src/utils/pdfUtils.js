import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js - aligning with the version installed or a stable CDN version
// relying on the version from the package to avoid mismatches
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Renders the first page of a PDF file to a data URL (image).
 * @param {File|string|Blob} fileOrUrl - The PDF file, Blob, or URL.
 * @param {number} scale - The scale factor for rendering (default 1.5 for preview, higher for OCR).
 * @returns {Promise<string>} - A promise that resolves to the data URL of the rendered image.
 */
export const pdfToImage = async (fileOrUrl, scale = 1.5) => {
    try {
        let pdfData;

        if (fileOrUrl instanceof Blob || fileOrUrl instanceof File) {
            const arrayBuffer = await fileOrUrl.arrayBuffer();
            pdfData = arrayBuffer;
        } else {
            // Assume it's a URL
            pdfData = fileOrUrl;
        }

        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        const page = await pdf.getPage(1); // Render first page only

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error("Error rendering PDF:", error);
        throw new Error("Failed to render PDF preview.");
    }
};
