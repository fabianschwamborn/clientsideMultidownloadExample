const API_BASE_URL = 'https://testfiles.xxip.de/';
const INDEX_URL = API_BASE_URL + 'index.txt';

let fileList = [];
let isDownloading = false;

// StreamSaver configuration - use local service worker
if (typeof streamSaver !== 'undefined') {
    console.info('=== StreamSaver Configuration ===');
    console.info('StreamSaver loaded: true');
    console.info('StreamSaver version: ' + (streamSaver.version || 'unknown'));
    
    // Configure StreamSaver to use local service worker
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (!isFileProtocol) {
        // Use local service worker (not the external one from jimmywarting.github.io)
        // Construct the correct path based on current location
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    const swPath = basePath + 'sw.js';
    const mitmPath = basePath + 'mitm.html';
        const versionSuffix = streamSaver && streamSaver.version && streamSaver.version.full
            ? `?version=${streamSaver.version.full}`
            : '';
        const mitmUrl = `${window.location.origin}${mitmPath}${versionSuffix}`;

    streamSaver.mitm = mitmUrl;
    console.info('✓ StreamSaver configured with local service worker');
    console.info('  Base path: ' + basePath);
    console.info('  SW path: ' + swPath);
    console.info('  MITM path: ' + mitmPath);
    console.info('  MITM url: ' + mitmUrl);
        
        // Register service worker if not already registered
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(swPath, { scope: basePath })
                .then(registration => {
                    console.info('✓ Service Worker registered');
                    console.info('  Scope: ' + registration.scope);
                    console.info('  Active: ' + (registration.active ? 'yes' : 'no'));
                    console.info('  Installing: ' + (registration.installing ? 'yes' : 'no'));
                })
                .catch(error => {
                    console.error('✗ Service Worker registration failed:', error);
                    console.error('  Error type: ' + error.constructor.name);
                    console.error('  Error message: ' + error.message);
                    console.warn('Will fall back to blob method if needed');
                });
        } else {
            console.warn('⚠ Service Workers not supported in this browser');
        }
    } else {
        // file:// protocol - disable StreamSaver mitm completely
        streamSaver.mitm = '';
        console.warn('⚠ File protocol detected - StreamSaver mitm disabled');
        console.info('Will use blob download method instead');
    }
} else {
    console.warn('StreamSaver not loaded!');
}

// Debug Console Functions
const debugOutput = [];
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

function addDebugLog(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    debugOutput.push({ message: logEntry, type });
    
    const debugDiv = document.getElementById('debugOutput');
    if (debugDiv) {
        const logElement = document.createElement('div');
        logElement.className = `debug-log ${type}`;
        logElement.textContent = logEntry;
        debugDiv.appendChild(logElement);
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }
}

// Override console methods to capture output
console.log = function(...args) {
    originalConsole.log.apply(console, args);
    addDebugLog(args.join(' '), 'log');
};

console.error = function(...args) {
    originalConsole.error.apply(console, args);
    addDebugLog(args.join(' '), 'error');
};

console.warn = function(...args) {
    originalConsole.warn.apply(console, args);
    addDebugLog(args.join(' '), 'warn');
};

console.info = function(...args) {
    originalConsole.info.apply(console, args);
    addDebugLog(args.join(' '), 'info');
};

