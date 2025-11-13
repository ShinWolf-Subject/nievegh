const token = process.env.API_TOKEN;

const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const breadcrumb = document.getElementById('breadcrumb');
const repoContents = document.getElementById('repo-contents');
const contentsList = document.getElementById('contents-list');
const filePreviewModal = document.getElementById('file-preview-modal');
const previewTitle = document.getElementById('preview-title');
const previewContent = document.getElementById('preview-content');
const closePreviewBtn = document.getElementById('close-preview');
const githubLink = document.getElementById('github-link');
const itemCount = document.getElementById('item-count');

const repoOwner = 'ShinWolf-Subject';
const repoName = 'nine-public-sites';
const basePath = 'public';

let currentPath = basePath;
let pathHistory = [basePath];

document.addEventListener('DOMContentLoaded', () => {
    closePreviewBtn.addEventListener('click', () => {
        filePreviewModal.classList.add('hidden');
    });
    filePreviewModal.addEventListener('click', (e) => {
        if (e.target === filePreviewModal) {
            filePreviewModal.classList.add('hidden');
        }
    });
    loadRepositoryContents();
});

async function loadRepositoryContents() {
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    repoContents.classList.add('hidden');
    try {
        let apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${currentPath}`;
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        displayContents(data);
        updateBreadcrumb();
        repoContents.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading repository:', error);
        showError(`Failed to load repository: ${error.message}`);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function displayContents(contents) {
    contentsList.innerHTML = '';
    itemCount.textContent = `${contents.length} items`;
    const folders = contents.filter(item => item.type === 'dir');
    const files = contents.filter(item => item.type === 'file');
    folders.forEach(folder => {
        const folderElement = createFolderElement(folder);
        contentsList.appendChild(folderElement);
    });
    files.forEach(file => {
        const fileElement = createFileElement(file);
        contentsList.appendChild(fileElement);
    });
    if (contents.length === 0) {
        contentsList.innerHTML = `
            <div class="px-6 py-12 text-center text-gray-400">
                <i class="fas fa-folder-open text-4xl mb-3 opacity-50"></i>
                <p class="text-lg">This folder is empty</p>
            </div>
        `;
    }
}

function createFolderElement(folder) {
    const folderElement = document.createElement('div');
    folderElement.className = 'folder-item px-6 py-4 hover:bg-slate-700/30 transition duration-200 flex items-center justify-between group cursor-pointer';
    folderElement.innerHTML = `
        <div class="flex items-center flex-1">
            <i class="fas fa-folder text-yellow-400 text-xl mr-4 group-hover:scale-110 transition-transform"></i>
            <div class="flex-1">
                <h4 class="font-medium text-gray-200 group-hover:text-blue-300 transition">${folder.name}</h4>
                <p class="text-sm text-gray-500">Folder</p>
            </div>
        </div>
        <div class="folder-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex">
            <button class="text-blue-400 hover:text-blue-300 ml-2 p-2 rounded-full hover:bg-slate-700/50 transition" data-path="${folder.path}" title="Open Folder">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    folderElement.addEventListener('click', () => {
        navigateToFolder(folder.path);
    });
    return folderElement;
}

function createFileElement(file) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item px-6 py-4 hover:bg-slate-700/30 transition duration-200 flex items-center justify-between group cursor-pointer';
    const fileIcon = getFileIcon(file.name);
    fileElement.innerHTML = `
        <div class="flex items-center flex-1">
            <i class="${fileIcon} text-blue-400 text-xl mr-4 group-hover:scale-110 transition-transform"></i>
            <div class="flex-1">
                <h4 class="font-medium text-gray-200 group-hover:text-blue-300 transition">${file.name}</h4>
                <p class="text-sm text-gray-500">${formatFileSize(file.size)} • ${getFileType(file.name)}</p>
            </div>
        </div>
        <div class="file-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex">
            <button class="text-blue-400 hover:text-blue-300 ml-2 p-2 rounded-full hover:bg-slate-700/50 transition" data-file="${file.path}" title="Preview File">
                <i class="fas fa-eye"></i>
            </button>
            <a href="${file.html_url}" target="_blank" class="text-gray-400 hover:text-gray-200 ml-2 p-2 rounded-full hover:bg-slate-700/50 transition" title="View on GitHub">
                <i class="fab fa-github"></i>
            </a>
        </div>
    `;
    fileElement.addEventListener('click', () => {
        previewFile(file);
    });
    return fileElement;
}

function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'js': 'fab fa-js text-[rgba(2240,219,79)] text-xl',
        'html': 'fab fa-html5 text-[rgba(277,76,38)] text-xl',
        'css': 'fab fa-css3-alt text-[rgba(38,77,228)] text-xl',
        'json': 'fas fa-code text-orange-400 text-xl',
        'md': 'fas fa-markdown text-blue-400 text-xl',
        'txt': 'fas fa-file-alt text-gray-400 text-xl',
        'pdf': 'fas fa-file-pdf text-red-500 text-xl',
        'zip': 'fas fa-file-archive text-yellow-500 text-xl',
        'jpg': 'fas fa-file-image text-purple-400 text-xl',
        'jpeg': 'fas fa-file-image text-purple-400 text-xl',
        'png': 'fas fa-file-image text-purple-400 text-xl',
        'gif': 'fas fa-file-image text-purple-400 text-xl',
        'svg': 'fas fa-file-image text-purple-400 text-xl',
        'py': 'fab fa-python text-blue-500 text-xl',
        'java': 'fab fa-java text-orange-600 text-xl',
        'php': 'fab fa-php text-indigo-500 text-xl'
    };
    return iconMap[extension] || 'fas fa-file text-gray-400 text-xl';
}

