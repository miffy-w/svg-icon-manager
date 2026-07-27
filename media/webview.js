/**
 * Webview 前端脚本
 * 由扩展在运行时通过 fs 读取后内联进 HTML，运行在 webview 隔离环境中。
 */

const vscode = acquireVsCodeApi();

// Listen for messages from the extension
window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.command) {
    case "applyFilter":
      handleApplyFilter(message);
      break;
  }
});

// 卡片已全量渲染，过滤仅切换显隐，避免 innerHTML 整块重建
function handleApplyFilter(message) {
  const visible = new Set(message.visible);
  document.querySelectorAll("#iconsGrid .icon-card").forEach((card) => {
    card.classList.toggle("hidden", !visible.has(card.dataset.relative));
  });
  document.querySelector(".header-stats").textContent =
    `${message.count} ${message.count === 1 ? "asset" : "assets"}` +
    (message.count !== message.total
      ? ` (filtered from ${message.total})`
      : "");
}

// Search with debounce
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    vscode.postMessage({
      command: "search",
      query: e.target.value,
    });
  }, 300);
});

// Format filter - chip click toggles and filters immediately
document.getElementById("formatFilter").addEventListener("change", (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    // Toggle chip visual state
    e.target
      .closest(".format-chip")
      .classList.toggle("active", e.target.checked);
    // Immediately send filter
    const checkboxes = document.querySelectorAll(
      '#formatFilter input[type="checkbox"]:checked',
    );
    const selected = Array.from(checkboxes).map((cb) => cb.value);
    vscode.postMessage({
      command: "filterByFormat",
      formats: selected,
    });
  }
});

// Directory dropdown with search
const dirDropdown = document.getElementById("dirDropdown");
const dirTrigger = document.getElementById("dirDropdownTrigger");
const dirSearch = document.getElementById("dirDropdownSearch");
const dirList = document.getElementById("dirDropdownList");
const dirEmpty = document.getElementById("dirDropdownEmpty");

dirTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = dirDropdown.classList.toggle("open");
  if (isOpen) {
    dirSearch.value = "";
    filterDirItems("");
    dirSearch.focus();
    // 面板超出视口右缘时改为右对齐，避免撑出横向滚动条
    const panel = document.getElementById("dirDropdownPanel");
    panel.classList.remove("align-right");
    if (panel.getBoundingClientRect().right > window.innerWidth - 8) {
      panel.classList.add("align-right");
    }
  }
});

// Search filtering with debounce
let dirFilterTimeout;
dirSearch.addEventListener("input", (e) => {
  clearTimeout(dirFilterTimeout);
  dirFilterTimeout = setTimeout(() => {
    filterDirItems(e.target.value);
  }, 150);
});

// Prevent search input click from closing panel
dirSearch.addEventListener("click", (e) => e.stopPropagation());

function filterDirItems(query) {
  const lowerQuery = query.toLowerCase();
  // 搜索时列表切换为平铺模式（显示完整路径），避免父目录被过滤后缩进悬空
  dirList.classList.toggle("searching", lowerQuery.length > 0);
  if (!lowerQuery) {
    // 清空搜索：恢复树形模式，按折叠状态显示
    applyTreeVisibility();
    dirEmpty.style.display = "none";
    return;
  }
  let visibleCount = 0;
  const items = dirList.querySelectorAll(".dir-dropdown-item");
  items.forEach((item) => {
    const searchText = item.dataset.search || "";
    const match = searchText.includes(lowerQuery);
    item.style.display = match ? "" : "none";
    if (match) {visibleCount++;}
  });
  dirEmpty.style.display = visibleCount === 0 ? "" : "none";
}

// Collapse/expand tree nodes
const collapsedDirs = new Set();

function isHiddenByCollapse(dir) {
  for (const collapsed of collapsedDirs) {
    if (dir.startsWith(collapsed + "/")) {return true;}
  }
  return false;
}

// 树形模式下按折叠状态显隐后代目录
function applyTreeVisibility() {
  dirList.querySelectorAll(".dir-dropdown-item").forEach((item) => {
    const dir = item.dataset.dir;
    item.style.display = dir && isHiddenByCollapse(dir) ? "none" : "";
  });
}