// Capture unhandled errors
window.addEventListener('error', (event) => {
    addDebugLog(`Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    addDebugLog(`Unhandled Promise Rejection: ${event.reason}`, 'error');
});

function clearDebugConsole() {
    debugOutput.length = 0;
    const debugDiv = document.getElementById('debugOutput');
    if (debugDiv) {
        debugDiv.innerHTML = '';
    }
}

// Prevent page closure during download
window.addEventListener('beforeunload', (event) => {
    if (isDownloading) {
        event.preventDefault();
        event.returnValue = 'Download in progress! Are you sure you want to leave?';
        return event.returnValue;
    }
});

// Load file list when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.info('=== Application Starting ===');
    console.info('User Agent: ' + navigator.userAgent);
    console.info('Platform: ' + navigator.platform);
    console.info('Language: ' + navigator.language);
    console.info('Online: ' + navigator.onLine);
    console.info('Connection Type: ' + (navigator.connection ? navigator.connection.effectiveType : 'unknown'));
    
    // Detect mobile browser
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.info('Is Mobile Device: ' + isMobile);
    console.info('Screen size: ' + window.screen.width + 'x' + window.screen.height);
    console.info('Viewport size: ' + window.innerWidth + 'x' + window.innerHeight);
    
    // Page loading context
    console.info('=== Page Context ===');
    console.info('Current URL: ' + window.location.href);
    console.info('Protocol: ' + window.location.protocol);
    console.info('Host: ' + window.location.host);
    console.info('Origin: ' + window.location.origin);
    console.info('Is File Protocol: ' + (window.location.protocol === 'file:'));
    console.info('Is HTTPS: ' + (window.location.protocol === 'https:'));
    console.info('Is Localhost: ' + (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
    
    // Browser capabilities
    console.info('=== Browser Capabilities ===');
    console.info('Fetch API available: ' + (typeof fetch !== 'undefined'));
    console.info('ReadableStream available: ' + (typeof ReadableStream !== 'undefined'));
    console.info('Service Worker available: ' + ('serviceWorker' in navigator));
    console.info('File System Access API: ' + ('showSaveFilePicker' in window));
    
    console.info('Page loaded, initializing...');
    
    // Pre-flight connectivity test for mobile
    if (isMobile) {
        console.info('=== Mobile Pre-Flight Check ===');
        testConnectivity();
    }
    
    loadFileList();
});

async function testConnectivity() {
    console.info('Testing connectivity to server...');
    
    // Test 1: Simple HEAD request
    try {
        console.info('Test 1: HEAD request to server root...');
        const headResponse = await fetch('https://testfiles.xxip.de/', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        console.info('✓ Server is reachable (no-cors mode)');
    } catch (e) {
        console.error('✗ Server HEAD request failed: ' + e.message);
    }
    
    // Test 2: Check DNS resolution
    try {
        console.info('Test 2: Attempting direct fetch without options...');
        const testFetch = await fetch('https://testfiles.xxip.de/index.txt');
        console.info('✓ Direct fetch successful');
        console.info('Response type: ' + testFetch.type);
        console.info('Response status: ' + testFetch.status);
    } catch (e) {
        console.error('✗ Direct fetch failed: ' + e.message);
        console.error('This suggests DNS or network connectivity issue');
    }
}

async function loadFileList() {
    console.info('=== Starting File List Load ===');
    console.info('Target URL: ' + INDEX_URL);
    console.info('Current origin: ' + window.location.origin);
    console.info('Current protocol: ' + window.location.protocol);
    console.info('Target origin: ' + new URL(INDEX_URL).origin);
    console.info('CORS mode will be used');
    
    let response;
    
    try {
        console.info('Attempting fetch with CORS mode...');
        const fetchStart = performance.now();
        
        try {
            response = await fetch(INDEX_URL, {
                method: 'GET',
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'omit'
            });
            const fetchEnd = performance.now();
            console.info(`✓ Fetch completed in ${(fetchEnd - fetchStart).toFixed(2)}ms`);
        } catch (fetchError) {
            const fetchEnd = performance.now();
            console.error(`✗ Fetch FAILED after ${(fetchEnd - fetchStart).toFixed(2)}ms`);
            console.error('Fetch error type: ' + fetchError.constructor.name);
            console.error('Fetch error message: ' + fetchError.message);
            console.error('Fetch error stack: ' + (fetchError.stack || 'no stack'));
            
            if (fetchError instanceof TypeError) {
                console.error('=== CORS/NETWORK ERROR DETECTED ===');
                console.error('This is typically caused by:');
                console.error('1. CORS not enabled on server');
                console.error('2. Network connectivity issues');
                console.error('3. SSL/TLS certificate problems');
                console.error('4. Server not responding');
                console.error('Current page origin: ' + window.location.origin);
                console.error('Target server origin: ' + new URL(INDEX_URL).origin);
                console.error('Cross-origin request: ' + (window.location.origin !== new URL(INDEX_URL).origin));
            }
            
            throw fetchError;
        }
        
        console.info('=== Response Details ===');
        console.info('Response status: ' + response.status);
        console.info('Response statusText: ' + response.statusText);
        console.info('Response type: ' + response.type);
        console.info('Response ok: ' + response.ok);
        console.info('Response redirected: ' + response.redirected);
        console.info('Response url: ' + response.url);
        
        console.info('=== Response Headers ===');
        let headerCount = 0;
        try {
            for (const [key, value] of response.headers.entries()) {
                console.info(`  ${key}: ${value}`);
                headerCount++;
            }
            console.info(`Total headers: ${headerCount}`);
        } catch (headerError) {
            console.error('Error reading headers: ' + headerError.message);
        }
        
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.info('Reading response text...');
        const textStart = performance.now();
        let text;
        
        try {
            text = await response.text();
            const textEnd = performance.now();
            console.info(`✓ Text read completed in ${(textEnd - textStart).toFixed(2)}ms`);
        } catch (textError) {
            console.error('✗ Failed to read response text');
            console.error('Text error: ' + textError.message);
            throw textError;
        }
        
        console.info(`Text length: ${text.length} characters`);
        console.info(`First 200 chars: "${text.substring(0, 200)}"`);
        console.info(`Last 100 chars: "${text.substring(Math.max(0, text.length - 100))}"`);
        
        fileList = text.split('\n').filter(line => line.trim() !== '');
        console.info(`Parsed ${fileList.length} files from index`);
        
        if (fileList.length > 0) {
            console.info(`First file: ${fileList[0]}`);
            console.info(`Last file: ${fileList[fileList.length - 1]}`);
            console.info(`All files: ${fileList.join(', ')}`);
        } else {
            console.warn('WARNING: No files found in index!');
        }
        
        displayFileList();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('fileListContainer').style.display = 'block';
        console.info('=== File List Load Complete ===');
        
    } catch (error) {
        console.error('=== File List Load FAILED ===');
        console.error('Error type: ' + error.constructor.name);
        console.error('Error name: ' + error.name);
        console.error('Error message: ' + error.message);
        console.error('Error toString: ' + error.toString());
        
        if (error.stack) {
            console.error('Error stack:');
            const stackLines = error.stack.split('\n');
            stackLines.forEach((line, i) => {
                console.error(`  [${i}] ${line}`);
            });
        } else {
            console.error('No stack trace available');
        }
        
        // Detailed TypeError analysis
        if (error instanceof TypeError || error.name === 'TypeError') {
            console.error('=== TypeError Analysis ===');
            console.error('Most likely causes:');
            console.error('1. CORS policy blocking the request');
            console.error('2. Network connectivity issue');
            console.error('3. DNS resolution failure');
            console.error('4. Mixed content (HTTP/HTTPS) issue');
            console.error('');
            console.error('Current page: ' + window.location.href);
            console.error('Page protocol: ' + window.location.protocol);
            console.error('Target URL: ' + INDEX_URL);
            console.error('Target protocol: ' + new URL(INDEX_URL).protocol);
            console.error('Is HTTPS page: ' + (window.location.protocol === 'https:'));
            console.error('Is target HTTPS: ' + (new URL(INDEX_URL).protocol === 'https:'));
            console.error('');
            console.error('Recommended fixes:');
            console.error('- Ensure server has CORS headers: Access-Control-Allow-Origin');
            console.error('- Check if URL is accessible in browser directly');
            console.error('- Verify SSL certificate if using HTTPS');
        }
        
        // Network status check
        console.error('=== Network Status ===');
        console.error('Navigator online: ' + navigator.onLine);
        if (navigator.connection) {
            console.error('Connection type: ' + navigator.connection.effectiveType);
            console.error('Downlink: ' + navigator.connection.downlink + ' Mbps');
            console.error('RTT: ' + navigator.connection.rtt + ' ms');
        }
        
        showError('Failed to load file list: ' + error.message + ' (Check debug console below for details)');
        document.getElementById('loading').style.display = 'none';
    }
}

function displayFileList() {
    const container = document.getElementById('fileList');
    container.innerHTML = '';
    
    console.info('Displaying file list in UI...');
    
    fileList.forEach((fileName, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <input type="checkbox" class="file-checkbox" id="file_${index}" data-filename="${fileName}">
            <label for="file_${index}" class="file-name">${fileName}</label>
        `;
        
        container.appendChild(fileItem);
    });
    
    console.info('File list displayed successfully');
    
    // Update method info based on current browser capabilities
    updateMethodInfo();
}

