// Processamento para etiqueta única 100x150mm (duas páginas empilhadas, rotacionadas 90° horário)
async function processSingle(srcDoc) {
    const { PDFDocument, degrees } = PDFLib;
    
    if (srcDoc.getPageCount() < 2) {
        throw new Error('PDF precisa ter pelo menos 2 páginas!');
    }
    
    // Tamanho da etiqueta: 100mm x 150mm em pontos
    const labelWidth = 100 * 2.83465;   // ~283pt
    const labelHeight = 150 * 2.83465;  // ~425pt
    
    // Cada página ocupa metade da altura: 100mm x 75mm
    const halfHeight = labelHeight / 2;

    const newDoc = await PDFDocument.create();
    const newPage = newDoc.addPage([labelWidth, labelHeight]);

    // PÁGINA 1: Canto superior esquerdo com zoom, rotacionada 90° anti-horário
    const srcPage1 = srcDoc.getPage(0);
    const { width: srcW1, height: srcH1 } = srcPage1.getSize();

    // Crop do canto superior esquerdo (50% da página original)
    const cropRatio = 0.5;
    const cropWidth = srcW1 * cropRatio;
    const cropHeight = srcH1 * cropRatio;

    // Criar documento intermediário com o crop aplicado
    const cropDoc = await PDFDocument.create();
    const cropPage = cropDoc.addPage([cropWidth, cropHeight]);
    const [tempEmbed] = await cropDoc.embedPages([srcPage1]);
    
    // Desenhar a página original posicionada para mostrar só o canto superior esquerdo
    cropPage.drawPage(tempEmbed, {
        x: 0,
        y: cropHeight - srcH1,  // Desloca para cima, mostrando só a parte superior
        width: srcW1,
        height: srcH1
    });

    // Salvar e recarregar o crop
    const cropBytes = await cropDoc.save();
    const croppedDoc = await PDFDocument.load(cropBytes);
    const [embeddedPage1] = await newDoc.embedPages(croppedDoc.getPages());

    // Após rotação 90°: largura vira altura, altura vira largura
    // Área disponível: 100mm largura x 75mm altura
    const scale1 = Math.min(
        labelWidth / cropHeight,
        halfHeight / cropWidth
    );

    // Centralizar na metade superior
    const drawWidth1 = cropHeight * scale1;
    const drawHeight1 = cropWidth * scale1;
    const xOffset1 = (labelWidth - drawWidth1) / 2;
    const yOffset1 = halfHeight + (halfHeight - drawHeight1) / 2;

    // Rotação 90° horário (-90°)
    newPage.drawPage(embeddedPage1, {
        x: xOffset1,
        y: yOffset1 + drawHeight1,
        width: cropWidth * scale1,
        height: cropHeight * scale1,
        rotate: degrees(-90)
    });

    // PÁGINA 2: Inteira, rotacionada 90° anti-horário (metade de baixo)
    const srcPage2 = srcDoc.getPage(1);
    const { width: srcW2, height: srcH2 } = srcPage2.getSize();
    const [embeddedPage2] = await newDoc.embedPages([srcPage2]);

    // Escala para caber em 100mm x 75mm após rotação
    const scale2 = Math.min(
        labelWidth / srcH2,
        halfHeight / srcW2
    );

    // Centralizar na metade inferior
    const drawWidth2 = srcH2 * scale2;
    const drawHeight2 = srcW2 * scale2;
    const xOffset2 = (labelWidth - drawWidth2) / 2;
    const yOffset2 = (halfHeight - drawHeight2) / 2;

    // Rotação 90° horário (-90°)
    newPage.drawPage(embeddedPage2, {
        x: xOffset2,
        y: yOffset2 + drawHeight2,
        width: srcW2 * scale2,
        height: srcH2 * scale2,
        rotate: degrees(-90)
    });

    return await newDoc.save();
}
