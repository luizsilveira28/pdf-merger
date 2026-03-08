const imgInput = document.getElementById('imgInput');
const nomeProduto = document.getElementById('nomeProduto');
const refProduto = document.getElementById('refProduto');
const corProduto = document.getElementById('corProduto');
const tamanhoProduto = document.getElementById('tamanhoProduto');
const codigoBarras = document.getElementById('codigoBarras');
const precoProduto = document.getElementById('precoProduto');
const mostrarPreco = document.getElementById('mostrarPreco');
const precoContainer = document.getElementById('precoContainer');
const gerarBtn = document.getElementById('gerarBtn');
const status = document.getElementById('status');

const previewImg = document.getElementById('previewImg');
const previewNome = document.getElementById('previewNome');
const previewTamanho = document.getElementById('previewTamanho');
const previewCor = document.getElementById('previewCor');
const previewRef = document.getElementById('previewRef');
const previewBarcode = document.getElementById('previewBarcode');
const previewPreco = document.getElementById('previewPreco');

const imgOptions = document.querySelectorAll('.img-option');
const imgMocassim = document.getElementById('imgMocassim');
const imgAlpargata = document.getElementById('imgAlpargata');

let imagemBase64 = null;
let tipoImagem = 'custom';

// Carregar ícones predefinidos
const iconMap = {};
PRODUCT_ICONS.forEach(icon => {
    iconMap[icon.name.toLowerCase()] = icon.data;
});
if (iconMap.mocassim) imgMocassim.src = iconMap.mocassim;
if (iconMap.alpargata) imgAlpargata.src = iconMap.alpargata;

// Seleção de tipo de imagem
imgOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        const tipo = opt.dataset.type;
        
        if (tipo === 'custom') {
            // Abre seletor de arquivos
            imgInput.click();
        } else {
            imgOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            tipoImagem = tipo;
            imagemBase64 = iconMap[tipoImagem];
            previewImg.src = imagemBase64;
        }
    });
});

imgInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            imagemBase64 = ev.target.result;
            previewImg.src = imagemBase64;
            // Seleciona o botão custom
            imgOptions.forEach(o => o.classList.remove('selected'));
            document.querySelector('[data-type="custom"]').classList.add('selected');
            tipoImagem = 'custom';
        };
        reader.readAsDataURL(file);
    }
};

mostrarPreco.onchange = () => {
    precoContainer.style.display = mostrarPreco.checked ? 'block' : 'none';
    previewPreco.style.display = mostrarPreco.checked ? 'block' : 'none';
};

nomeProduto.oninput = () => previewNome.textContent = nomeProduto.value || 'Nome';
refProduto.oninput = () => previewRef.textContent = `Ref: ${refProduto.value || '-'}`;
corProduto.oninput = () => previewCor.textContent = corProduto.value || '-';
tamanhoProduto.oninput = () => previewTamanho.textContent = tamanhoProduto.value || '-';

codigoBarras.oninput = () => {
    const codigo = codigoBarras.value || '000000000';
    try {
        JsBarcode(previewBarcode, codigo, {
            format: 'EAN13', width: 1.8, height: 38, displayValue: true, fontSize: 10, margin: 0
        });
    } catch {
        JsBarcode(previewBarcode, codigo, {
            format: 'CODE128', width: 1.5, height: 38, displayValue: true, fontSize: 10, margin: 0
        });
    }
};

precoProduto.oninput = () => previewPreco.textContent = `R$ ${precoProduto.value || '0,00'}`;