function updateMethodInfo() {
    const useFileSystemAPI = document.getElementById('useFileSystemAPI');
    const forceBlobFallback = document.getElementById('forceBlobFallback');
    if (!useFileSystemAPI || !forceBlobFallback) return;
    
    const supportsFileSystemAccess = 'showSaveFilePicker' in window;
    const hasStreamSaver = typeof streamSaver !== 'undefined';
    const hasWritableStream = typeof WritableStream !== 'undefined';
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    let message = '';
    let type = 'info';
    
    // Force blob fallback is checked - override everything
    if (forceBlobFallback.checked) {
        message = '⚠ BLOB METHOD FORCED - High memory usage, may fail with large files!';
        type = 'warning';
        showBlobWarning();
        showMethodInfo(message, type);
        return;
    }
    
    // Hide blob warning if not forced
    hideBlobWarning();
    
    // Checkbox is checked - user wants File System API
    if (useFileSystemAPI.checked) {
        if (supportsFileSystemAccess && !isMobile) {
            message = '✓ Will use File System Access API - You will choose where to save';
            type = 'success';
        } else if (isMobile) {
            message = '⚠ File System API not available on mobile - Will use StreamSaver direct download';
            type = 'warning';
        } else {
            message = '⚠ File System API not supported - Will use StreamSaver direct download';
            type = 'warning';
        }
    } 
    // Checkbox unchecked - direct streaming
    else {
        if (hasStreamSaver && hasWritableStream) {
            message = '✓ Will use StreamSaver - Direct streaming download (no dialog)';
            type = 'success';
        } else {
            message = '⚠ StreamSaver not available - Will use blob method (higher memory usage)';
            type = 'warning';
        }
    }
    
    showMethodInfo(message, type);
}

