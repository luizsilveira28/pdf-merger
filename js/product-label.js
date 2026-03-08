const imgInput = document.getElementById('imgInput');
const nomeProduto = document.getElementById('nomeProduto');
const refProduto = document.getElementById('refProduto');
const corProduto = document.getElementById('corProduto');
const tamanhoProduto = document.getElementById('tamanhoProduto');
const codigoBarras = document.getElementById('codigoBarras');
const precoProduto = document.getElementById('precoProduto');
const mostrarPreco = document.getElementById('mostrarPreco');
const qrcodeContent = document.getElementById('qrcodeContent');
const precoContainer = document.getElementById('precoContainer');
const barcodeContainer = document.getElementById('barcodeContainer');
const qrcodeContainer = document.getElementById('qrcodeContainer');
const codigoTipoRadios = document.querySelectorAll('input[name="codigoTipo"]');
const gerarBtn = document.getElementById('gerarBtn');
const statusEl = document.getElementById('status');

const previewImg = document.getElementById('previewImg');
const imgContainer = document.getElementById('imgContainer');
const previewNome = document.getElementById('previewNome');
const previewTamanho = document.getElementById('previewTamanho');
const previewCor = document.getElementById('previewCor');
const previewRef = document.getElementById('previewRef');
const previewBarcode = document.getElementById('previewBarcode');
const previewQrcode = document.getElementById('previewQrcode');
const previewPreco = document.getElementById('previewPreco');

const imgOptions = document.querySelectorAll('.img-option');
const imgMocassim = document.getElementById('imgMocassim');
const imgAlpargata = document.getElementById('imgAlpargata');

let imagemBase64 = null;
let imagemGrayscale = null;
let tipoImagem = 'custom';

// Carregar ícones predefinidos
const iconMap = {};
PRODUCT_ICONS.forEach(icon => {
    iconMap[icon.name.toLowerCase()] = icon.data;
});
if (iconMap.mocassim) imgMocassim.src = iconMap.mocassim;
if (iconMap.alpargata) imgAlpargata.src = iconMap.alpargata;

// Carregar preferências do localStorage
function loadPreferences() {
    const prefs = JSON.parse(localStorage.getItem('productLabelPrefs') || '{}');
    // Preço default: não mostrar
    mostrarPreco.checked = prefs.mostrarPreco === true ? true : false;
    if (prefs.codigoTipo) {
        const radio = document.querySelector(`input[name="codigoTipo"][value="${prefs.codigoTipo}"]`);
        if (radio) radio.checked = true;
    }
    updateVisibility();
}

function savePreferences() {
    localStorage.setItem('productLabelPrefs', JSON.stringify({
        mostrarPreco: mostrarPreco.checked,
        codigoTipo: getCodigoTipo()
    }));
}

function getCodigoTipo() {
    return document.querySelector('input[name="codigoTipo"]:checked').value;
}

function updateVisibility() {
    const tipo = getCodigoTipo();
    precoContainer.style.display = mostrarPreco.checked ? 'block' : 'none';
    previewPreco.style.display = mostrarPreco.checked ? 'block' : 'none';
    barcodeContainer.style.display = tipo === 'barcode' ? 'block' : 'none';
    previewBarcode.style.display = tipo === 'barcode' ? 'block' : 'none';
    qrcodeContainer.style.display = tipo === 'qrcode' ? 'block' : 'none';
    previewQrcode.style.display = tipo === 'qrcode' ? 'block' : 'none';
    
    if (tipo === 'barcode') updateBarcode();
    if (tipo === 'qrcode') updateQrcode();
    
    savePreferences();
}

// Seleção de tipo de imagem
imgOptions.forEach(opt => {
    opt.addEventListener('click', async () => {
        const tipo = opt.dataset.type;
        if (tipo === 'custom') {
            imgInput.click();
        } else {
            imgOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            tipoImagem = tipo;
            imagemBase64 = iconMap[tipoImagem];
            imagemGrayscale = await toGrayscale(imagemBase64);
            previewImg.src = imagemGrayscale;
            imgContainer.style.display = 'flex';
        }
    });
});

imgInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            imagemBase64 = ev.target.result;
            imagemGrayscale = await toGrayscale(imagemBase64);
            previewImg.src = imagemGrayscale;
            imgContainer.style.display = 'flex';
            imgOptions.forEach(o => o.classList.remove('selected'));
            document.querySelector('[data-type="custom"]').classList.add('selected');
            tipoImagem = 'custom';
        };
        reader.readAsDataURL(file);
    }
};

mostrarPreco.onchange = updateVisibility;
codigoTipoRadios.forEach(radio => {
    radio.onchange = updateVisibility;
});

nomeProduto.oninput = updateNomeCor;
corProduto.oninput = updateNomeCor;

function updateNomeCor() {
    const nome = nomeProduto.value.trim();
    const cor = corProduto.value.trim();
    previewNome.textContent = nome;
    previewCor.textContent = (nome && cor) ? ` - ${cor}` : cor;
}

refProduto.oninput = () => {
    const ref = refProduto.value.trim();
    previewRef.textContent = ref ? `Ref: ${ref}` : '';
};
tamanhoProduto.oninput = () => previewTamanho.textContent = tamanhoProduto.value;

function updateBarcode() {
    if (getCodigoTipo() !== 'barcode') {
        previewBarcode.style.display = 'none';
        return;
    }
    const codigo = codigoBarras.value.trim();
    if (!codigo) {
        previewBarcode.style.display = 'none';
        return;
    }
    previewBarcode.style.display = 'block';
    try {
        JsBarcode(previewBarcode, codigo, {
            format: 'EAN13', width: 2, height: 35, displayValue: true, fontSize: 12, margin: 0
        });
    } catch {
        JsBarcode(previewBarcode, codigo, {
            format: 'CODE128', width: 1.5, height: 35, displayValue: true, fontSize: 12, margin: 0
        });
    }
}

let qrCodeInstance = null;

async function updateQrcode() {
    if (getCodigoTipo() !== 'qrcode') {
        previewQrcode.innerHTML = '';
        previewQrcode.style.display = 'none';
        qrCodeInstance = null;
        return;
    }
    const content = qrcodeContent.value.trim();
    if (!content) {
        previewQrcode.innerHTML = '';
        previewQrcode.style.display = 'none';
        qrCodeInstance = null;
        return;
    }
    previewQrcode.style.display = 'block';
    try {
        previewQrcode.innerHTML = '';
        qrCodeInstance = new QRCode(previewQrcode, {
            text: content,
            width: 65,
            height: 65,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.L
        });
    } catch (e) {
        console.error('QRCode error:', e);
        previewQrcode.innerHTML = '';
    }
}

codigoBarras.oninput = updateBarcode;
qrcodeContent.oninput = updateQrcode;
precoProduto.oninput = () => previewPreco.textContent = `R$ ${precoProduto.value || '0,00'}`;

async function gerarPdfBytes() {
    const preview = document.getElementById('preview');
    
    // Remover borda temporariamente
    const originalBorder = preview.style.border;
    preview.style.border = 'none';
    
    // Capturar preview como imagem
    const canvas = await html2canvas(preview, { scale: 4, backgroundColor: '#ffffff' });
    
    // Restaurar borda
    preview.style.border = originalBorder;
    
    // PDF 51mm x 25mm
    const mmToPt = 2.83465;
    const pdfWidth = 51 * mmToPt;
    const pdfHeight = 25 * mmToPt;
    
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
    
    const pngData = canvas.toDataURL('image/png');
    const pngBytes = Uint8Array.from(atob(pngData.split(',')[1]), c => c.charCodeAt(0));
    const pdfImage = await pdfDoc.embedPng(pngBytes);
    
    // Margem de 2pt para não cortar bordas
    const margin = 2;
    page.drawImage(pdfImage, { 
        x: margin, 
        y: margin, 
        width: pdfWidth - (margin * 2), 
        height: pdfHeight - (margin * 2) 
    });

    return await pdfDoc.save();
}

