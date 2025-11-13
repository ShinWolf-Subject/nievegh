// =============================================
// CONFIGURATION
// =============================================
const GITHUB_TOKEN = process.env.API_TOKEN;
const REPOSITORY_NAME = 'nine-public-sites';
const REPO_PATH = 'public';
const NETLIFY_BASE = 'ninepubsites';

// Quick Links Array
const QUICK_LINKS = [
{
    title: 'View your site files',
    url: 'publicfiles',
    icon: 'fas fa-folder-open',
    color: 'text-purple-400'
},
{
    title: 'Deploy to Vercel',
    url: 'https://ninetwelvedeploy.vercel.app',
    icon: 'fas fa-cloud-upload',
    color: 'text-blue-400'
},
{
    title: 'Deploy to Netlify',
    url: 'https://ninetwelversdeploynfp.netlify.app',
    icon: 'fas fa-cloud-upload',
    color: 'text-green-400'
},
{
    title: 'NineCloud',
    url: 'https://ninecloud.netlify.app',
    icon: 'fas fa-cloud',
    color: 'text-amber-400'
},
{
    title: 'Made By NineTwelve',
    url: 'https://',
    icon: 'fas fa-user',
    color: 'text-rose-400'
}];
// =============================================

let htmlFile = null;
let assetFiles = [];
let customFolders = []; // Array to store custom folders
let fileToFolderMapping = {}; // Maps file names to folder paths

// DOM Elements
const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    closeSidebar: document.getElementById('closeSidebar'),
    htmlDropZone: document.getElementById('htmlDropZone'),
    assetsDropZone: document.getElementById('assetsDropZone'),
    htmlFileInput: document.getElementById('htmlFileInput'),
    assetsFileInput: document.getElementById('assetsFileInput'),
    folderInput: document.getElementById('folderInput'),
    selectFilesBtn: document.getElementById('selectFilesBtn'),
    selectFolderBtn: document.getElementById('selectFolderBtn'),
    htmlFileList: document.getElementById('htmlFileList'),
    assetsFileList: document.getElementById('assetsFileList'),
    fileCount: document.getElementById('fileCount'),
    deployBtn: document.getElementById('deployBtn'),
    clearBtn: document.getElementById('clearBtn'),
    siteNameInput: document.getElementById('siteName'),
    siteNamePreview: document.getElementById('siteNamePreview'),
    siteFolderPreview: document.getElementById('siteFolderPreview'),
    repoPreview: document.getElementById('repoPreview'),
    filesPreview: document.getElementById('filesPreview'),
    resultsDiv: document.getElementById('results'),
    resultContent: document.getElementById('resultContent'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    createFolderBtn: document.getElementById('createFolderBtn'),
    folderList: document.getElementById('folderList'),
    folderCount: document.getElementById('folderCount')
};

// Initialize
function init() {
    if (!GITHUB_TOKEN || GITHUB_TOKEN.includes('xxxx')) {
        showResult('⚠️ GitHub token not configured. Please set your token in the code.', 'error');
        elements.deployBtn.disabled = true;
    }
    if (!REPOSITORY_NAME || REPOSITORY_NAME === 'my-websites') {
        showResult('⚠️ Repository name not configured. Please set your repository name.', 'error');
        elements.deployBtn.disabled = true;
    }
    elements.repoPreview.textContent = REPOSITORY_NAME;
    renderQuickLinks();
    setupEventListeners();
    gsap.from('nav', { duration: 0.8, y: -50, opacity: 0 });
    gsap.from('.glass-card', { duration: 0.8, y: 30, opacity: 0, stagger: 0.1, delay: 0.2 });
}