// Add event listener for checkbox change
document.addEventListener('DOMContentLoaded', function() {
    const checkbox = document.getElementById('useFileSystemAPI');
    if (checkbox) {
        checkbox.addEventListener('change', updateMethodInfo);
    }
    
    const forceBlobCheckbox = document.getElementById('forceBlobFallback');
    if (forceBlobCheckbox) {
        forceBlobCheckbox.addEventListener('change', updateMethodInfo);
    }
});

function selectAll() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    console.info('All files selected');
}

function selectNone() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    console.info('All files deselected');
}

function getSelectedFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.filename);
}

async function downloadSelected() {
    const selectedFiles = getSelectedFiles();
    
    if (selectedFiles.length === 0) {
        alert('Please select at least one file.');
        return;
    }

    if (isDownloading) {
        console.warn('Download already in progress, ignoring request');
        return;
    }

    console.info(`=== Starting Download of ${selectedFiles.length} file(s) ===`);
    console.info('Selected files: ' + selectedFiles.join(', '));
    isDownloading = true;
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('progress').style.display = 'block';
    hideError();
    hideBlobWarning();

    try {
        // Special case: Single file - download directly without zipping
        if (selectedFiles.length === 1) {
            console.info('Single file selected - downloading directly (no ZIP)');
            await downloadSingleFile(selectedFiles[0]);
        } else {
            // Multiple files - create ZIP
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-').replace(/-/g, '');
            const zipFileName = `${timestamp}-batchload.zip`;

            console.info(`ZIP filename: ${zipFileName}`);
            await streamZipDownload(selectedFiles, zipFileName);
        }

    } catch (error) {
        showError('Download error: ' + error.message);
        console.error('=== Download FAILED ===');
        console.error('Error:', error);
    } finally {
        isDownloading = false;
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
        }
        console.info('=== Download Process Completed ===');
        setTimeout(() => {
            const progress = document.getElementById('progress');
            if (progress) {
                progress.style.display = 'none';
            }
            hideBlobWarning();
        }, 3000);
    }
}

// Download a single file directly (without ZIP) with "singlefile_" prefix
async function downloadSingleFile(fileName) {
    console.info(`=== Downloading single file: ${fileName} ===`);
    
    const newFileName = 'singlefile_' + fileName;
    console.info(`New filename: ${newFileName}`);
    
    // Update progress display
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    console.info('Progress elements check:');
    console.info('  progressText element: ' + (progressText ? 'found' : 'NULL'));
    console.info('  progressFill element: ' + (progressFill ? 'found' : 'NULL'));
    
    if (progressText) {
        progressText.textContent = `Downloading: ${fileName}`;
    } else {
        console.error('ERROR: progressText element not found!');
    }
    
    if (progressFill) {
        progressFill.style.width = '0%';
    } else {
        console.error('ERROR: progressFill element not found!');
    }
    
    try {
        // Check if File System Access API is available and user wants it
        const useFileSystemAPI = document.getElementById('useFileSystemAPI').checked;
        const supportsFileSystemAccess = 'showSaveFilePicker' in window;
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const forceBlobFallback = document.getElementById('forceBlobFallback').checked;
        
        if (forceBlobFallback) {
            console.warn('⚠ Blob fallback forced - using blob method for single file');
            showMethodInfo('⚠ Single file via Blob (forced)', 'warning');
            showBlobWarning();
            await downloadSingleFileViaBlob(fileName, newFileName);
            return;
        }

        let lastError = null;

        // Try File System Access API first if available and user wants it
        if (useFileSystemAPI && supportsFileSystemAccess && !isMobile) {
            try {
                console.info('Using File System Access API for single file');
                showMethodInfo('✓ Single file via File System API', 'success');
                await downloadSingleFileViaFileSystemAPI(fileName, newFileName);
                return;
            } catch (error) {
                lastError = error;
                console.warn('File System Access API failed, will try StreamSaver next:', error.message);
            }
        }

        // Try StreamSaver for direct download
        if (typeof streamSaver !== 'undefined') {
            try {
                console.info('Using StreamSaver for single file');
                showMethodInfo('✓ Single file via StreamSaver', 'success');
                await downloadSingleFileViaStreamSaver(fileName, newFileName);
                return;
            } catch (error) {
                lastError = error;
                console.warn('StreamSaver failed for single file, falling back:', error.message);
            }
        }

        // Fallback to blob
        console.warn('Using blob fallback for single file');
        const fallbackMessage = lastError ? `⚠ Single file via Blob (fallback). Reason: ${lastError.message}` : '⚠ Single file via Blob (fallback)';
        showMethodInfo(fallbackMessage, 'warning');
        showBlobWarning();
        await downloadSingleFileViaBlob(fileName, newFileName);
        
    } catch (error) {
        console.error('Single file download error:', error);
        throw error;
    }
}

