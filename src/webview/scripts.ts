/**
 * Webview JavaScript code
 * This code runs in the webview context
 */

export function getScripts(): string {
  return `
const vscode = acquireVsCodeApi();

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'updateIcons':
            handleUpdateIcons(message);
            break;
    }
});

function handleUpdateIcons(message) {
    document.getElementById('iconsGrid').innerHTML = message.icons;
    document.querySelector('.header-stats').innerHTML = 
       \`\${message.count} \${message.count === 1 ? 'icon' : 'icons'}\` +
        (message.count !== message.total ? \` (filtered from \${message.total})\` : '');
}

// Search with debounce
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        vscode.postMessage({
            command: 'search',
            query: e.target.value
        });
    }, 300);
});

// Directory filter
document.getElementById('pathFilter').addEventListener('change', (e) => {
    vscode.postMessage({
        command: 'filterByPath',
        path: e.target.value
    });
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    vscode.postMessage({ command: 'refresh' });
});

// Icon card actions
document.getElementById('iconsGrid').addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.action-btn');
    
    if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        const card = actionBtn.closest('.icon-card');
        
        switch (action) {
            case 'copyName':
                vscode.postMessage({
                    command: 'copyName',
                    name: card.dataset.name
                });
                break;
            case 'copyImport':
                vscode.postMessage({
                    command: 'copyImport',
                    path: card.dataset.path,
                    name: card.dataset.name
                });
                break;
            case 'openFile':
                vscode.postMessage({
                    command: 'openFile',
                    path: card.dataset.path
                });
                break;
        }
    }
});
`;
}