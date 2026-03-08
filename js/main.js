// Controle principal da aplicação
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const imprimirBtn = document.getElementById('imprimirBtn');
const status = document.getElementById('status');

let lastPdfBytes = null;
let lastFilename = null;

pdfInput.onchange = () => {
    const hasFile = pdfInput.files.length > 0;
    processBtn.disabled = !hasFile;
    imprimirBtn.disabled = !hasFile;
};

processBtn.onclick = async () => {
    try {
        status.textContent = 'Processando...';
        processBtn.disabled = true;

        const format = document.querySelector('input[name="format"]:checked').value;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const srcDoc = await PDFLib.PDFDocument.load(fileBytes);

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

        lastPdfBytes = pdfBytes;
        lastFilename = filename;

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
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const srcDoc = await PDFLib.PDFDocument.load(fileBytes);

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