// Download single file using File System Access API
async function downloadSingleFileViaFileSystemAPI(fileName, newFileName) {
    console.info('Requesting file save location...');
    
    // Get file extension from original filename
    const fileExtension = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    
    const fileHandle = await window.showSaveFilePicker({
        suggestedName: newFileName,
        types: fileExtension ? [{
            description: 'Downloaded File',
            accept: { '*/*': [fileExtension] }
        }] : undefined
    });
    
    const writableStream = await fileHandle.createWritable();
    
    const response = await fetch(API_BASE_URL + fileName);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    let receivedLength = 0;
    
    while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        await writableStream.write(value);
        receivedLength += value.length;
        
        if (contentLength > 0) {
            const progress = Math.round((receivedLength / contentLength) * 100);
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill) progressFill.style.width = progress + '%';
            if (progressText) progressText.textContent = `Progress: ${progress}%`;
        }
    }
    
    await writableStream.close();
    console.info('✓ Single file download complete (File System API)');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    if (progressText) progressText.textContent = 'Download complete!';
    if (progressFill) progressFill.style.width = '100%';
}

// Download single file using StreamSaver
async function downloadSingleFileViaStreamSaver(fileName, newFileName) {
    console.info('Creating StreamSaver stream for single file...');

    const response = await fetch(API_BASE_URL + fileName);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
        throw new Error('ReadableStream not available on fetch response');
    }

    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    const contentLengthHeader = response.headers.get('content-length');
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
    const streamOptions = contentLength > 0 ? { size: contentLength } : undefined;
    const writableStream = streamSaver.createWriteStream(newFileName, streamOptions);

    let receivedLength = 0;
    let firstChunkReceived = false;

    const stallAbortController = new AbortController();
    const stallTimeout = setTimeout(() => {
        if (!firstChunkReceived) {
            console.warn('StreamSaver handshake stalled after 5s - aborting to trigger fallback');
            stallAbortController.abort();
        }
    }, 5000);

    const updateProgress = (loaded) => {
        if (contentLength > 0) {
            const progress = Math.min(100, Math.round((loaded / contentLength) * 100));
            if (progressFill) progressFill.style.width = progress + '%';
            if (progressText) progressText.textContent = `Progress: ${progress}%`;
        } else {
            if (progressFill) {
                const width = Math.min(95, Math.max(10, Math.round((loaded / (1024 * 1024)) * 10)));
                progressFill.style.width = width + '%';
            }
            if (progressText) progressText.textContent = `Downloaded ${formatFileSize(loaded)}`;
        }
    };

    if (typeof TransformStream !== 'undefined' && response.body.pipeThrough) {
        const progressStream = new TransformStream({
            transform(chunk, controller) {
                if (chunk) {
                    receivedLength += chunk.length;
                    if (!firstChunkReceived) {
                        firstChunkReceived = true;
                        clearTimeout(stallTimeout);
                        console.info('StreamSaver handshake established - streaming data');
                    }
                    updateProgress(receivedLength);
                }
                controller.enqueue(chunk);
            }
        });

        try {
            await response.body
                .pipeThrough(progressStream)
                .pipeTo(writableStream, { signal: stallAbortController.signal });
        } catch (error) {
            clearTimeout(stallTimeout);
            if (stallAbortController.signal.aborted) {
                throw new Error('StreamSaver handshake timeout (no data received)');
            }
            throw error;
        }
    } else {
        console.info('TransformStream not available - using manual StreamSaver writer');
        const reader = response.body.getReader();
        const writer = writableStream.getWriter();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!value || value.length === 0) {
                    continue;
                }
                if (!firstChunkReceived) {
                    const writePromise = writer.write(value);
                    await Promise.race([
                        writePromise.then(() => {
                            firstChunkReceived = true;
                            clearTimeout(stallTimeout);
                            console.info('StreamSaver handshake established - streaming data');
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('StreamSaver handshake timeout (no data received)')), 5000))
                    ]);
                } else {
                    await writer.write(value);
                }
                receivedLength += value.length;
                updateProgress(receivedLength);
            }
            await writer.close();
        } catch (error) {
            throw error;
        } finally {
            try {
                reader.releaseLock();
            } catch (e) {
                console.debug('Reader lock already released');
            }
        }
    }

    clearTimeout(stallTimeout);

    if (contentLength > 0) {
        updateProgress(contentLength);
    } else {
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = 'Download complete!';
    }

    console.info('✓ Single file download complete (StreamSaver)');
    if (progressText) progressText.textContent = 'Download complete!';
    if (progressFill) progressFill.style.width = '100%';
}

