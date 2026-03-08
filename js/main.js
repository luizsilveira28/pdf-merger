// Controle principal da aplicação
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const imprimirBtn = document.getElementById('imprimirBtn');
const status = document.getElementById('status');

// Lista de PDFs
const pdfList = document.getElementById('pdfList');
const pdfItems = document.getElementById('pdfItems');
const pdfCount = document.getElementById('pdfCount');
const clearAll = document.getElementById('clearAll');

// Preview elements
const pdfPreviewCanvas = document.getElementById('pdfPreviewCanvas');
const pdfPreviewPlaceholder = document.getElementById('pdfPreviewPlaceholder');
const pdfPageNav = document.getElementById('pdfPageNav');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const previewFileName = document.getElementById('previewFileName');
const formatRadios = document.querySelectorAll('input[name="format"]');

let previewPdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let pdfFiles = []; // Array de arquivos PDF
let pageToFileMap = []; // Mapeia página do preview para arquivo original

// Configurar PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function updatePdfList() {
    pdfItems.innerHTML = '';
    pdfFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span title="${file.name}">📄 ${file.name}</span>
            <button type="button" data-index="${index}">✕</button>
        `;
        pdfItems.appendChild(li);
    });
    
    const count = pdfFiles.length;
    pdfCount.textContent = `${count} arquivo${count !== 1 ? 's' : ''}`;
    pdfList.style.display = count > 0 ? 'block' : 'none';
    
    const hasFiles = count > 0;
    processBtn.disabled = !hasFiles;
    imprimirBtn.disabled = !hasFiles;
}

// Remover PDF individual
pdfItems.addEventListener('click', async (e) => {
    if (e.target.tagName === 'BUTTON') {
        const index = parseInt(e.target.dataset.index);
        pdfFiles.splice(index, 1);
        updatePdfList();
        await updatePreview();
    }
});

// Limpar todos
clearAll.onclick = async () => {
    pdfFiles = [];
    pageToFileMap = [];
    pdfInput.value = '';
    updatePdfList();
    pdfPreviewPlaceholder.style.display = 'flex';
    pdfPreviewCanvas.style.display = 'none';
    pdfPageNav.style.display = 'none';
    previewFileName.textContent = '';
};

async function renderPage(pageNum) {
    const page = await previewPdfDoc.getPage(pageNum);
    const canvas = pdfPreviewCanvas;
    const ctx = canvas.getContext('2d');
    
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
    
    // Mostrar nome do arquivo
    if (pageToFileMap[pageNum - 1]) {
        previewFileName.textContent = pageToFileMap[pageNum - 1];
    }
}

async function mergeAndProcess(format) {
    // Criar documento combinado e mapear páginas
    const mergedDoc = await PDFLib.PDFDocument.create();
    pageToFileMap = [];
    
    let totalPairs = 0;
    const filePairCounts = []; // Quantos pares cada arquivo tem
    
    for (const file of pdfFiles) {
        const fileBytes = await file.arrayBuffer();
        const srcDoc = await PDFLib.PDFDocument.load(fileBytes);
        const srcPageCount = srcDoc.getPageCount();
        const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(page => mergedDoc.addPage(page));
        
        const pairsInFile = Math.floor(srcPageCount / 2);
        filePairCounts.push({ name: file.name, pairs: pairsInFile });
        totalPairs += pairsInFile;
    }
    
    // Mapear páginas de saída para arquivos
    if (format === 'thermal') {
        // 2 páginas de saída por par
        for (const file of filePairCounts) {
            for (let p = 0; p < file.pairs * 2; p++) {
                pageToFileMap.push(file.name);
            }
        }
    } else if (format === 'single') {
        // 1 página de saída por par
        for (const file of filePairCounts) {
            for (let p = 0; p < file.pairs; p++) {
                pageToFileMap.push(file.name);
            }
        }
    } else {
        // A4: 4 etiquetas por página, então ceil(totalPairs/4) páginas
        // Cada página mostra até 4 arquivos
        let pairIndex = 0;
        for (const file of filePairCounts) {
            for (let p = 0; p < file.pairs; p++) {
                const outputPage = Math.floor(pairIndex / 4);
                if (!pageToFileMap[outputPage]) {
                    pageToFileMap[outputPage] = file.name;
                } else if (!pageToFileMap[outputPage].includes(file.name)) {
                    pageToFileMap[outputPage] += ', ' + file.name;
                }
                pairIndex++;
            }
        }
    }
    
    // Processar no formato escolhido
    if (format === 'thermal') {
        return await processThermal(mergedDoc);
    } else if (format === 'single') {
        return await processSingle(mergedDoc);
    } else {
        return await processA4(mergedDoc);
    }
}

async function updatePreview() {
    if (pdfFiles.length === 0) {
        pdfPreviewPlaceholder.style.display = 'flex';
        pdfPreviewCanvas.style.display = 'none';
        pdfPageNav.style.display = 'none';
        return;
    }
    
    try {
        status.textContent = 'Gerando preview...';
        
        const format = document.querySelector('input[name="format"]:checked').value;
        const pdfBytes = await mergeAndProcess(format);
        
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
        console.error(e);
    }
}

pdfInput.onchange = async () => {
    if (pdfInput.files.length > 0) {
        // Adicionar novos arquivos à lista
        for (const file of pdfInput.files) {
            pdfFiles.push(file);
        }
        updatePdfList();
        await updatePreview();
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
        const pdfBytes = await mergeAndProcess(format);

        let filename;
        if (format === 'thermal') {
            filename = 'etiquetas_100x150.pdf';
        } else if (format === 'single') {
            filename = 'etiquetas_unica.pdf';
        } else {
            filename = 'etiquetas_a4.pdf';
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
        const pdfBytes = await mergeAndProcess(format);

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