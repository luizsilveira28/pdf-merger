// Processamento para folha A4 - 4 etiquetas por página (2x2)
async function processA4(srcDoc) {
    const { PDFDocument, degrees, rgb } = PDFLib;
    
    const pageCount = srcDoc.getPageCount();
    if (pageCount < 2) {
        throw new Error('PDF precisa ter pelo menos 2 páginas!');
    }

    // Tamanho A4 em pontos
    const a4Width = 210 * 2.83465;   // ~595pt
    const a4Height = 297 * 2.83465;  // ~842pt
    
    // Tamanho de cada quadrante (metade do A4)
    const quadWidth = a4Width / 2;    // ~297pt = 105mm
    const quadHeight = a4Height / 2;  // ~421pt = 148.5mm
    
    // Tamanho da etiqueta única: 100mm x 150mm
    const labelWidth = 100 * 2.83465;
    const labelHeight = 150 * 2.83465;
    const halfLabel = labelHeight / 2;  // 75mm para cada parte

    const newDoc = await PDFDocument.create();
    
    // Coletar todas as etiquetas processadas (cada par vira uma etiqueta)
    const labels = [];
    
    for (let i = 0; i < pageCount; i += 2) {
        if (i + 1 >= pageCount) break;
        labels.push({ page1Index: i, page2Index: i + 1 });
    }
    
    // Posições dos 4 quadrantes (x, y do canto inferior esquerdo)
    const positions = [
        { x: 0, y: quadHeight },           // Superior esquerdo
        { x: quadWidth, y: quadHeight },   // Superior direito
        { x: 0, y: 0 },                    // Inferior esquerdo
        { x: quadWidth, y: 0 }             // Inferior direito
    ];
    
    // Função para desenhar linhas pontilhadas de corte
    function drawCutLines(page) {
        const dashLength = 5;
        const gapLength = 5;
        const lineColor = rgb(0.7, 0.7, 0.7);
        
        // Linha vertical central
        for (let y = 0; y < a4Height; y += dashLength + gapLength) {
            page.drawLine({
                start: { x: a4Width / 2, y: y },
                end: { x: a4Width / 2, y: Math.min(y + dashLength, a4Height) },
                thickness: 0.5,
                color: lineColor
            });
        }
        
        // Linha horizontal central
        for (let x = 0; x < a4Width; x += dashLength + gapLength) {
            page.drawLine({
                start: { x: x, y: a4Height / 2 },
                end: { x: Math.min(x + dashLength, a4Width), y: a4Height / 2 },
                thickness: 0.5,
                color: lineColor
            });
        }
    }
    
    // Processar etiquetas em grupos de 4
    for (let labelIdx = 0; labelIdx < labels.length; labelIdx++) {
        const posIdx = labelIdx % 4;
        
        // Criar nova página A4 a cada 4 etiquetas
        if (posIdx === 0) {
            const newPage = newDoc.addPage([a4Width, a4Height]);
            drawCutLines(newPage);
        }
        
        const currentPage = newDoc.getPage(newDoc.getPageCount() - 1);
        const pos = positions[posIdx];
        const label = labels[labelIdx];
        
        // Centralizar etiqueta no quadrante
        const offsetX = pos.x + (quadWidth - labelWidth) / 2;
        const offsetY = pos.y + (quadHeight - labelHeight) / 2;
        
        // === PÁGINA 1: Canto superior esquerdo com zoom, rotacionada 90° ===
        const srcPage1 = srcDoc.getPage(label.page1Index);
        const { width: srcW1, height: srcH1 } = srcPage1.getSize();

        const cropRatio = 0.5;
        const cropWidth = srcW1 * cropRatio;
        const cropHeight = srcH1 * cropRatio;

        // Criar documento intermediário com o crop
        const cropDoc = await PDFDocument.create();
        const cropPage = cropDoc.addPage([cropWidth, cropHeight]);
        const [tempEmbed] = await cropDoc.embedPages([srcPage1]);
        
        cropPage.drawPage(tempEmbed, {
            x: 0,
            y: cropHeight - srcH1,
            width: srcW1,
            height: srcH1
        });

        const cropBytes = await cropDoc.save();
        const croppedDoc = await PDFDocument.load(cropBytes);
        const [embeddedPage1] = await newDoc.embedPages(croppedDoc.getPages());

        const scale1 = Math.min(
            labelWidth / cropHeight,
            halfLabel / cropWidth
        );

        const drawWidth1 = cropHeight * scale1;
        const drawHeight1 = cropWidth * scale1;
        const xOffset1 = (labelWidth - drawWidth1) / 2;
        const yOffset1 = halfLabel + (halfLabel - drawHeight1) / 2;

        currentPage.drawPage(embeddedPage1, {
            x: offsetX + xOffset1,
            y: offsetY + yOffset1 + drawHeight1,
            width: cropWidth * scale1,
            height: cropHeight * scale1,
            rotate: degrees(-90)
        });

        // === PÁGINA 2: Inteira, rotacionada 90° (metade de baixo) ===
        const srcPage2 = srcDoc.getPage(label.page2Index);
        const { width: srcW2, height: srcH2 } = srcPage2.getSize();
        const [embeddedPage2] = await newDoc.embedPages([srcPage2]);

        const scale2 = Math.min(
            labelWidth / srcH2,
            halfLabel / srcW2
        );

        const drawWidth2 = srcH2 * scale2;
        const drawHeight2 = srcW2 * scale2;
        const xOffset2 = (labelWidth - drawWidth2) / 2;
        const yOffset2 = (halfLabel - drawHeight2) / 2;

        currentPage.drawPage(embeddedPage2, {
            x: offsetX + xOffset2,
            y: offsetY + yOffset2 + drawHeight2,
            width: srcW2 * scale2,
            height: srcH2 * scale2,
            rotate: degrees(-90)
        });
    }

    return await newDoc.save();
}