// Download single file using Blob (fallback)
async function downloadSingleFileViaBlob(fileName, newFileName) {
    console.info('Downloading single file via blob...');
    
    const response = await fetch(API_BASE_URL + fileName);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    const progressText = document.getElementById('progressText');
    if (progressText) progressText.textContent = 'Creating download link...';
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = newFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.info('✓ Single file download complete (Blob)');
    const progressTextFinal = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    if (progressTextFinal) progressTextFinal.textContent = 'Download complete!';
    if (progressFill) progressFill.style.width = '100%';
}

async function streamZipDownload(selectedFiles, zipFileName) {
    // Check for force blob fallback
    const forceBlobFallback = document.getElementById('forceBlobFallback').checked;
    
    if (forceBlobFallback) {
        console.warn('⚠ Blob fallback FORCED by user');
        showMethodInfo('⚠ Blob method forced (as requested)', 'warning');
        showBlobWarning();
        await streamZipFallback(selectedFiles, zipFileName);
        return;
    }
    
    // Check user preference for File System API
    const useFileSystemAPI = document.getElementById('useFileSystemAPI').checked;
    
    // Check browser capabilities
    const supportsFileSystemAccess = 'showSaveFilePicker' in window;
    const hasStreamSaver = typeof streamSaver !== 'undefined';
    const hasWritableStream = typeof WritableStream !== 'undefined';
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.info('=== Download Method Selection ===');
    console.info(`  - Force blob fallback: ${forceBlobFallback}`);
    console.info(`  - User wants File System API dialog: ${useFileSystemAPI}`);
    console.info(`  - File System Access API available: ${supportsFileSystemAccess}`);
    console.info(`  - StreamSaver available: ${hasStreamSaver}`);
    console.info(`  - WritableStream available: ${hasWritableStream}`);
    console.info(`  - Is mobile: ${isMobile}`);
    console.info(`  - Protocol: ${window.location.protocol}`);
    
    let methodUsed = '';
    let usedFallback = false;
    let fallbackReason = '';
    
    // Strategy:
    // 1. If user wants File System API AND it's available AND desktop → Use File System Access API
    // 2. Else: Use StreamSaver (or blob as last resort)
    
    // Try File System Access API if user wants it and it's available
    if (useFileSystemAPI && supportsFileSystemAccess && !isMobile) {
        try {
            console.info('✓ Trying File System Access API (user choice, desktop)');
            methodUsed = 'File System Access API';
            showMethodInfo('✓ Using File System Access API - Will ask where to save', 'success');
            await streamZipWithFileSystemAPI(selectedFiles, zipFileName);
            console.info('✓ Download completed with File System Access API');
            return;
        } catch (error) {
            console.warn('File System Access API failed:', error.message);
            fallbackReason = 'File System Access API error: ' + error.message;
            usedFallback = true;
        }
    } else if (useFileSystemAPI && (!supportsFileSystemAccess || isMobile)) {
        console.info('ℹ File System API requested but not available, using streaming fallback');
        fallbackReason = supportsFileSystemAccess ? 'Mobile device detected' : 'File System Access API not supported';
        usedFallback = true;
    }
    
    // Use StreamSaver for direct streaming download
    if (hasStreamSaver && hasWritableStream) {
        try {
            console.info('✓ Using StreamSaver.js for direct streaming download');
            methodUsed = usedFallback ? 'StreamSaver (fallback from File System API)' : 'StreamSaver';
            const infoMsg = usedFallback 
                ? `⚠ Using StreamSaver (Fallback). Reason: ${fallbackReason}`
                : '✓ Using StreamSaver - Direct streaming download';
            showMethodInfo(infoMsg, usedFallback ? 'warning' : 'success');
            await streamZipWithStreamSaver(selectedFiles, zipFileName);
            console.info('✓ Download completed with StreamSaver');
            if (usedFallback) {
                console.warn('Note: Fallback to StreamSaver was used. Reason: ' + fallbackReason);
            }
            return;
        } catch (error) {
            console.error('StreamSaver failed:', error.message);
            fallbackReason = 'StreamSaver error: ' + error.message;
            usedFallback = true;
        }
    } else {
        console.warn('StreamSaver not available');
        if (!fallbackReason) {
            fallbackReason = !hasStreamSaver ? 'StreamSaver not loaded' : 'WritableStream not available';
        }
        usedFallback = true;
    }
    
    // Last resort: Blob method (NOT streaming, but works everywhere)
    console.warn('⚠ Using Blob fallback (NO streaming - higher memory usage!)');
    methodUsed = 'Blob Download (fallback)';
    showMethodInfo(`⚠ FALLBACK: Using Blob method (no streaming). Reason: ${fallbackReason}`, 'warning');
    showBlobWarning();
    await streamZipFallback(selectedFiles, zipFileName);
    console.warn('✗ Fallback was required! Reason: ' + fallbackReason);
    console.warn('Note: Blob method uses more memory and may fail with very large files');
    console.info('Alternative: Consider splitting batch download into individual file downloads to avoid memory issues');
}

