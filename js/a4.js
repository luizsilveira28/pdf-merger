// Processamento para folha A4
async function processA4(srcDoc) {
    const { PDFDocument } = PDFLib;
    
    if (srcDoc.getPageCount() < 2) {
        throw new Error('PDF precisa ter pelo menos 2 páginas!');
    }

    const newDoc = await PDFDocument.create();
    const [page1] = await newDoc.copyPages(srcDoc, [0]);
    newDoc.addPage(page1);

    const scale = 0.5;
    const srcPage2 = srcDoc.getPage(1);
    const { width: w2, height: h2 } = srcPage2.getSize();
    const [embeddedPage] = await newDoc.embedPages([srcPage2]);

    const destPage = newDoc.getPage(0);
    const { width: w1, height: h1 } = destPage.getSize();

    // Canto superior direito com margem
    const margin = 10;
    const x = w1 - (w2 * scale) - margin;
    const y = h1 - (h2 * scale) - margin;

    destPage.drawPage(embeddedPage, {
        x, y,
        width: w2 * scale,
        height: h2 * scale
    });

    return await newDoc.save();
}