// Render Quick Links
function renderQuickLinks() {
    const container = document.getElementById('quickLinksContainer');
    container.innerHTML = '';
    
    QUICK_LINKS.forEach(link => {
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.target = '_blank';
        linkElement.className = 'flex items-center p-2 rounded-lg hover:bg-white/5 transition-colors group';
        linkElement.innerHTML = `
                    <i class="${link.icon} ${link.color} mr-3 text-lg"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-300 group-hover:text-white transition">${link.title}</div>
                    </div>
                    <i class="fas fa-external-link-alt text-gray-600 text-xs group-hover:text-gray-400"></i>
                `;
        container.appendChild(linkElement);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Sidebar
    elements.sidebarToggle.addEventListener('click', () => {
        elements.sidebar.classList.add('open');
        elements.sidebarOverlay.classList.add('active');
    });
    
    elements.closeSidebar.addEventListener('click', closeSidebar);
    elements.sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Site name
    elements.siteNameInput.addEventListener('input', (e) => {
        const name = e.target.value || 'website-name';
        elements.siteNamePreview.textContent = name;
        elements.siteFolderPreview.textContent = name;
        updateStructurePreview();
    });
    
    // HTML file
    elements.htmlDropZone.addEventListener('click', () => elements.htmlFileInput.click());
    elements.htmlDropZone.addEventListener('dragover', handleDragOver);
    elements.htmlDropZone.addEventListener('dragleave', handleDragLeave);
    elements.htmlDropZone.addEventListener('drop', (e) => handleDrop(e, 'html'));
    elements.htmlFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleHtmlFile(e.target.files[0]);
    });
    
    // Assets - Fixed button handlers
    elements.selectFilesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.assetsFileInput.click();
    });
    
    elements.selectFolderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.folderInput.click();
    });
    
    elements.assetsDropZone.addEventListener('dragover', handleDragOver);
    elements.assetsDropZone.addEventListener('dragleave', handleDragLeave);
    elements.assetsDropZone.addEventListener('drop', (e) => handleDrop(e, 'assets'));
    elements.assetsFileInput.addEventListener('change', (e) => {
        handleAssetFiles(Array.from(e.target.files));
    });
    elements.folderInput.addEventListener('change', (e) => {
        handleAssetFiles(Array.from(e.target.files));
    });
    
    // Buttons
    elements.deployBtn.addEventListener('click', deploy);
    elements.clearBtn.addEventListener('click', clearAll);
    
    // Folder management
    elements.createFolderBtn.addEventListener('click', createFolder);
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('active');
}

// Drag & Drop (Klo gak ada cuma bisa pake pilih doang ntar)
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('active');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('active');
}

function handleDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    
    const items = e.dataTransfer.items;
    const files = [];
    
    if (items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                if (item.isFile) {
                    items[i].getAsFile() && files.push(items[i].getAsFile());
                } else if (item.isDirectory) {
                    readDirectory(item, files);
                }
            }
        }
        setTimeout(() => {
            if (type === 'html' && files.length > 0) {
                handleHtmlFile(files[0]);
            } else if (type === 'assets') {
                handleAssetFiles(files);
            }
        }, 100);
    } else {
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (type === 'html' && droppedFiles.length > 0) {
            handleHtmlFile(droppedFiles[0]);
        } else if (type === 'assets') {
            handleAssetFiles(droppedFiles);
        }
    }
}

function readDirectory(directory, files) {
    const reader = directory.createReader();
    reader.readEntries((entries) => {
        entries.forEach((entry) => {
            if (entry.isFile) {
                entry.file((file) => files.push(file));
            } else if (entry.isDirectory) {
                readDirectory(entry, files);
            }
        });
    });
}

// File HTML
function handleHtmlFile(file) {
    if (!file.name.endsWith('.html')) {
        alert('Please select an HTML file for the main file section.');
        return;
    }
    htmlFile = file;
    elements.htmlFileList.innerHTML = `
         <div class="file-item flex items-center justify-between glass-card p-4 rounded-lg border border-blue-500/30">
             <div class="flex items-center flex-1">
                 <i class="fab fa-html5 text-orange-400 text-2xl mr-3"></i>
                 <div class="flex-1">
                     <div class="font-medium text-white">${file.name}</div>
                     <div class="text-xs text-blue-300 mt-1">
                         <i class="fas fa-arrow-right mr-1"></i>
                         Will be renamed to <strong>index.html</strong>
                     </div>
                     <div class="text-xs text-gray-500 mt-1">${formatFileSize(file.size)}</div>
                 </div>
             </div>
             <button onclick="removeHtmlFile()" class="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-500/10 transition">
                 <i class="fas fa-times"></i>
             </button>
         </div>
    `;
    updateStructurePreview();
}

