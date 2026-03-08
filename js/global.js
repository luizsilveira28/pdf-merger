// Funcionalidades globais

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

    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-mode');
        const isDarkNow = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkNow);
        toggle.innerHTML = isDarkNow ? '☀️' : '🌙';
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', initDarkMode);