// Imprimir
const imprimirBtn = document.getElementById('imprimirBtn');
imprimirBtn.onclick = async () => {
    try {
        showStatus(statusEl, 'Preparando impressão...', 'info');
        imprimirBtn.disabled = true;

        let pdfBytes;
        
        if (csvProdutos.length > 0) {
            // Imprimir todos do CSV
            saveCurrentProduct();
            const pdfDoc = await PDFLib.PDFDocument.create();
            const savedIndex = currentCsvIndex;

            for (let i = 0; i < csvProdutos.length; i++) {
                showStatus(statusEl, `Preparando ${i + 1}/${csvProdutos.length}...`, 'info');
                fillPreviewWithProduct(csvProdutos[i]);
                await new Promise(r => setTimeout(r, 300));
                const pageBytes = await gerarPdfBytes();
                const tempDoc = await PDFLib.PDFDocument.load(pageBytes);
                const [page] = await pdfDoc.copyPages(tempDoc, [0]);
                pdfDoc.addPage(page);
            }

            // Restaurar produto atual
            fillPreviewWithProduct(csvProdutos[savedIndex]);
            currentCsvIndex = savedIndex;
            updateCsvNav();

            pdfBytes = await pdfDoc.save();
        } else {
            pdfBytes = await gerarPdfBytes();
        }

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.onload = () => printWindow.print();
            showStatus(statusEl, 'Janela de impressão aberta', 'success');
        } else {
            showStatus(statusEl, 'Popup bloqueado. Permita popups para imprimir.', 'error');
        }
        
        imprimirBtn.disabled = false;
    } catch (e) {
        showStatus(statusEl, 'Erro ao preparar impressão: ' + e.message, 'error');
        imprimirBtn.disabled = false;
        console.error(e);
    }
};

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
    }
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') {
            e.preventDefault();
            imprimirBtn.click();
        } else if (e.key === 's') {
            e.preventDefault();
            gerarBtn.click();
        }
    }
});

// Modal de Zoom
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalPreviewContainer = document.getElementById('modalPreviewContainer');
const preview = document.getElementById('preview');

preview.style.cursor = 'pointer';
preview.onclick = () => {
    modalPreviewContainer.innerHTML = '';
    const clone = preview.cloneNode(true);
    clone.style.border = '2px dashed #ddd';
    modalPreviewContainer.appendChild(clone);
    modalOverlay.classList.add('active');
};

modalClose.onclick = () => modalOverlay.classList.remove('active');
modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
};

// Inicialização
loadPreferences();
if (getCodigoTipo() === 'barcode') updateBarcode();
if (getCodigoTipo() === 'qrcode') updateQrcode();

// CSV Import
const csvInput = document.getElementById('csvInput');
const importCsvBtn = document.getElementById('importCsv');
const downloadTemplateBtn = document.getElementById('downloadTemplate');
const csvInfo = document.getElementById('csvInfo');
const csvCount = document.getElementById('csvCount');
const clearCsvBtn = document.getElementById('clearCsv');

console.log('CSV elements:', { csvInput, importCsvBtn, downloadTemplateBtn, csvInfo, csvCount, clearCsvBtn });

let csvProdutos = [];
let currentCsvIndex = 0;

const csvNav = document.getElementById('csvNav');
const csvPrev = document.getElementById('csvPrev');
const csvNext = document.getElementById('csvNext');
const csvPageInfo = document.getElementById('csvPageInfo');

downloadTemplateBtn.onclick = () => {
    const csv = 'nome,referencia,cor,tamanho,codigo_barras,qrcode,preco\nMocassim Classic,REF-001,Marrom,42,7891234567890,,189.90\nAlpargata Comfort,REF-002,Azul,38,,https://loja.com/produto,129.90';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-etiquetas.csv';
    a.click();
    URL.revokeObjectURL(url);
};