gerarBtn.onclick = async () => {
    if (!imagemBase64) {
        status.textContent = 'Selecione uma imagem!';
        return;
    }

    try {
        status.textContent = 'Gerando PDF...';
        gerarBtn.disabled = true;

        const pdfDoc = await PDFLib.PDFDocument.create();
        
        // 51mm x 25mm em pontos (1mm = 2.83465pt)
        const largura = 51 * 2.83465;
        const altura = 25 * 2.83465;

        // Converter imagem para PNG em escala de cinza
        const convertToGrayscalePng = (base64) => {
            return new Promise((resolve) => {
                const imgEl = new Image();
                imgEl.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = imgEl.width;
                    canvas.height = imgEl.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imgEl, 0, 0);
                    
                    // Converter para escala de cinza
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                        data[i] = gray;
                        data[i + 1] = gray;
                        data[i + 2] = gray;
                    }
                    ctx.putImageData(imageData, 0, 0);
                    
                    resolve(canvas.toDataURL('image/png'));
                };
                imgEl.src = base64;
            });
        };

        // Carregar imagem (sempre converte para escala de cinza)
        const pngBase64 = await convertToGrayscalePng(imagemBase64);
        const img = await pdfDoc.embedPng(pngBase64);

        // Gerar código de barras
        const barcodeCanvas = document.createElement('canvas');
        const codigo = codigoBarras.value || '000000000';
        try {
            JsBarcode(barcodeCanvas, codigo, {
                format: 'EAN13', width: 2, height: 40, displayValue: true, fontSize: 12, margin: 0
            });
        } catch {
            JsBarcode(barcodeCanvas, codigo, {
                format: 'CODE128', width: 1.5, height: 40, displayValue: true, fontSize: 12, margin: 0
            });
        }
        const barcodeImg = await pdfDoc.embedPng(barcodeCanvas.toDataURL('image/png'));

        const page = pdfDoc.addPage([largura, altura]);
        const { height } = page.getSize();

        // Imagem grande à esquerda (centralizada verticalmente)
        const imgMaxW = 50;
        const imgMaxH = altura - 4;
        const imgScale = Math.min(imgMaxW / img.width, imgMaxH / img.height);
        const imgW = img.width * imgScale;
        const imgH = img.height * imgScale;
        const imgY = (altura - imgH) / 2;
        
        page.drawImage(img, {
            x: 2,
            y: imgY,
            width: imgW,
            height: imgH,
        });

        // Textos (direita)
        const xText = 55;
        const rightEdge = largura - 5;
        
        // Nome à esquerda
        page.drawText(nomeProduto.value || 'Produto', {
            x: xText, y: height - 12, size: 10,
        });
        
        // Tamanho grande à direita
        const tam = tamanhoProduto.value || '-';
        const tamWidth = tam.length * 9;
        page.drawText(tam, {
            x: rightEdge - tamWidth, y: height - 12, size: 14,
        });

        // Cor (destaque)
        page.drawText(corProduto.value || '-', {
            x: xText, y: height - 23, size: 9,
        });

        // Ref
        page.drawText(`Ref: ${refProduto.value || '-'}`, {
            x: xText, y: height - 31, size: 6,
        });

        // Código de barras (mais perto dos textos)
        const bcScale = Math.min(85 / barcodeImg.width, 32 / barcodeImg.height);
        page.drawImage(barcodeImg, {
            x: xText,
            y: mostrarPreco.checked ? 12 : 2,
            width: barcodeImg.width * bcScale,
            height: barcodeImg.height * bcScale,
        });

        // Preço (opcional)
        if (mostrarPreco.checked) {
            page.drawText(`R$ ${precoProduto.value || '0,00'}`, {
                x: xText + 20, y: 2, size: 9,
            });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'etiqueta-produto.pdf';
        a.click();

        URL.revokeObjectURL(url);
        status.textContent = 'PDF gerado!';
        gerarBtn.disabled = false;
    } catch (e) {
        status.textContent = 'Erro: ' + e.message;
        gerarBtn.disabled = false;
        console.error(e);
    }
};

codigoBarras.dispatchEvent(new Event('input'));

// Imprimir direto
const imprimirBtn = document.getElementById('imprimirBtn');
imprimirBtn.onclick = () => {
    if (!imagemBase64) {
        status.textContent = 'Selecione uma imagem!';
        return;
    }

    // Criar janela de impressão com a etiqueta
    const printWindow = window.open('', '_blank');
    const preview = document.getElementById('preview');
    
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
                .etiqueta-preview {
                    width: 51mm;
                    height: 25mm;
                    display: flex;
                    background: #fff;
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                }
                .etiqueta-img-container {
                    width: 18mm;
                    height: 25mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1mm;
                }
                .etiqueta-img-container img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    filter: grayscale(100%);
                }
                .etiqueta-info {
                    flex: 1;
                    padding: 1mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .etiqueta-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                }
                .etiqueta-nome {
                    font-size: 8pt;
                    font-weight: bold;
                }
                .etiqueta-tamanho {
                    font-size: 12pt;
                    font-weight: bold;
                }
                .etiqueta-cor {
                    font-size: 7pt;
                }
                .etiqueta-ref {
                    font-size: 5pt;
                    color: #666;
                }
                svg {
                    width: 100%;
                    height: auto;
                    max-height: 10mm;
                }
                .etiqueta-preco {
                    font-size: 7pt;
                    font-weight: bold;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            ${preview.outerHTML}
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
};