// Helper functions for blob warning
function showBlobWarning() {
    const warningDiv = document.getElementById('blobWarning');
    if (warningDiv) {
        warningDiv.style.display = 'block';
        console.warn('⚠ Blob warning displayed to user');
    }
}

function hideBlobWarning() {
    const warningDiv = document.getElementById('blobWarning');
    if (warningDiv) {
        warningDiv.style.display = 'none';
    }
}

function showMethodInfo(message, type) {
    const infoDiv = document.getElementById('downloadMethodInfo');
    if (infoDiv) {
        infoDiv.textContent = message;
        infoDiv.className = 'method-info ' + type;
        infoDiv.style.display = 'block';
    }
}

async function streamZipWithStreamSaver(selectedFiles, zipFileName) {
    console.info('=== StreamSaver Download Starting ===');
    
    try {
        console.info('Creating StreamSaver write stream...');
        console.info('Target filename: ' + zipFileName);
        
        const fileStream = streamSaver.createWriteStream(zipFileName, {
            size: undefined // Unknown size
        });
        
        console.info('✓ Write stream created');

        const writer = fileStream.getWriter();
        console.info('✓ Writer obtained');
        
        let totalSize = 0;

        // ZIP-Writer mit fflate für Streaming
        const zipWriter = new fflate.Zip();
        console.info('✓ ZIP writer created');

        // Event-Handler für ZIP-Daten - schreibt direkt in den Stream!
        zipWriter.ondata = async (err, data, final) => {
            if (err) {
                console.error('ZIP Error:', err);
                try {
                    await writer.abort();
                } catch (e) {
                    console.error('Error aborting writer:', e);
                }
                return;
            }
            
            try {
                // Chunk direkt in Stream schreiben
                await writer.write(data);
                totalSize += data.length;
                
                if (final) {
                    await writer.close();
                    console.info(`✓ ZIP creation completed! Total size: ${formatFileSize(totalSize)}`);
                    updateProgress(100, `ZIP file created successfully! (${formatFileSize(totalSize)})`);
                }
            } catch (writeError) {
                console.error('Write error:', writeError);
                console.error('Write error type: ' + writeError.constructor.name);
                console.error('Write error message: ' + writeError.message);
                showError('Write error: ' + writeError.message);
            }
        };

        // Dateien sequenziell laden und streamen
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const fileName = selectedFiles[i];
                
                try {
                    await streamFileToZip(zipWriter, fileName, i, selectedFiles.length);
                } catch (error) {
                    console.error(`Error processing file ${fileName}:`, error);
                    showError(`Error with file ${fileName}: ${error.message}`);
                }
            }

            console.info('Finalizing ZIP archive...');
            updateProgress(95, 'Finalizing ZIP archive...');
            zipWriter.end();
        } catch (error) {
            console.error('Error during file processing:', error);
            try {
                await writer.abort();
            } catch (e) {
                console.error('Error aborting writer:', e);
            }
            throw error;
        }
    } catch (streamSaverError) {
        console.error('=== StreamSaver FAILED ===');
        console.error('Error type: ' + streamSaverError.constructor.name);
        console.error('Error message: ' + streamSaverError.message);
        console.error('Error stack:', streamSaverError.stack);
        
        console.warn('Falling back to blob method...');
        await streamZipFallback(selectedFiles, zipFileName);
    }
}

async function streamZipWithFileSystemAPI(selectedFiles, zipFileName) {
    try {
        // Datei-Dialog sofort anzeigen - User Experience!
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: zipFileName,
            types: [{
                description: 'ZIP Archive',
                accept: { 'application/zip': ['.zip'] }
            }]
        });

        const writable = await fileHandle.createWritable();
        let totalSize = 0;

        // ZIP-Writer mit fflate für Streaming
        const zipWriter = new fflate.Zip();

        // Event-Handler für ZIP-Daten - schreibt direkt in die Datei!
        zipWriter.ondata = async (err, data, final) => {
            if (err) {
                console.error('ZIP Error:', err);
                await writable.abort();
                return;
            }
            
            // Chunk direkt in Datei schreiben
            await writable.write(data);
            totalSize += data.length;
            
            if (final) {
                await writable.close();
                updateProgress(100, `ZIP file created successfully! (${formatFileSize(totalSize)})`);
            }
        };

        // Load and stream files sequentially
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i];
            
            try {
                await streamFileToZip(zipWriter, fileName, i, selectedFiles.length);
            } catch (error) {
                console.error(`Error processing file ${fileName}:`, error);
                showError(`Error with file ${fileName}: ${error.message}`);
            }
        }

        updateProgress(95, 'Finalizing ZIP archive...');
        zipWriter.end();
        
    } catch (error) {
        if (error.name === 'AbortError') {
            updateProgress(0, 'Download cancelled');
        } else {
            throw error;
        }
    }
}