importCsvBtn.onclick = () => {
    console.log('Import button clicked');
    csvInput.click();
};

csvInput.onchange = () => {
    console.log('CSV input changed', csvInput.files);
    if (csvInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                console.log('File content:', e.target.result);
                
                // Usar parser robusto do global.js
                const { data: newProducts } = parseCSV(e.target.result);
                
                // Filtrar produtos válidos (pelo menos nome ou código)
                const validProducts = newProducts.filter(p => 
                    p.nome || p.codigo_barras || p.qrcode
                );
                
                if (validProducts.length === 0) {
                    throw new Error('Nenhum produto válido encontrado no CSV');
                }
                
                // Salvar etiqueta atual se tiver conteúdo
                if (csvProdutos.length > 0) {
                    saveCurrentProduct();
                } else if (nomeProduto.value || codigoBarras.value || qrcodeContent.value) {
                    // Salvar etiqueta manual atual
                    csvProdutos.push({
                        nome: nomeProduto.value,
                        referencia: refProduto.value,
                        cor: corProduto.value,
                        tamanho: tamanhoProduto.value,
                        codigo_barras: getCodigoTipo() === 'barcode' ? codigoBarras.value : '',
                        qrcode: getCodigoTipo() === 'qrcode' ? qrcodeContent.value : '',
                        preco: mostrarPreco.checked ? precoProduto.value : ''
                    });
                }
                
                // Adicionar novos produtos
                csvProdutos = csvProdutos.concat(validProducts);
                
                console.log('Produtos:', csvProdutos);
                csvCount.textContent = `${csvProdutos.length} produtos`;
                csvInfo.style.display = csvProdutos.length > 0 ? 'flex' : 'none';
                showStatus(statusEl, `${validProducts.length} produtos importados (total: ${csvProdutos.length})`, 'success');
                
                // Mostrar primeiro produto adicionado
                if (validProducts.length > 0) {
                    currentCsvIndex = csvProdutos.length - validProducts.length;
                    fillPreviewWithProduct(csvProdutos[currentCsvIndex]);
                    updateCsvNav();
                    preview.style.display = 'flex';
                    setInputsEnabled(true);
                }
            } catch (err) {
                console.error('Erro CSV:', err);
                showStatus(statusEl, 'Erro ao ler CSV: ' + err.message, 'error');
            }
        };
        reader.onerror = () => {
            showStatus(statusEl, 'Erro ao ler arquivo CSV', 'error');
        };
        reader.readAsText(csvInput.files[0]);
    }
};

clearCsvBtn.onclick = () => {
    csvProdutos = [];
    currentCsvIndex = 0;
    csvInput.value = '';
    csvInfo.style.display = 'none';
    csvNav.style.display = 'none';
    statusEl.textContent = '';
    preview.style.display = 'none';
    setInputsEnabled(false);
    // Limpar campos
    nomeProduto.value = '';
    refProduto.value = '';
    corProduto.value = '';
    tamanhoProduto.value = '';
    codigoBarras.value = '';
    qrcodeContent.value = '';
    precoProduto.value = '';
};

// Navegação CSV
function updateCsvNav() {
    if (csvProdutos.length > 0) {
        csvNav.style.display = 'flex';
        csvPageInfo.textContent = `${currentCsvIndex + 1} / ${csvProdutos.length}`;
        csvPrev.disabled = currentCsvIndex === 0;
        csvNext.disabled = currentCsvIndex === csvProdutos.length - 1;
    } else {
        csvNav.style.display = 'none';
    }
}

