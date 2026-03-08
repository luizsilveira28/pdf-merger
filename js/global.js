// Funcionalidades globais

// Converter imagem para grayscale (função compartilhada)
function toGrayscale(base64) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
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
        img.onerror = () => resolve(base64); // fallback em caso de erro
        img.src = base64;
    });
}

// Parser de CSV robusto
function parseCSV(csvText, requiredHeaders = []) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV deve ter pelo menos um cabeçalho e uma linha de dados');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validar headers obrigatórios
    for (const required of requiredHeaders) {
        if (!headers.includes(required.toLowerCase())) {
            throw new Error(`Coluna obrigatória "${required}" não encontrada no CSV`);
        }
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx] || '';
        });
        data.push(obj);
    }
    
    return { headers, data };
}

// Parser de linha CSV que lida com aspas e vírgulas
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

// Mostrar mensagem de status com tipo
function showStatus(element, message, type = 'info') {
    if (!element) return;
    element.textContent = message;
    element.className = 'status';
    if (type === 'error') {
        element.style.color = '#d32f2f';
    } else if (type === 'success') {
        element.style.color = '#388e3c';
    } else {
        element.style.color = '#666';
    }
}

// Modo escuro
function initDarkMode() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    document.body.appendChild(toggle);

    // Carregar preferência (default: escuro)
    const savedPref = localStorage.getItem('darkMode');
    const isDark = savedPref === null ? true : savedPref === 'true';
    
    if (isDark) {
        document.documentElement.classList.add('dark-mode');
        toggle.innerHTML = '☀️';
    } else {
        toggle.innerHTML = '🌙';
    }

    toggle.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
    toggle.setAttribute('title', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');

    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-mode');
        const isDarkNow = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkNow);
        toggle.innerHTML = isDarkNow ? '☀️' : '🌙';
        toggle.setAttribute('aria-label', isDarkNow ? 'Ativar modo claro' : 'Ativar modo escuro');
        toggle.setAttribute('title', isDarkNow ? 'Ativar modo claro' : 'Ativar modo escuro');
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', initDarkMode);
