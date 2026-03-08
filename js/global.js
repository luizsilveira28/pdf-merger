// Funcionalidades globais

// Modo escuro
function initDarkMode() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = '🌙';
    toggle.title = 'Alternar modo escuro';
    document.body.appendChild(toggle);

    // Carregar preferência
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark-mode');
        toggle.innerHTML = '☀️';
    }

    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-mode');
        const isDark = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        toggle.innerHTML = isDark ? '☀️' : '🌙';
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', initDarkMode);
