// Processamento para etiquetadora térmica 100x150mm
async function processThermal(srcDoc) {
    const { PDFDocument } = PDFLib;
    
    // Tamanho da etiqueta: 100mm x 150mm em pontos
    const labelWidth = 100 * 2.83465;
    const labelHeight = 150 * 2.83465;

    const newDoc = await PDFDocument.create();
    const pageCount = srcDoc.getPageCount();

    // Processar cada par de páginas (página 1 = etiqueta, página 2 = código)
    for (let i = 0; i < pageCount; i += 2) {
        // PÁGINA 1: Expandir canto superior esquerdo
        const srcPage1 = srcDoc.getPage(i);
        const { width: srcW1, height: srcH1 } = srcPage1.getSize();
        const newPage1 = newDoc.addPage([labelWidth, labelHeight]);
        const [embeddedPage1] = await newDoc.embedPages([srcPage1]);

        const cropRatio = 0.5;
        const scale1 = Math.min(
            labelWidth / (srcW1 * cropRatio),
            labelHeight / (srcH1 * cropRatio)
        );

        newPage1.drawPage(embeddedPage1, {
            x: 0,
            y: labelHeight - (srcH1 * scale1),
            width: srcW1 * scale1,
            height: srcH1 * scale1
        });

        // PÁGINA 2: Redimensionar inteira para 100x150mm (se existir)
        if (i + 1 < pageCount) {
            const srcPage2 = srcDoc.getPage(i + 1);
            const { width: srcW2, height: srcH2 } = srcPage2.getSize();
            const newPage2 = newDoc.addPage([labelWidth, labelHeight]);
            const [embeddedPage2] = await newDoc.embedPages([srcPage2]);

            const scale2 = Math.min(
                labelWidth / srcW2,
                labelHeight / srcH2
            );

            const x2 = (labelWidth - srcW2 * scale2) / 2;
            const y2 = (labelHeight - srcH2 * scale2) / 2;

            newPage2.drawPage(embeddedPage2, {
                x: x2,
                y: y2,
                width: srcW2 * scale2,
                height: srcH2 * scale2
            });
        }
    }

    return await newDoc.save();
}
