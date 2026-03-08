// Etiqueta de Agradecimento - PDF 50mm x 25mm
const { PDFDocument, rgb } = PDFLib;

let selectedIndex = 0;
let customImage = null;

function renderIconSelector() {
    const selector = document.getElementById('iconSelector');
    selector.innerHTML = '';
    
    ICON_DATA.forEach((icon, i) => {
        const label = document.createElement('label');
        label.className = 'icon-option' + (i === 0 ? ' selected' : '');
        label.dataset.index = i;
        label.innerHTML = '<img src="' + icon.data + '" alt="' + icon.name + '" width="60"><span>' + icon.name + '</span>';
        label.addEventListener('click', () => selectIcon(i, label));
        selector.appendChild(label);
    });
    
    const customLabel = document.createElement('label');
    customLabel.className = 'icon-option';
    customLabel.dataset.index = 'custom';
    customLabel.innerHTML = '<div class="custom-icon-placeholder">+</div><span>Sua Imagem</span>';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'customIconInput';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleCustomUpload);
    selector.appendChild(fileInput);
    
    customLabel.addEventListener('click', () => fileInput.click());
    selector.appendChild(customLabel);
    updatePreview();
}

function selectIcon(index, element) {
    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
    element.classList.add('selected');
    selectedIndex = index;
    customImage = null;
    updatePreview();
}

function handleCustomUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        customImage = event.target.result;
        selectedIndex = -1;
        document.querySelector('.custom-icon-placeholder').innerHTML = '<img src="' + customImage + '" style="width:100%;height:100%;object-fit:contain;">';
        document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        document.querySelector('[data-index="custom"]').classList.add('selected');
        updatePreview();
    };
    reader.readAsDataURL(file);
}

document.getElementById('thankYouText').addEventListener('input', updatePreview);

function updatePreview() {
    const text = document.getElementById('thankYouText').value || 'Obrigado!';
    const imgSrc = customImage || (selectedIndex >= 0 ? ICON_DATA[selectedIndex].data : null);
    if (imgSrc) document.getElementById('previewIcon').innerHTML = '<img src="' + imgSrc + '" style="max-width:80px;max-height:60px;">';
    document.getElementById('previewText').textContent = text;
}

document.getElementById('downloadLabelBtn').addEventListener('click', async () => {
    const label = document.getElementById('labelPreview');
    
    // Remover borda temporariamente
    const originalBorder = label.style.border;
    label.style.border = 'none';
    
    // Capturar preview como imagem usando html2canvas
    const canvas = await html2canvas(label, { scale: 4, backgroundColor: '#ffffff' });
    
    // Restaurar borda
    label.style.border = originalBorder;
    
    // PDF 51mm x 25mm (paisagem) - tamanho real da etiqueta
    const mmToPt = 2.83465;
    const pdfWidth = 51 * mmToPt;
    const pdfHeight = 25 * mmToPt;
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
    
    const pngData = canvas.toDataURL('image/png');
    const pngBytes = Uint8Array.from(atob(pngData.split(',')[1]), c => c.charCodeAt(0));
    const pdfImage = await pdfDoc.embedPng(pngBytes);
    
    page.drawImage(pdfImage, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });
    
    const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'etiqueta-agradecimento.pdf';
    link.click();
});

document.getElementById('imprimirBtn').addEventListener('click', () => {
    const label = document.getElementById('labelPreview');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Etiqueta</title>
            <style>
                @page {
                    size: 51mm 25mm;
                    margin: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    width: 51mm;
                    height: 25mm;
                }
                .thank-you-label {
                    background: white;
                    width: 51mm;
                    height: 25mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .label-icon {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-top: 2mm;
                }
                .label-icon img {
                    max-width: 15mm;
                    max-height: 12mm;
                    object-fit: contain;
                }
                .label-text {
                    font-family: Arial, sans-serif;
                    font-size: 8pt;
                    font-weight: 600;
                    color: #333;
                    padding: 1mm;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            ${label.outerHTML}
            <script>
                window.onload = () => {
                    window.print();
                    window.close();
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
});

renderIconSelector();
