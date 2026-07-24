/**
 * Browser-side text extraction.
 * Dispatches to pdfjs-dist (PDF) or mammoth (DOCX) based on file extension.
 * Returns the raw document text ready to be sent to the server function.
 */

export async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractPdf(file);
  } else if (name.endsWith(".docx")) {
    return extractDocx(file);
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }
  throw new Error(`Unsupported file type: ${file.name}. Please upload a PDF or DOCX.`);
}

async function extractPdf(file: File): Promise<string> {
  // Dynamically import pdfjs-dist so it stays out of the main bundle when not needed.
  const pdfjsLib = await import("pdfjs-dist");

  // The worker must be loaded from the same version as the lib.
  // Vite will bundle the worker as a separate chunk.
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).href;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}
