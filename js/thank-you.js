// Etiqueta de Agradecimento
const { PDFDocument } = PDFLib;

let selectedIndex = 0;
let customImage = null;
let etiquetas = [];
let currentIndex = 0;

const labelPreview = document.getElementById('labelPreview');
const previewIcon = document.getElementById('previewIcon');
const previewText = document.getElementById('previewText');
const thankYouText = document.getElementById('thankYouText');
const labelControls = document.getElementById('labelControls');
const labelNav = document.getElementById('labelNav');
const labelPrev = document.getElementById('labelPrev');
const labelNext = document.getElementById('labelNext');
const labelPageInfo = document.getElementById('labelPageInfo');

function renderIconSelector() {
    const selector = document.getElementById('iconSelector');
    selector.innerHTML = '';
    
    ICON_DATA.forEach((icon, i) => {
        const label = document.createElement('label');
        label.className = 'icon-option' + (i === 0 ? ' selected' : '');
        label.dataset.index = i;
        label.innerHTML = `<img src="${icon.data}" alt="${icon.name}" width="60"><span>${icon.name}</span>`;
        label.addEventListener('click', () => selectIcon(i, label));
        selector.appendChild(label);
    });
    
    const customLabel = document.createElement('label');
    customLabel.className = 'icon-option';
    customLabel.dataset.index = 'custom';
    customLabel.innerHTML = '<div class="custom-icon-placeholder">+</div><span>Sua Imagem</span>';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleCustomUpload);
    selector.appendChild(fileInput);
    
    customLabel.addEventListener('click', () => fileInput.click());
    selector.appendChild(customLabel);
}

async function selectIcon(index, element) {
    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
    element.classList.add('selected');
    selectedIndex = index;
    customImage = null;
    updatePreview();
}

async function handleCustomUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        const grayscale = await toGrayscale(event.target.result);
        customImage = grayscale;
        selectedIndex = -1;
        document.querySelector('.custom-icon-placeholder').innerHTML = `<img src="${grayscale}" style="width:100%;height:100%;object-fit:contain;">`;
        document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        document.querySelector('[data-index="custom"]').classList.add('selected');
        updatePreview();
    };
    reader.readAsDataURL(file);
}

async function updatePreview() {
    const text = thankYouText.value || '';
    let imgSrc = null;
    
    if (customImage) {
        imgSrc = customImage; // já está em grayscale
    } else if (selectedIndex >= 0 && ICON_DATA[selectedIndex]) {
        imgSrc = await toGrayscale(ICON_DATA[selectedIndex].data);
    }
    
    if (imgSrc) {
        previewIcon.innerHTML = `<img src="${imgSrc}" style="max-width:80px;max-height:60px;">`;
    } else {
        previewIcon.innerHTML = '';
    }
    previewText.innerText = text;
}

thankYouText.addEventListener('input', updatePreview);

// Template buttons
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        thankYouText.value = btn.dataset.text;
        updatePreview();
    });
});

// Salvar etiqueta atual
function saveCurrentLabel() {
    if (etiquetas.length === 0) return;
    etiquetas[currentIndex] = {
        text: thankYouText.value,
        iconIndex: selectedIndex,
        customImage: customImage
    };
}

// Preencher preview
async function fillPreviewWithLabel(etiqueta) {
    thankYouText.value = etiqueta.text || '';
    selectedIndex = etiqueta.iconIndex !== undefined ? etiqueta.iconIndex : -1;
    customImage = etiqueta.customImage || null;
    
    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
    
    let imgSrc = null;
    if (customImage) {
        document.querySelector('[data-index="custom"]').classList.add('selected');
        document.querySelector('.custom-icon-placeholder').innerHTML = `<img src="${customImage}" style="width:100%;height:100%;object-fit:contain;">`;
        imgSrc = customImage;
    } else if (selectedIndex >= 0 && ICON_DATA[selectedIndex]) {
        const opt = document.querySelector(`[data-index="${selectedIndex}"]`);
        if (opt) opt.classList.add('selected');
        imgSrc = await toGrayscale(ICON_DATA[selectedIndex].data);
    }
    
    if (imgSrc) {
        previewIcon.innerHTML = `<img src="${imgSrc}" style="max-width:80px;max-height:60px;">`;
    } else {
        previewIcon.innerHTML = '';
    }
    
    previewText.innerText = etiqueta.text || '';
}

function updateNav() {
    if (etiquetas.length > 0) {
        labelNav.style.display = 'flex';
        labelPageInfo.textContent = `${currentIndex + 1} / ${etiquetas.length}`;
        labelPrev.disabled = currentIndex === 0;
        labelNext.disabled = currentIndex === etiquetas.length - 1;
    } else {
        labelNav.style.display = 'none';
    }
}