// Salvar edições do produto atual no array
function saveCurrentProduct() {
    if (csvProdutos.length === 0) return;
    csvProdutos[currentCsvIndex] = {
        nome: nomeProduto.value,
        referencia: refProduto.value,
        cor: corProduto.value,
        tamanho: tamanhoProduto.value,
        codigo_barras: getCodigoTipo() === 'barcode' ? codigoBarras.value : '',
        qrcode: getCodigoTipo() === 'qrcode' ? qrcodeContent.value : '',
        preco: mostrarPreco.checked ? precoProduto.value : '',
        imagem: imagemGrayscale,
        tipoImagem: tipoImagem
    };
}

csvPrev.onclick = () => {
    if (currentCsvIndex > 0) {
        saveCurrentProduct();
        currentCsvIndex--;
        fillPreviewWithProduct(csvProdutos[currentCsvIndex]);
        updateCsvNav();
    }
};

csvNext.onclick = () => {
    if (currentCsvIndex < csvProdutos.length - 1) {
        saveCurrentProduct();
        currentCsvIndex++;
        fillPreviewWithProduct(csvProdutos[currentCsvIndex]);
        updateCsvNav();
    }
};

// Adicionar nova etiqueta
const addLabelBtn = document.getElementById('addLabel');
addLabelBtn.onclick = () => {
    // Salvar etiqueta atual se existir
    if (csvProdutos.length > 0) {
        saveCurrentProduct();
    }
    
    // Criar nova etiqueta em branco
    const newProduct = { nome: '', referencia: '', cor: '', tamanho: '', codigo_barras: '', qrcode: '', preco: '' };
    csvProdutos.push(newProduct);
    currentCsvIndex = csvProdutos.length - 1;
    fillPreviewWithProduct(newProduct);
    updateCsvNav();
    csvInfo.style.display = 'flex';
    csvCount.textContent = `${csvProdutos.length} produtos`;
    
    // Mostrar preview
    preview.style.display = 'flex';
    setInputsEnabled(true);
};

// Desabilitar inputs até adicionar etiqueta
function setInputsEnabled(enabled) {
    const labelControls = document.getElementById('labelControls');
    labelControls.style.display = enabled ? 'block' : 'none';
}

// Iniciar com inputs escondidos
setInputsEnabled(false);

// Função para preencher preview com dados do produto
function fillPreviewWithProduct(produto) {
    console.log('Filling preview with:', produto);
    
    // Preencher inputs
    nomeProduto.value = produto.nome || '';
    refProduto.value = produto.referencia || '';
    corProduto.value = produto.cor || '';
    tamanhoProduto.value = produto.tamanho || '';
    
    // Atualizar preview diretamente
    previewNome.textContent = produto.nome || '';
    previewCor.textContent = (produto.nome && produto.cor) ? ` - ${produto.cor}` : (produto.cor || '');
    previewRef.textContent = produto.referencia ? `Ref: ${produto.referencia}` : '';
    previewTamanho.textContent = produto.tamanho || '';
    
    // Imagem
    if (produto.imagem) {
        imagemGrayscale = produto.imagem;
        tipoImagem = produto.tipoImagem || 'custom';
        previewImg.src = imagemGrayscale;
        imgContainer.style.display = 'flex';
        imgOptions.forEach(o => o.classList.remove('selected'));
        document.querySelector(`[data-type="${tipoImagem}"]`).classList.add('selected');
    } else {
        imagemGrayscale = null;
        tipoImagem = 'custom';
        imgContainer.style.display = 'none';
        imgOptions.forEach(o => o.classList.remove('selected'));
        document.querySelector('[data-type="custom"]').classList.add('selected');
    }
    
    // Código de barras ou QR code
    if (produto.codigo_barras) {
        document.querySelector('input[name="codigoTipo"][value="barcode"]').checked = true;
        codigoBarras.value = produto.codigo_barras;
        barcodeContainer.style.display = 'block';
        qrcodeContainer.style.display = 'none';
        previewBarcode.style.display = 'block';
        previewQrcode.style.display = 'none';
        previewQrcode.innerHTML = '';
        try {
            JsBarcode(previewBarcode, produto.codigo_barras, {
                format: 'EAN13', width: 2, height: 35, displayValue: true, fontSize: 12, margin: 0
            });
        } catch {
            JsBarcode(previewBarcode, produto.codigo_barras, {
                format: 'CODE128', width: 1.5, height: 35, displayValue: true, fontSize: 12, margin: 0
            });
        }
    } else if (produto.qrcode) {
        document.querySelector('input[name="codigoTipo"][value="qrcode"]').checked = true;
        qrcodeContent.value = produto.qrcode;
        barcodeContainer.style.display = 'none';
        qrcodeContainer.style.display = 'block';
        previewBarcode.style.display = 'none';
        previewQrcode.style.display = 'block';
        previewQrcode.innerHTML = '';
        new QRCode(previewQrcode, {
            text: produto.qrcode,
            width: 65,
            height: 65,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.L
        });
    } else {
        document.querySelector('input[name="codigoTipo"][value="none"]').checked = true;
        codigoBarras.value = '';
        qrcodeContent.value = '';
        barcodeContainer.style.display = 'none';
        qrcodeContainer.style.display = 'none';
        previewBarcode.style.display = 'none';
        previewQrcode.style.display = 'none';
        previewQrcode.innerHTML = '';
    }
    
    // Preço
    if (produto.preco) {
        mostrarPreco.checked = true;
        precoProduto.value = produto.preco;
        previewPreco.textContent = `R$ ${produto.preco}`;
        previewPreco.style.display = 'block';
        precoContainer.style.display = 'block';
    } else {
        mostrarPreco.checked = false;
        precoProduto.value = '';
        previewPreco.style.display = 'none';
        precoContainer.style.display = 'none';
    }
}

