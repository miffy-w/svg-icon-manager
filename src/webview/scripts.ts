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
       \`\${message.count} \${message.count === 1 ? 'asset' : 'assets'}\` +
        (message.count !== message.total ? \` (filtered from \${message.total})\` : '');
    // 重新绑定图片点击事件
    bindImagePreviewEvents();
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

// Format filter - chip click toggles and filters immediately
document.getElementById('formatFilter').addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
        // Toggle chip visual state
        e.target.closest('.format-chip').classList.toggle('active', e.target.checked);
        // Immediately send filter
        const checkboxes = document.querySelectorAll('#formatFilter input[type="checkbox"]:checked');
        const selected = Array.from(checkboxes).map(cb => cb.value);
        vscode.postMessage({
            command: 'filterByFormat',
            formats: selected
        });
    }
});

// Directory filter
document.getElementById('pathFilter').addEventListener('change', (e) => {
    vscode.postMessage({
        command: 'filterByPath',
        path: e.target.value
    });
});

// Refresh button — spin icon on click for visual feedback
document.getElementById('refreshBtn').addEventListener('click', (e) => {
    e.currentTarget.classList.add('spinning');
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
                    path: card.dataset.relative,
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

// Image preview functionality
function bindImagePreviewEvents() {
    const imagePreviews = document.querySelectorAll('.icon-preview[data-preview="true"]');
    imagePreviews.forEach(preview => {
        preview.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) return;
            openPreviewModal(preview.closest('.icon-card'));
        });
    });
}

function openPreviewModal(card) {
    const modal = document.getElementById('previewModal');
    const img = document.getElementById('previewImage');
    const fileName = document.getElementById('previewFileName');
    const fileSize = document.getElementById('previewFileSize');

    if (!card) return;

    // 获取图片 URI (需要通过扩展传递)
    img.src = card.querySelector('img')?.src || '';
    // 从 relativePath 提取完整文件名（含扩展名），如 "logo.png"
    fileName.textContent = card.dataset.relative.split('/').pop();
    // 文件大小（由模板预格式化）
    const sizeBytes = parseInt(card.dataset.filesize);
    fileSize.textContent = sizeBytes > 0 ? formatFileSize(sizeBytes) : '';

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('visible');
    document.body.style.overflow = '';
}

// Modal close events
document.getElementById('modalClose').addEventListener('click', closePreviewModal);
document.querySelector('.modal-backdrop').addEventListener('click', closePreviewModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreviewModal();
    }
});

// Initial bind
bindImagePreviewEvents();
`;
}
