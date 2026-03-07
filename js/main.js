// Controle principal da aplicação
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const status = document.getElementById('status');

pdfInput.onchange = () => processBtn.disabled = !pdfInput.files.length;

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