// Select directory item (or toggle collapse via twisty)
dirList.addEventListener("click", (e) => {
  // 点击折叠箭头：只展开/收起，不选中、不关闭面板
  const twisty = e.target.closest(".dir-twisty");
  if (twisty && !twisty.classList.contains("dir-twisty-placeholder")) {
    e.stopPropagation();
    const twistyItem = twisty.closest(".dir-dropdown-item");
    const twistyDir = twistyItem.dataset.dir;
    if (collapsedDirs.has(twistyDir)) {
      collapsedDirs.delete(twistyDir);
    } else {
      collapsedDirs.add(twistyDir);
    }
    twistyItem.classList.toggle("collapsed", collapsedDirs.has(twistyDir));
    applyTreeVisibility();
    return;
  }

  const item = e.target.closest(".dir-dropdown-item");
  if (!item) {return;}

  const dir = item.dataset.dir;

  // 触发按钮回显完整路径，过长时 CSS 截断，tooltip 显示全部，并切换激活态
  dirTrigger.querySelector(".dir-trigger-text").textContent =
    dir || "All Directories";
  dirTrigger.title = dir || "All Directories";
  dirTrigger.classList.toggle("filtered", !!dir);

  // Update active state
  dirList
    .querySelectorAll(".dir-dropdown-item")
    .forEach((el) => el.classList.remove("active"));
  item.classList.add("active");

  // Close panel
  dirDropdown.classList.remove("open");

  vscode.postMessage({
    command: "filterByPath",
    path: dir,
  });
});

// Click outside to close
document.addEventListener("click", (e) => {
  if (!dirDropdown.contains(e.target)) {
    dirDropdown.classList.remove("open");
  }
});

// Esc to close dropdown first (before modal)
const escHandler = (e) => {
  if (e.key === "Escape" && dirDropdown.classList.contains("open")) {
    e.stopPropagation();
    dirDropdown.classList.remove("open");
  }
};
document.addEventListener("keydown", escHandler, true);

// Refresh button — spin icon on click for visual feedback
document.getElementById("refreshBtn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  // 先移除再强制重排，确保 animation 每次都能重新触发
  btn.classList.remove("spinning");
  void btn.offsetWidth;
  btn.classList.add("spinning");
  vscode.postMessage({ command: "refresh" });
});

// Icon card actions (事件委托，避免逐卡片绑定监听器)
document.getElementById("iconsGrid").addEventListener("click", (e) => {
  const actionBtn = e.target.closest(".action-btn");

  if (actionBtn) {
    e.stopPropagation();
    const action = actionBtn.dataset.action;
    const card = actionBtn.closest(".icon-card");

    switch (action) {
      case "copyName":
        vscode.postMessage({
          command: "copyName",
          name: card.dataset.name,
        });
        break;
      case "copyImport":
        vscode.postMessage({
          command: "copyImport",
          path: card.dataset.relative,
          name: card.dataset.name,
        });
        break;
      case "openFile":
        vscode.postMessage({
          command: "openFile",
          path: card.dataset.path,
        });
        break;
    }
    return;
  }

  // 图片预览同样走委托，卡片重建后无需重新绑定
  const preview = e.target.closest('.icon-preview[data-preview="true"]');
  if (preview) {
    openPreviewModal(preview.closest(".icon-card"));
  }
});

// Image preview modal
function openPreviewModal(card) {
  const modal = document.getElementById("previewModal");
  const img = document.getElementById("previewImage");
  const fileName = document.getElementById("previewFileName");
  const fileSize = document.getElementById("previewFileSize");

  if (!card) {return;}

  // 获取图片 URI (需要通过扩展传递)
  img.src = card.querySelector("img")?.src || "";
  // 从 relativePath 提取完整文件名（含扩展名），如 "logo.png"
  fileName.textContent = card.dataset.relative.split("/").pop();
  // 文件大小（由模板预格式化）
  const sizeBytes = parseInt(card.dataset.filesize);
  fileSize.textContent = sizeBytes > 0 ? formatFileSize(sizeBytes) : "";

  modal.classList.add("visible");
  document.body.style.overflow = "hidden";
}

function formatFileSize(bytes) {
  if (bytes < 1024) {return bytes + " B";}
  if (bytes < 1024 * 1024) {return (bytes / 1024).toFixed(1) + " KB";}
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function closePreviewModal() {
  const modal = document.getElementById("previewModal");
  modal.classList.remove("visible");
  document.body.style.overflow = "";
}

// Modal close events
document
  .getElementById("modalClose")
  .addEventListener("click", closePreviewModal);
document
  .querySelector(".modal-backdrop")
  .addEventListener("click", closePreviewModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePreviewModal();
  }
});
