// Controle principal da aplicação
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const imprimirBtn = document.getElementById('imprimirBtn');
const status = document.getElementById('status');

// Preview elements
const pdfPreviewCanvas = document.getElementById('pdfPreviewCanvas');
const pdfPreviewPlaceholder = document.getElementById('pdfPreviewPlaceholder');
const pdfPageNav = document.getElementById('pdfPageNav');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const formatRadios = document.querySelectorAll('input[name="format"]');

let previewPdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let srcFileBytes = null;

// Configurar PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function renderPage(pageNum) {
    const page = await previewPdfDoc.getPage(pageNum);
    const canvas = pdfPreviewCanvas;
    const ctx = canvas.getContext('2d');
    
    // Calcular escala para caber no container
    const containerWidth = canvas.parentElement.clientWidth - 40;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(containerWidth / viewport.width, 300 / viewport.height);
    const scaledViewport = page.getViewport({ scale });
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    await page.render({
        canvasContext: ctx,
        viewport: scaledViewport
    }).promise;
    
    pageInfo.textContent = `${pageNum} / ${totalPages}`;
    prevPageBtn.disabled = pageNum <= 1;
    nextPageBtn.disabled = pageNum >= totalPages;
}

async function updatePreview() {
    if (!srcFileBytes) return;
    
    try {
        status.textContent = 'Gerando preview...';
        
        const format = document.querySelector('input[name="format"]:checked').value;
        const srcDoc = await PDFLib.PDFDocument.load(srcFileBytes);
        
        let pdfBytes;
        if (format === 'thermal') {
            pdfBytes = await processThermal(srcDoc);
        } else if (format === 'single') {
            pdfBytes = await processSingle(srcDoc);
        } else {
            pdfBytes = await processA4(srcDoc);
        }
        
        previewPdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        totalPages = previewPdfDoc.numPages;
        currentPage = 1;
        
        pdfPreviewPlaceholder.style.display = 'none';
        pdfPreviewCanvas.style.display = 'block';
        pdfPageNav.style.display = totalPages > 1 ? 'flex' : 'none';
        
        await renderPage(currentPage);
        status.textContent = '';
    } catch (e) {
        status.textContent = 'Erro no preview: ' + e.message;
    }
}

pdfInput.onchange = async () => {
    const hasFile = pdfInput.files.length > 0;
    processBtn.disabled = !hasFile;
    imprimirBtn.disabled = !hasFile;
    
    if (hasFile) {
        srcFileBytes = await pdfInput.files[0].arrayBuffer();
        await updatePreview();
    } else {
        srcFileBytes = null;
        pdfPreviewPlaceholder.style.display = 'flex';
        pdfPreviewCanvas.style.display = 'none';
        pdfPageNav.style.display = 'none';
    }
};

// Atualizar preview quando mudar o formato
formatRadios.forEach(radio => {
    radio.addEventListener('change', updatePreview);
});

prevPageBtn.onclick = async () => {
    if (currentPage > 1) {
        currentPage--;
        await renderPage(currentPage);
    }
};

nextPageBtn.onclick = async () => {
    if (currentPage < totalPages) {
        currentPage++;
        await renderPage(currentPage);
    }
};

processBtn.onclick = async () => {
    try {
        status.textContent = 'Processando...';
        processBtn.disabled = true;

        const format = document.querySelector('input[name="format"]:checked').value;
        const srcDoc = await PDFLib.PDFDocument.load(srcFileBytes);

        let pdfBytes;
        let filename;

        if (format === 'thermal') {
            pdfBytes = await processThermal(srcDoc);
            filename = 'etiqueta_100x150.pdf';
        } else if (format === 'single') {
            pdfBytes = await processSingle(srcDoc);
            filename = 'etiqueta_unica.pdf';
        } else {
            pdfBytes = await processA4(srcDoc);
            filename = 'etiqueta_a4.pdf';
        }

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        status.textContent = 'Pronto! PDF baixado.';
        processBtn.disabled = false;
    } catch (e) {
        status.textContent = 'Erro: ' + e.message;
        processBtn.disabled = false;
    }
};

imprimirBtn.onclick = async () => {
    try {
        status.textContent = 'Processando para impressão...';
        imprimirBtn.disabled = true;

        const format = document.querySelector('input[name="format"]:checked').value;
        const srcDoc = await PDFLib.PDFDocument.load(srcFileBytes);

        let pdfBytes;

        if (format === 'thermal') {
            pdfBytes = await processThermal(srcDoc);
        } else if (format === 'single') {
            pdfBytes = await processSingle(srcDoc);
        } else {
            pdfBytes = await processA4(srcDoc);
        }

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const printWindow = window.open(url, '_blank');
        printWindow.onload = () => {
            printWindow.print();
        };
        
        status.textContent = 'Pronto!';
        imprimirBtn.disabled = false;
    } catch (e) {
        status.textContent = 'Erro: ' + e.message;
        imprimirBtn.disabled = false;
    }
};

// Modal de Zoom
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalCanvas = document.getElementById('modalCanvas');
const modalPrevPage = document.getElementById('modalPrevPage');
const modalNextPage = document.getElementById('modalNextPage');
const modalPageInfo = document.getElementById('modalPageInfo');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const zoomLevel = document.getElementById('zoomLevel');

let modalZoom = 1;

async function renderModalPage() {
    if (!previewPdfDoc) return;
    
    const page = await previewPdfDoc.getPage(currentPage);
    const ctx = modalCanvas.getContext('2d');
    
    const baseScale = 1.5;
    const viewport = page.getViewport({ scale: baseScale * modalZoom });
    
    modalCanvas.width = viewport.width;
    modalCanvas.height = viewport.height;
    
    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
    
    modalPageInfo.textContent = `${currentPage} / ${totalPages}`;
    modalPrevPage.disabled = currentPage <= 1;
    modalNextPage.disabled = currentPage >= totalPages;
    zoomLevel.textContent = `${Math.round(modalZoom * 100)}%`;
}

pdfPreviewCanvas.onclick = () => {
    if (!previewPdfDoc) return;
    modalZoom = 1;
    modalOverlay.classList.add('active');
    renderModalPage();
};

modalClose.onclick = () => {
    modalOverlay.classList.remove('active');
};

modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
};

modalPrevPage.onclick = async () => {
    if (currentPage > 1) {
        currentPage--;
        await renderPage(currentPage);
        await renderModalPage();
    }
};

modalNextPage.onclick = async () => {
    if (currentPage < totalPages) {
        currentPage++;
        await renderPage(currentPage);
        await renderModalPage();
    }
};

zoomIn.onclick = () => {
    if (modalZoom < 3) {
        modalZoom += 0.25;
        renderModalPage();
    }
};

zoomOut.onclick = () => {
    if (modalZoom > 0.5) {
        modalZoom -= 0.25;
        renderModalPage();
    }
};

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
    }
});