async function streamZipFallback(selectedFiles, zipFileName) {
    // Fallback for older browsers
    // NOTE: This blob method uses high memory and may fail with large files.
    // ALTERNATIVE STRATEGY: Instead of creating a ZIP via blob, consider downloading
    // each file individually with sequential naming (e.g., batchload_001_filename.ext,
    // batchload_002_filename.ext, etc.). This would avoid memory issues entirely while
    // still providing all files to the user, though not in a single ZIP archive.
    const zipWriter = new fflate.Zip();
    const chunks = [];
    let totalSize = 0;

    zipWriter.ondata = (err, data, final) => {
        if (err) {
            console.error('ZIP Error:', err);
            return;
        }
        
        chunks.push(data);
        totalSize += data.length;
        
        if (final) {
            const blob = new Blob(chunks, { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = zipFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            updateProgress(100, `ZIP file created successfully! (${formatFileSize(totalSize)})`);
        }
    };

    for (let i = 0; i < selectedFiles.length; i++) {
        const fileName = selectedFiles[i];
        
        try {
            await streamFileToZip(zipWriter, fileName, i, selectedFiles.length);
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);
            showError(`Error with file ${fileName}: ${error.message}`);
        }
    }

    updateProgress(95, 'Finalizing ZIP archive...');
    zipWriter.end();
}

async function streamFileToZip(zipWriter, fileName, fileIndex, totalFiles) {
    const fileUrl = API_BASE_URL + fileName;
    const prefixedName = 'batchload_' + fileName;
    
    console.info(`[${fileIndex + 1}/${totalFiles}] === Processing File ===`);
    console.info(`  File: ${fileName}`);
    console.info(`  URL: ${fileUrl}`);
    console.info(`  ZIP name: ${prefixedName}`);
    
    const fetchStart = performance.now();
    const response = await fetch(fileUrl);
    const fetchEnd = performance.now();
    
    console.info(`  Fetch completed in ${(fetchEnd - fetchStart).toFixed(2)}ms`);
    console.info(`  Response status: ${response.status}`);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Dateigröße aus Header auslesen
    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let loadedBytes = 0;

    console.info(`  File size: ${formatFileSize(totalBytes)}`);

    // Create file writer for this file in the ZIP
    const fileWriter = new fflate.ZipDeflate(prefixedName, { level: 6 });
    
    // Add file writer to ZIP writer
    zipWriter.add(fileWriter);

    // Get ReadableStream from response
    const reader = response.body.getReader();

    try {
        let chunkCount = 0;
        // Read stream chunk by chunk and forward directly to ZIP
        while (true) {
            let result;
            try {
                result = await reader.read();
            } catch (readError) {
                console.error('  Stream read error:', readError);
                throw new Error(`Stream read error: ${readError.message}`);
            }
            
            const { done, value } = result;
            
            if (done) {
                // File completely read, finalize file writer
                fileWriter.push(new Uint8Array(0), true); // Final empty chunk
                console.info(`  [${fileIndex + 1}/${totalFiles}] Completed: ${fileName} (${chunkCount} chunks)`);
                break;
            }
            
            if (!value || value.length === 0) {
                continue; // Skip empty chunks
            }
            
            chunkCount++;
            
            // Forward chunk to file writer
            try {
                fileWriter.push(value, false);
            } catch (pushError) {
                console.error('  ZIP push error:', pushError);
                throw new Error(`Compression error: ${pushError.message}`);
            }
            
            // Update progress
            loadedBytes += value.length;
            if (totalBytes > 0) {
                const fileProgress = (loadedBytes / totalBytes) * 100;
                const overallProgress = ((fileIndex + fileProgress / 100) / totalFiles) * 90;
                updateProgress(
                    overallProgress.toFixed(1), 
                    `File ${fileIndex + 1}/${totalFiles}: ${fileName} (${formatFileSize(loadedBytes)}/${formatFileSize(totalBytes)} - ${fileProgress.toFixed(0)}%)`
                );
            }
            
            // Small pause for Firefox to prevent blocking the event loop
            if (loadedBytes % (1024 * 1024 * 10) < value.length) { // Every ~10MB
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    } catch (error) {
        // Explicitly cancel stream on error
        try {
            await reader.cancel();
        } catch (e) {
            console.error('  Error canceling reader:', e);
        }
        throw error;
    } finally {
        try {
            reader.releaseLock();
        } catch (e) {
            // Lock might already be released
            console.debug('  Reader lock already released');
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateProgress(percent, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
    if (progressText) {
        progressText.textContent = text;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.error('ERROR: Could not find error div element to display: ' + message);
    }
}

function hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}