function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'js': 'JavaScript',
        'html': 'HTML',
        'css': 'CSS',
        'json': 'JSON',
        'md': 'Markdown',
        'txt': 'Text',
        'pdf': 'PDF',
        'zip': 'Archive',
        'jpg': 'Image',
        'jpeg': 'Image',
        'png': 'Image',
        'gif': 'Image',
        'svg': 'SVG',
        'py': 'Python',
        'java': 'Java',
        'php': 'PHP'
    };
    return typeMap[extension] || 'File';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function navigateToFolder(path) {
    currentPath = path;
    pathHistory.push(path);
    loadRepositoryContents();
}

function updateBreadcrumb() {
    const breadcrumbOl = breadcrumb.querySelector('ol');
    breadcrumbOl.innerHTML = '';
    breadcrumb.classList.remove('hidden');
    const rootItem = document.createElement('li');
    rootItem.className = 'breadcrumb-item';
    rootItem.innerHTML = `<a href="#" class="text-blue-400 hover:text-blue-300 font-medium transition" data-path="${basePath}"><i class="fas fa-home mr-1"></i>Home</a>`;
    rootItem.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        currentPath = basePath;
        loadRepositoryContents();
    });
    breadcrumbOl.appendChild(rootItem);
    if (currentPath !== basePath) {
        const pathSegments = currentPath.replace(`${basePath}/`, '').split('/');
        let accumulatedPath = basePath;
        pathSegments.forEach(segment => {
            accumulatedPath += `/${segment}`;
            const crumbItem = document.createElement('li');
            crumbItem.className = 'breadcrumb-item';
            if (segment === pathSegments[pathSegments.length - 1]) {
                crumbItem.innerHTML = `<span class="text-gray-300 font-medium">${segment}</span>`;
            } else {
                crumbItem.innerHTML = `<a href="#" class="text-blue-400 hover:text-blue-300 font-medium transition" data-path="${accumulatedPath}">${segment}</a>`;
                crumbItem.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPath = accumulatedPath;
                    loadRepositoryContents();
                });
            }
            breadcrumbOl.appendChild(crumbItem);
        });
    }
}

async function previewFile(file) {
    previewContent.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            <span class="ml-3 text-gray-300">Loading file content...</span>
        </div>
    `;
    previewTitle.innerHTML = `<i class="fas fa-file mr-2 text-blue-400"></i>${file.name}`;
    githubLink.href = file.html_url;
    filePreviewModal.classList.remove('hidden');
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3.raw'
        };
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        const response = await fetch(file.download_url, { headers });
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status}`);
        }
        const content = await response.text();
        displayFileContent(file.name, content);
    } catch (error) {
        console.error('Error loading file:', error);
        previewContent.innerHTML = `
            <div class="glass-effect border border-red-500/30 rounded-lg p-4 text-red-300">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <p>Failed to load file content: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

function displayFileContent(filename, content) {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'md':
            previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto">${escapeHtml(content)}</pre>`;
            break;
        case 'json':
            try {
                const formattedJson = JSON.stringify(JSON.parse(content), null, 2);
                previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto language-json">${escapeHtml(formattedJson)}</pre>`;
            } catch (e) {
                previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto">${escapeHtml(content)}</pre>`;
            }
            break;
        case 'html':
            previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto language-html">${escapeHtml(content)}</pre>`;
            break;
        case 'css':
            previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto language-css">${escapeHtml(content)}</pre>`;
            break;
        case 'js':
            previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto language-javascript">${escapeHtml(content)}</pre>`;
            break;
        case 'txt':
            previewContent.innerHTML = `<pre class="whitespace-pre-wrap bg-slate-800/50 text-gray-200 p-4 rounded-lg border border-slate-600/30 overflow-auto">${escapeHtml(content)}</pre>`;
            break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
            previewContent.innerHTML = `
                <div class="flex flex-col items-center">
                    <img src="${content}" alt="${filename}" class="max-w-full h-auto rounded-lg shadow-md mb-4 border border-slate-600/30">
                    <p class="text-sm text-gray-400">Image preview</p>
                </div>`;
            break;
        default:
            previewContent.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-file text-5xl text-gray-600 mb-4"></i>
                    <h4 class="text-lg font-medium text-gray-300 mb-2">Preview not available</h4>
                    <p class="text-gray-400 mb-6">This file type cannot be previewed in the browser.</p>
                    <a href="${content}" target="_blank" class="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200">
                        <i class="fas fa-download mr-2"></i>
                        Download File
                    </a>
                </div>
            `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}