// Gerar PDF (único ou lote)
gerarBtn.onclick = async () => {
    if (csvProdutos.length === 0) {
        // Gerar etiqueta única
        try {
            showStatus(statusEl, 'Gerando PDF...', 'info');
            gerarBtn.disabled = true;

            const pdfBytes = await gerarPdfBytes();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'etiqueta-produto.pdf';
            a.click();

            URL.revokeObjectURL(url);
            showStatus(statusEl, 'PDF gerado com sucesso!', 'success');
            gerarBtn.disabled = false;
        } catch (e) {
            showStatus(statusEl, 'Erro ao gerar PDF: ' + e.message, 'error');
            gerarBtn.disabled = false;
        }
    } else {
        // Gerar lote
        try {
            showStatus(statusEl, 'Gerando PDF em lote...', 'info');
            gerarBtn.disabled = true;

            const pdfDoc = await PDFLib.PDFDocument.create();

            // Salvar produto atual antes de iterar
            saveCurrentProduct();
            const savedIndex = currentCsvIndex;

            for (let i = 0; i < csvProdutos.length; i++) {
                showStatus(statusEl, `Gerando ${i + 1}/${csvProdutos.length}...`, 'info');
                
                fillPreviewWithProduct(csvProdutos[i]);
                
                // Aguardar renderização (mais tempo para QR code)
                await new Promise(r => setTimeout(r, 300));
                
                const pdfBytes = await gerarPdfBytes();
                const tempDoc = await PDFLib.PDFDocument.load(pdfBytes);
                const [page] = await pdfDoc.copyPages(tempDoc, [0]);
                pdfDoc.addPage(page);
            }

            // Restaurar etiqueta atual
            currentCsvIndex = savedIndex;
            fillPreviewWithProduct(csvProdutos[currentCsvIndex]);
            updateCsvNav();

            const finalPdfBytes = await pdfDoc.save();
            const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'etiquetas-lote.pdf';
            a.click();

            URL.revokeObjectURL(url);
            showStatus(statusEl, `PDF gerado com ${csvProdutos.length} etiquetas!`, 'success');
            gerarBtn.disabled = false;
        } catch (e) {
            showStatus(statusEl, 'Erro ao gerar lote: ' + e.message, 'error');
            gerarBtn.disabled = false;
            console.error(e);
        }
    }
};