function handleAssetFiles(files) {
    files.forEach(file => {
        if (file.name.endsWith('.html')) {
            alert(`"${file.name}" is an HTML file. Please add it to the Main HTML File section.`);
            return;
        }
        if (assetFiles.some(f => f.name === file.name && f.size === file.size)) {
            return;
        }
        assetFiles.push(file);
    });
    renderAssetFiles();
    updateStructurePreview();
}

function renderAssetFiles() {
    elements.assetsFileList.innerHTML = '';
    assetFiles.forEach((file, index) => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item flex items-center justify-between glass-card p-3 rounded-lg border border-green-500/30';
        
        const assignedFolder = fileToFolderMapping[file.name] || 'root';
        const folderOptions = customFolders.length > 0 ?
            `<select onchange="assignFileToFolder('${file.name}', this.value)" class="bg-gray-800 text-white text-xs px-2 py-1 rounded ml-2 border border-gray-600">
                 <option value="root" ${assignedFolder === 'root' ? 'selected' : ''}>📁 Root</option>
                        ${customFolders.map(folder => 
            `<option value="${folder}" ${assignedFolder === folder ? 'selected' : ''}>📁 ${folder}</option>`
                        ).join('')}
                    </select>` :
            '<span class="text-xs text-gray-500 ml-2">📁 Root</span>';
        
        fileElement.innerHTML = `
            <div class="flex items-center flex-1">
                ${getFileIcon(file.name)}
                <div class="flex-1">
                    <div class="font-medium text-white text-sm">${file.name}</div>
                    <div class="text-xs text-gray-500">${formatFileSize(file.size)}</div>
                 </div>
                 ${folderOptions}
            </div>
            <button onclick="removeAssetFile(${index})" class="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-500/10 transition ml-2">
                <i class="fas fa-times"></i>
            </button>
        `;
        elements.assetsFileList.appendChild(fileElement);
    });
    elements.fileCount.textContent = `${assetFiles.length} file(s) added`;
}

