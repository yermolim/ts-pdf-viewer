import { TsPdfViewer } from "./ts-pdf-viewer";

async function run(): Promise<void> {  
  const viewer = new TsPdfViewer("#pdf-main-container", "assets/pdf.worker.min.js");
  await viewer.openPdfAsync("demo2.pdf");
} 

run();