labelPrev.onclick = () => {
    if (currentIndex > 0) {
        saveCurrentLabel();
        currentIndex--;
        fillPreviewWithLabel(etiquetas[currentIndex]);
        updateNav();
    }
};

labelNext.onclick = () => {
    if (currentIndex < etiquetas.length - 1) {
        saveCurrentLabel();
        currentIndex++;
        fillPreviewWithLabel(etiquetas[currentIndex]);
        updateNav();
    }
};

// Adicionar nova etiqueta
document.getElementById('addLabel').onclick = () => {
    if (etiquetas.length > 0) {
        saveCurrentLabel();
    }
    
    // Etiqueta em branco (sem ícone, sem texto)
    const newLabel = { text: '', iconIndex: -1, customImage: null };
    etiquetas.push(newLabel);
    currentIndex = etiquetas.length - 1;
    fillPreviewWithLabel(newLabel);
    updateNav();
    
    labelControls.style.display = 'block';
    labelPreview.style.display = 'flex';
};

async function gerarPdfBytes() {
    const originalBorder = labelPreview.style.border;
    labelPreview.style.border = 'none';
    
    const canvas = await html2canvas(labelPreview, { scale: 4, backgroundColor: '#ffffff' });
    
    labelPreview.style.border = originalBorder;
    
    const mmToPt = 2.83465;
    const pdfWidth = 51 * mmToPt;
    const pdfHeight = 25 * mmToPt;
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
    
    const pngData = canvas.toDataURL('image/png');
    const pngBytes = Uint8Array.from(atob(pngData.split(',')[1]), c => c.charCodeAt(0));
    const pdfImage = await pdfDoc.embedPng(pngBytes);
    
    page.drawImage(pdfImage, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });
    
    return await pdfDoc.save();
}

document.getElementById('downloadLabelBtn').onclick = async () => {
    if (etiquetas.length <= 1) {
        const pdfBytes = await gerarPdfBytes();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'etiqueta-agradecimento.pdf';
        link.click();
    } else {
        saveCurrentLabel();
        const savedIndex = currentIndex;
        const pdfDoc = await PDFDocument.create();
        
        for (let i = 0; i < etiquetas.length; i++) {
            fillPreviewWithLabel(etiquetas[i]);
            await new Promise(r => setTimeout(r, 200));
            const pageBytes = await gerarPdfBytes();
            const tempDoc = await PDFDocument.load(pageBytes);
            const [page] = await pdfDoc.copyPages(tempDoc, [0]);
            pdfDoc.addPage(page);
        }
        
        currentIndex = savedIndex;
        fillPreviewWithLabel(etiquetas[currentIndex]);
        updateNav();
        
        const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'etiquetas-agradecimento.pdf';
        link.click();
    }
};

document.getElementById('imprimirBtn').onclick = async () => {
    let pdfBytes;
    
    if (etiquetas.length <= 1) {
        pdfBytes = await gerarPdfBytes();
    } else {
        saveCurrentLabel();
        const savedIndex = currentIndex;
        const pdfDoc = await PDFDocument.create();
        
        for (let i = 0; i < etiquetas.length; i++) {
            fillPreviewWithLabel(etiquetas[i]);
            await new Promise(r => setTimeout(r, 200));
            const pageBytes = await gerarPdfBytes();
            const tempDoc = await PDFDocument.load(pageBytes);
            const [page] = await pdfDoc.copyPages(tempDoc, [0]);
            pdfDoc.addPage(page);
        }
        
        currentIndex = savedIndex;
        fillPreviewWithLabel(etiquetas[currentIndex]);
        updateNav();
        
        pdfBytes = await pdfDoc.save();
    }
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    printWindow.onload = () => printWindow.print();
};

// Modal de Zoom
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalPreviewContainer = document.getElementById('modalPreviewContainer');

labelPreview.style.cursor = 'pointer';
labelPreview.onclick = () => {
    modalPreviewContainer.innerHTML = '';
    const clone = labelPreview.cloneNode(true);
    clone.style.border = '2px dashed #ddd';
    modalPreviewContainer.appendChild(clone);
    modalOverlay.classList.add('active');
};

modalClose.onclick = () => modalOverlay.classList.remove('active');
modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
};

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
    }
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') {
            e.preventDefault();
            document.getElementById('imprimirBtn').click();
        } else if (e.key === 's') {
            e.preventDefault();
            document.getElementById('downloadLabelBtn').click();
        }
    }
});

// Inicialização
renderIconSelector();