// Folder Management Functions
function createFolder() {
    if (customFolders.length >= 50) {
        alert('⚠️ Maximum folder limit reached (50 folders)');
        return;
    }
    
    const folderName = prompt('Enter folder name (e.g., "img", "css", or "img/icons" for nested):');
    
    if (!folderName) return;
    
    // Validate folder name
    const trimmedName = folderName.trim();
    if (!trimmedName) {
        alert('⚠️ Folder name cannot be empty');
        return;
    }
    
    // Check for invalid characters
    if (/[<>:"|?*\x00-\x1F]/.test(trimmedName)) {
        alert('⚠️ Folder name contains invalid characters');
        return;
    }
    
    // Check if folder already exists
    if (customFolders.includes(trimmedName)) {
        alert('⚠️ Folder already exists');
        return;
    }
    
    customFolders.push(trimmedName);
    renderFolders();
    renderAssetFiles(); // Re-render files to show new folder option
    updateStructurePreview();
    
    gsap.from(`#folder-${customFolders.length - 1}`, { duration: 0.3, scale: 0.8, opacity: 0 });
}

function createSubfolder(parentFolder) {
    if (customFolders.length >= 50) {
        alert('⚠️ Maximum folder limit reached (50 folders)');
        return;
    }
    
    const subfolderName = prompt(`Create subfolder inside "${parentFolder}":\n\nEnter subfolder name (e.g., "icons", "thumbnails"):`);
    
    if (!subfolderName) return;
    
    // Validate subfolder name
    const trimmedName = subfolderName.trim();
    if (!trimmedName) {
        alert('⚠️ Folder name cannot be empty');
        return;
    }
    
    // Check for invalid characters
    if (/[<>:"|?*\x00-\x1F\/\\]/.test(trimmedName)) {
        alert('⚠️ Folder name contains invalid characters (no slashes allowed in subfolder names)');
        return;
    }
    
    // Create full path
    const fullPath = `${parentFolder}/${trimmedName}`;
    
    // Check if folder already exists
    if (customFolders.includes(fullPath)) {
        alert('⚠️ Subfolder already exists');
        return;
    }
    
    customFolders.push(fullPath);
    renderFolders();
    renderAssetFiles();
    updateStructurePreview();
    
    gsap.from(`#folder-${customFolders.length - 1}`, { duration: 0.3, scale: 0.8, opacity: 0 });
}

window.createSubfolder = createSubfolder;

function renderFolders() {
    elements.folderCount.textContent = customFolders.length;
    
    if (customFolders.length === 0) {
        elements.folderList.innerHTML = '<p class="text-gray-500 text-sm">No folders created yet. Click "Create Folder" to add one.</p>';
        return;
    }
    
    // Sort folders to show parent folders before their subfolders
    const sortedFolders = [...customFolders].sort((a, b) => {
        const aDepth = (a.match(/\//g) || []).length;
        const bDepth = (b.match(/\//g) || []).length;
        if (aDepth !== bDepth) return aDepth - bDepth;
        return a.localeCompare(b);
    });
    
    elements.folderList.innerHTML = '';
    sortedFolders.forEach((folder, displayIndex) => {
        const actualIndex = customFolders.indexOf(folder);
        const depth = (folder.match(/\//g) || []).length;
        const folderName = folder.split('/').pop();
        const indent = depth * 20;
        
        const folderElement = document.createElement('div');
        folderElement.id = `folder-${actualIndex}`;
        folderElement.className = 'glass-card p-4 rounded-lg border border-yellow-500/30 space-y-3';
        folderElement.style.marginLeft = `${indent}px`;
        
        folderElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center flex-1">
                    <i class="fas fa-folder${depth > 0 ? '' : '-open'} text-yellow-400 text-lg mr-3"></i>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-white font-medium">${folderName}</span>
                            ${depth > 0 ? `<span class="text-xs text-gray-500">in ${folder.substring(0, folder.lastIndexOf('/'))}</span>` : ''}
                        </div>
                        <span class="text-xs text-gray-500">(${countFilesInFolder(folder)} files)</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="createSubfolder('${folder}')" class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded text-xs transition border border-blue-500/30" title="Create subfolder">
                        <i class="fas fa-folder-plus"></i>
                    </button>
                    <button onclick="removeFolder(${actualIndex})" class="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-500/10 transition">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
            
            <!-- Upload to Folder Section -->
            <div class="border-t border-gray-700 pt-3">
                <div class="flex items-center gap-2">
                    <button onclick="selectFilesForFolder('${folder}')" class="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-2 rounded text-sm transition border border-green-500/30">
                        <i class="fas fa-file-upload mr-2"></i>Files
                    </button>
                    <button onclick="selectFolderForFolder('${folder}')" class="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-2 rounded text-sm transition border border-purple-500/30">
                        <i class="fas fa-folder-open mr-2"></i>Folder
                    </button>
                </div>
                <input type="file" id="folderUpload-${actualIndex}" class="hidden" multiple data-folder="${folder}">
                <input type="file" id="folderDirUpload-${actualIndex}" class="hidden" webkitdirectory directory multiple data-folder="${folder}">
            </div>
            
            <!-- Files in this folder -->
            <div id="folderFiles-${actualIndex}" class="space-y-1"></div>
                `;
        elements.folderList.appendChild(folderElement);
        
        // Render files in this folder
        renderFilesInFolder(folder, actualIndex);
        
        // Add event listeners for the file inputs
        document.getElementById(`folderUpload-${actualIndex}`).addEventListener('change', (e) => {
            handleFolderSpecificUpload(e, folder);
        });
        document.getElementById(`folderDirUpload-${actualIndex}`).addEventListener('change', (e) => {
            handleFolderSpecificUpload(e, folder);
        });
    });
    
    // Update button state
    if (customFolders.length >= 50) {
        elements.createFolderBtn.disabled = true;
        elements.createFolderBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        elements.createFolderBtn.disabled = false;
        elements.createFolderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function renderFilesInFolder(folder, folderIndex) {
    const filesInFolder = assetFiles.filter(file => fileToFolderMapping[file.name] === folder);
    const container = document.getElementById(`folderFiles-${folderIndex}`);
    
    if (filesInFolder.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-600 italic">No files in this folder yet</p>';
        return;
    }
    
    container.innerHTML = '';
    filesInFolder.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded text-xs';
        fileDiv.innerHTML = `
            <div class="flex items-center flex-1">
                ${getFileIcon(file.name)}
                <span class="text-gray-300">${file.name}</span>
                <span class="text-gray-600 ml-2">(${formatFileSize(file.size)})</span>
            </div>
            <button onclick="removeFileFromFolder('${file.name}')" class="text-red-400 hover:text-red-300">
                <i class="fas fa-times text-xs"></i>
            </button>
        `;
        container.appendChild(fileDiv);
    });
}

window.selectFilesForFolder = function(folder) {
    const index = customFolders.indexOf(folder);
    document.getElementById(`folderUpload-${index}`).click();
};

window.selectFolderForFolder = function(folder) {
    const index = customFolders.indexOf(folder);
    document.getElementById(`folderDirUpload-${index}`).click();
};

function handleFolderSpecificUpload(event, targetFolder) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (file.name.endsWith('.html')) {
            alert(`"${file.name}" is an HTML file. Please add it to the Main HTML File section.`);
            return;
        }
        
        // Check if file already exists
        const existingFileIndex = assetFiles.findIndex(f => f.name === file.name);
        
        if (existingFileIndex !== -1) {
            // Update existing file's folder assignment
            fileToFolderMapping[file.name] = targetFolder;
        } else {
            // Add new file and assign to folder
            assetFiles.push(file);
            fileToFolderMapping[file.name] = targetFolder;
        }
    });
    
    renderAssetFiles();
    renderFolders();
    updateStructurePreview();
    
    // Reset input
    event.target.value = '';
}

window.removeFileFromFolder = function(fileName) {
    const fileIndex = assetFiles.findIndex(f => f.name === fileName);
    if (fileIndex !== -1) {
        assetFiles.splice(fileIndex, 1);
        delete fileToFolderMapping[fileName];
        renderAssetFiles();
        renderFolders();
        updateStructurePreview();
    }
};

function countFilesInFolder(folderPath) {
    return Object.values(fileToFolderMapping).filter(path => path === folderPath).length;
}

window.removeFolder = function(index) {
    const folderToRemove = customFolders[index];
    
    // Check if there are subfolders
    const subfolders = customFolders.filter(f => f.startsWith(folderToRemove + '/'));
    
    if (subfolders.length > 0) {
        if (!confirm(`This folder contains ${subfolders.length} subfolder(s). All subfolders and their files will be moved to root. Continue?`)) {
            return;
        }
    }
    
    // Ask for confirmation if folder has files
    const filesInFolder = countFilesInFolder(folderToRemove);
    if (filesInFolder > 0) {
        if (!confirm(`This folder contains ${filesInFolder} file(s). Files will be moved to root. Continue?`)) {
            return;
        }
    }
    
    // Remove folder and all its subfolders
    const foldersToRemove = [folderToRemove, ...subfolders];
    
    foldersToRemove.forEach(folder => {
        const idx = customFolders.indexOf(folder);
        if (idx !== -1) {
            customFolders.splice(idx, 1);
        }
        
        // Move files from deleted folder to root
        Object.keys(fileToFolderMapping).forEach(fileName => {
            if (fileToFolderMapping[fileName] === folder) {
                fileToFolderMapping[fileName] = 'root';
            }
        });
    });
    
    renderFolders();
    renderAssetFiles();
    updateStructurePreview();
};

window.assignFileToFolder = function(fileName, folderPath) {
    fileToFolderMapping[fileName] = folderPath;
    updateStructurePreview();
};

window.removeHtmlFile = function() {
    htmlFile = null;
    elements.htmlFileList.innerHTML = '';
    elements.htmlFileInput.value = '';
    updateStructurePreview();
};

window.removeAssetFile = function(index) {
    assetFiles.splice(index, 1);
    renderAssetFiles();
    updateStructurePreview();
};

function clearAll() {
    htmlFile = null;
    assetFiles = [];
    customFolders = [];
    fileToFolderMapping = {};
    elements.htmlFileList.innerHTML = '';
    elements.assetsFileList.innerHTML = '';
    elements.htmlFileInput.value = '';
    elements.assetsFileInput.value = '';
    elements.folderInput.value = '';
    elements.fileCount.textContent = '';
    renderFolders();
    updateStructurePreview();
}

// File Icon Helper
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        css: 'fab fa-css3-alt text-blue-400 text-xl ml-2 mr-2',
        js: 'fab fa-js text-yellow-400 text-xl ml-2 mr-2',
        png: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        jpg: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        jpeg: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        gif: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        svg: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        webp: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        ico: 'far fa-image text-purple-400 text-xl ml-2 mr-2',
        json: 'fas fa-file-code text-orange-400 text-xl ml-2 mr-2',
        txt: 'far fa-file-lines text-gray-400 text-xl ml-2 mr-2',
        pdf: 'far fa-file-pdf text-red-400 text-xl ml-2 mr-2',
        md: 'fab fa-markdown text-blue-400 text-xl ml-2 mr-2',
        woff: 'fas fa-font text-gray-400 text-xl ml-2 mr-2',
        woff2: 'fas fa-font text-gray-400 text-xl ml-2 mr-2',
        ttf: 'fas fa-font text-gray-400 text-xl ml-2 mr-2',
        otf: 'fas fa-font text-gray-400 text-xl ml-2 mr-2',
        py: 'fab fa-python text-yellow-500 text-xl ml-2',
        jsx: 'fab fa-react text-blue-400 text-xl mr-2 ml-2',
        ts: 'devicon-react-plain colored text-xl mr-2 ml-2'
    };
    return `<i class="${icons[ext] || 'far fa-file text-gray-500 text-xl mr-3'}"></i>`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Structure Preview
function updateStructurePreview() {
    const siteName = elements.siteNameInput.value || 'website-name';
    elements.siteFolderPreview.textContent = siteName;
    
    let filesHTML = '';
    
    // Show index.html
    if (htmlFile) {
        filesHTML += `
            <div class="flex items-center py-1">
                <span class="text-gray-500">├─ </span>
                <i class="fab fa-html5 text-orange-400 mx-2"></i>
                <span class="text-blue-300">index.html</span>
                <span class="text-gray-500 text-xs ml-2">(${formatFileSize(htmlFile.size)})</span>
            </div>
        `;
    }
    
    // Sort folders to show hierarchy properly
    const sortedFolders = [...customFolders].sort((a, b) => {
        const aDepth = (a.match(/\//g) || []).length;
        const bDepth = (b.match(/\//g) || []).length;
        if (aDepth !== bDepth) return aDepth - bDepth;
        return a.localeCompare(b);
    });
    
    // Show custom folders and their files
    sortedFolders.forEach((folder, folderIndex) => {
        const filesInFolder = assetFiles.filter(file => fileToFolderMapping[file.name] === folder);
        const depth = (folder.match(/\//g) || []).length;
        const indent = '    '.repeat(depth);
        const folderName = folder.split('/').pop();
        
        filesHTML += `
            <div class="flex items-center py-1" style="margin-left: ${depth * 16}px">
                <span class="text-gray-500">├─ </span>
                <i class="fas fa-folder-open text-yellow-400 mx-2"></i>
                <span class="text-yellow-300">${folderName}/</span>
                <span class="text-gray-500 text-xs ml-2">(${filesInFolder.length} files)</span>
            </div>
        `;
        
        // Show files in this folder
        filesInFolder.forEach((file, fileIndex) => {
            const isLast = fileIndex === filesInFolder.length - 1;
            filesHTML += `
                <div class="flex items-center py-1" style="margin-left: ${(depth + 1) * 16}px">
                    <span class="text-gray-500">${isLast ? '└─' : '├─'} </span>
                    ${getFileIcon(file.name)}
                    <span class="text-gray-300">${file.name}</span>
                    <span class="text-gray-500 text-xs ml-2">(${formatFileSize(file.size)})</span>
                </div>
            `;
        });
    });
    
    // Show files in root (not assigned to any folder)
    const rootFiles = assetFiles.filter(file => !fileToFolderMapping[file.name] || fileToFolderMapping[file.name] === 'root');
    rootFiles.forEach((file, index) => {
        const isLast = index === rootFiles.length - 1 && sortedFolders.length === 0 && !htmlFile;
        filesHTML += `
            <div class="flex items-center py-1">
                <span class="text-gray-500">${isLast ? '└─' : '├─'} </span>
                ${getFileIcon(file.name)}
                <span class="text-gray-300">${file.name}</span>
                <span class="text-gray-500 text-xs ml-2">(${formatFileSize(file.size)})</span>
            </div>
        `;
    });
    
    elements.filesPreview.innerHTML = filesHTML || '<div class="text-gray-500">No files added yet</div>';
}

// Progress
function updateProgress(percent, message) {
    elements.progressContainer.classList.remove('hidden');
    elements.progressBar.style.width = percent + '%';
    elements.progressText.textContent = message;
}

function hideProgress() {
    elements.progressContainer.classList.add('hidden');
}

// Deploy Function
async function deploy() {
    const siteName = elements.siteNameInput.value.trim();
    
    if (!siteName) {
        showResult('⚠️ Please enter a website folder name.', 'error');
        return;
    }
    
    if (!htmlFile) {
        showResult('⚠️ Please add an HTML file to deploy.', 'error');
        return;
    }
    
    elements.deployBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Deploying...';
    elements.deployBtn.disabled = true;
    
    try {
        updateProgress(10, 'Checking repository...');
        await createOrGetRepository();
        
        updateProgress(30, 'Uploading files...');
        await uploadFiles(siteName);
        
        updateProgress(70, 'Enabling GitHub Pages...');
        await enablePages();
        
        updateProgress(90, 'Generating URL...');
        const pagesUrl = await getPagesUrl(siteName);
        const netlifyUrl = `https://${NETLIFY_BASE}.netlify.app/${REPO_PATH}/${siteName}`;
        
        updateProgress(100, 'Deployment complete!');
        
        setTimeout(() => {
            hideProgress();
            showResult(`
                <div class="space-y-4">
                    <div class="flex items-center text-green-400 font-medium text-lg">
                        <i class="fas fa-check-circle mr-2 text-2xl"></i>
                        Successfully deployed!
                    </div>
                    <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-lg border border-blue-500/30">
                        <p class="font-medium mb-3 text-gray-300">Your site is live at:</p>
                        <p class="mb-0.5 text-gray-300">Pages:</p>
                        <a href="${pagesUrl}" target="_blank" class="text-blue-400 hover:text-blue-300 underline break-all text-lg font-semibold flex items-center">
                            ${pagesUrl}
                            <i class="fas fa-external-link-alt ml-2 text-sm"></i>
                        </a><br />
                        <p class="mb-0.5 text-gray-300">Netlify:</p>
                        <a href="${netlifyUrl}" target="_blank" class="text-blue-400 hover:text-blue-300 underline break-all text-lg font-semibold flex items-center">
                            ${netlifyUrl}
                            <i class="fas fa-external-link-alt ml-2 text-sm"></i>
                        </a>
                        <button onclick="window.open('${pagesUrl}', '_blank')" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition w-full">
                            <i class="fas fa-rocket mr-2"></i>
                            Visit Your Site
                        </button>
                    </div>
                    <div class="glass-card p-6 rounded-lg border border-gray-700">
                        <p class="font-medium mb-3 text-gray-300">
                            <i class="fas fa-info-circle text-blue-400 mr-2"></i>
                            Deployment Details:
                        </p>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li class="flex items-start">
                                <i class="fas fa-folder text-yellow-400 mr-2 mt-1"></i>
                                <span><strong class="text-gray-300">Site Folder:</strong> <code class="bg-gray-800 px-2 py-1 rounded text-blue-300">public/${siteName}/</code></span>
                            </li>
                            <li class="flex items-start">
                                <i class="fab fa-html5 text-orange-400 mr-2 mt-1"></i>
                                <span><strong class="text-gray-300">Main HTML:</strong> <code class="bg-gray-800 px-2 py-1 rounded text-blue-300">${htmlFile.name}</code> → <code class="bg-gray-800 px-2 py-1 rounded text-blue-300">index.html</code></span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-file text-green-400 mr-2 mt-1"></i>
                                <span><strong class="text-gray-300">Additional Files:</strong> ${assetFiles.length} file(s)</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-clock text-purple-400 mr-2 mt-1"></i>
                                <span><strong class="text-gray-300">Deployed:</strong> ${new Date().toLocaleString()}</span>
                            </li>
                        </ul>
                    </div>
                    <div class="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                        <p class="text-sm text-yellow-300">
                            <i class="fas fa-clock mr-2"></i>
                            <strong>Note:</strong> It may take 1-2 minutes for your site to be fully accessible.
                        </p>
                    </div>
                </div>
            `, 'success');
            
            gsap.from('#results', { duration: 0.5, scale: 0.9, opacity: 0 });
        }, 500);
        
    } catch (error) {
        hideProgress();
        showResult(`
            <div class="space-y-3">
                <div class="flex items-center text-red-400 font-medium">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Deployment failed
                </div>
                <div class="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <p class="text-sm text-red-300">${error.message}</p>
                </div>
                <div class="text-sm text-gray-400">
                    <p class="font-medium mb-2 text-gray-300">Common issues:</p>
                    <ul class="list-disc list-inside space-y-1">
                        <li>Invalid GitHub token</li>
                        <li>Repository doesn't exist or no access</li>
                        <li>Network connection problems</li>
                        <li>File size limits exceeded</li>
                    </ul>
                </div>
            </div>
        `, 'error');
    } finally {
        elements.deployBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i> Deploy to GitHub Pages';
        elements.deployBtn.disabled = false;
    }
}

// GitHub API Functions
async function getUsername() {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid GitHub token. Please check your configuration.');
        }
        
        const userData = await response.json();
        return userData.login;
    } catch (error) {
        throw new Error('Failed to authenticate with GitHub. Please check your token.');
    }
}

async function createOrGetRepository() {
    const username = await getUsername();
    
    const getResponse = await fetch(`https://api.github.com/repos/${username}/${REPOSITORY_NAME}`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (getResponse.ok) {
        return await getResponse.json();
    }
    
    const createResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: REPOSITORY_NAME,
            description: 'Deployed via GitHub HTML Deployer Pro',
            private: false,
            auto_init: true
        })
    });
    
    if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create repository');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await createResponse.json();
}

async function uploadFiles(siteName) {
    const basePath = `public/${siteName}`;
    const totalFiles = 1 + assetFiles.length;
    let uploadedFiles = 0;
    
    // Upload HTML file
    if (htmlFile) {
        await uploadFile(`${basePath}/index.html`, htmlFile);
        uploadedFiles++;
        updateProgress(30 + (uploadedFiles / totalFiles) * 40, `Uploading files... (${uploadedFiles}/${totalFiles})`);
    }
    
    // Create folders first (create empty .gitkeep files to ensure folders exist)
    for (const folder of customFolders) {
        const gitkeepContent = btoa('# This file keeps the folder in git');
        const username = await getUsername();
        
        await fetch(`https://api.github.com/repos/${username}/${REPOSITORY_NAME}/contents/${basePath}/${folder}/.gitkeep`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Create folder ${folder}`,
                content: gitkeepContent
            })
        });
    }
    
    // Upload asset files to their assigned folders
    for (const file of assetFiles) {
        const folderPath = fileToFolderMapping[file.name];
        const filePath = folderPath && folderPath !== 'root' ?
            `${basePath}/${folderPath}/${file.name}` :
            `${basePath}/${file.name}`;
        
        await uploadFile(filePath, file);
        uploadedFiles++;
        updateProgress(30 + (uploadedFiles / totalFiles) * 40, `Uploading files... (${uploadedFiles}/${totalFiles})`);
    }
}

async function uploadFile(path, file) {
    const username = await getUsername();
    const content = await readFileAsBase64(file);
    
    const response = await fetch(`https://api.github.com/repos/${username}/${REPOSITORY_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Deploy ${path}`,
            content: content
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload ${path}: ${error.message}`);
    }
    
    return await response.json();
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function enablePages() {
    const username = await getUsername();
    const response = await fetch(`https://api.github.com/repos/${username}/${REPOSITORY_NAME}/pages`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            source: {
                branch: 'main',
                path: '/'
            }
        })
    });
    
    if (!response.ok && response.status !== 409) {
        throw new Error('Failed to enable GitHub Pages');
    }
}

async function getPagesUrl(siteName) {
    const username = await getUsername();
    await new Promise(resolve => setTimeout(resolve, 3000));
    return `https://${username}.github.io/${REPOSITORY_NAME}/public/${siteName}/`;
}

function showResult(message, type) {
    elements.resultsDiv.classList.remove('hidden');
    
    const bgColor = type === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30';
    
    elements.resultContent.innerHTML = `
        <div class="p-6 rounded-lg border ${bgColor}">
            ${message}
        </div>
    `;
    
    elements.resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize on load
init();
