# Client-Side Multi-Download Example

A lightweight, client-side web application for downloading multiple files and packaging them into a single ZIP archive - all in the browser without server-side processing.

## Features

- 📦 **Batch Download**: Select and download multiple files from a remote server
- 🗜️ **On-the-fly ZIP Creation**: Files are compressed and packaged in real-time
- 💾 **Memory Efficient**: Uses streaming to handle large files without memory issues
- 📊 **Real-time Progress**: Live progress tracking with detailed file-by-file updates
- 🌐 **Cross-Browser**: Works in Chrome, Firefox, Edge, and Safari
- ⚡ **Instant Download**: Download starts immediately with visible progress
- 🔒 **Client-Side Only**: No server-side processing required - everything runs in the browser

## Pre-Requirements

A **server hosting test files with a file list** is required. The server must:
- Provide an `index.txt` file containing a list of available files (one filename per line)
- Host the actual files referenced in `index.txt`
- Have CORS enabled to allow browser access

**Example Setup:**
The [uncompressableTestfiles](https://github.com/fabianschwamborn/uncompressableTestfiles) repository can be used to quickly set up a test file server with appropriate test files.

## Technology Stack

- **Pure JavaScript** (Vanilla JS - no frameworks)
- **fflate** - Fast compression library for ZIP creation
- **StreamSaver.js** - Enables true streaming downloads in all browsers
- **File System Access API** - Native browser API for modern browsers (with fallback)

## How It Works

1. Fetches a file list from a remote server (`index.txt`)
2. User selects files to download via checkboxes
3. Downloads files sequentially using streaming
4. Compresses files on-the-fly using fflate
5. Streams the ZIP archive directly to disk using StreamSaver.js
6. Shows real-time progress for each file and overall completion

## Usage

1. Open `website/index.html` in a web browser
2. Wait for the file list to load
3. Select files to download using checkboxes
4. Click "Download Selected Files"
5. Choose where to save the ZIP file (if using File System API)
6. Monitor progress as files are downloaded and compressed

## Configuration

The application is configured to fetch files from:
```javascript
const API_BASE_URL = 'https://testfiles.xxip.de/';
const INDEX_URL = API_BASE_URL + 'index.txt';
```

When using a custom server:
1. Files are hosted on a CORS-enabled server
2. An `index.txt` file is created with one filename per line
3. The `API_BASE_URL` in `index.html` is updated accordingly

## Server Configuration Requirements

### CORS and Cache Headers

When hosting the application on a different domain than the file server, **both CORS and cache-control headers must be properly configured**. These headers are equally critical for reliable operation, especially during testing.

⚠️ The following configurations are provided as brief reminders for testing; when files are served, server response headers (CORS and cache-control) shall be configured to match the real deployment and be optimized for the intended use case (for example, by enabling efficient browser caching with ETag/Last-Modified and appropriate Cache-Control directives).

**Required Server Response Headers:**

```http
Access-Control-Allow-Origin: https://playground.xxip.de
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Expose-Headers: Content-Length, Content-Range
Access-Control-Max-Age: 0
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

**Header Essentials:**
- `Access-Control-Allow-Origin` - Specify exact origin (e.g., `https://playground.xxip.de`)
- `Access-Control-Expose-Headers` - Exposes `Content-Length` for progress tracking
- `Access-Control-Max-Age: 0` - **Critical**: Prevents CORS preflight caching during testing
- `Cache-Control: no-cache, no-store` - **Critical**: Prevents file content caching during testing

### ⚠️ Critical: Browser Caching Issues

**Both CORS headers AND file content are aggressively cached by browsers**, causing severe testing problems:

**Common Cache-Related Problems:**
1. **CORS Preflight Caching:**
   - Browsers cache CORS decisions for seconds to hours (default `Access-Control-Max-Age`)
   - Server CORS changes don't take effect until cache expires
   - Results in persistent CORS errors despite correct server configuration

2. **File Content Caching:**
   - Updated `index.txt` not reflected (shows old file list)
   - Modified test files not re-downloaded
   - `Content-Length` mismatches break progress calculation

3. **Combined Effect:**
   - Even with fresh file content, cached CORS headers block access
   - File list (`index.txt`) particularly problematic: content AND CORS both cached
   - Changes invisible until both caches clear

**Symptoms:**
- Application works, then fails with CORS errors after server reconfiguration
- File list doesn't update despite server changes
- Intermittent "No CORS headers" errors with correct server config
- Different behavior across browsers/sessions

**Testing Solutions:**
- ⚠️ **Use Private/Incognito mode** - Bypasses all browser caches
- ⚠️ **Set both `Access-Control-Max-Age: 0` AND `Cache-Control: no-cache`** - Prevents both types of caching
- ⚠️ **Clear browser cache completely** before testing configuration changes
- ⚠️ **Enable "Disable cache" in DevTools Network tab** during development
- ⚠️ **Verify headers with `curl -I`** to confirm server-side configuration

**Production Configuration:**
```http
Access-Control-Allow-Origin: https://playground.xxip.de
Access-Control-Max-Age: 3600
Cache-Control: public, max-age=31536000, immutable
```
- Increase `Access-Control-Max-Age` for performance (e.g., 3600 seconds)
- Use long cache times for immutable content
- Consider filename versioning (e.g., `file-v1.dat`) for cache busting

## Browser Compatibility

- ✅ Chrome 89+ (File System Access API + StreamSaver)
- ✅ Firefox 90+ (StreamSaver)
- ✅ Edge 89+ (File System Access API + StreamSaver)
- ✅ Safari 15+ (StreamSaver)

## File Structure

```
clientsideMultidownloadExample/
├── website/
│   ├── index.html          # Main HTML page
│   ├── app.js              # Application logic
│   ├── styles.css          # Styling
│   ├── sw.js               # Service worker for StreamSaver
│   └── mitm.html           # StreamSaver fallback page
├── README.md               # This file
└── LICENSE                 # MIT License
```

## Memory Efficiency

The application uses streaming techniques to handle files of any size:
- Files are downloaded in chunks
- Chunks are immediately compressed
- Compressed data is streamed directly to disk
- Memory usage stays constant regardless of file size

This allows downloading hundreds of MB or even GB of files without running out of memory!

## License

MIT License - See [LICENSE](LICENSE) file for details

## Author

Built with ❤️ and AI for efficient client-side file handling

## Repository

This project is available on GitHub: [https://github.com/fabianschwamborn/clientsideMultidownloadExample](https://github.com/fabianschwamborn/clientsideMultidownloadExample)

## Potential Improvements

The following features could be implemented to enhance the application:

### UI/UX Enhancements
- **Download Progress Overlay**: Implement a modal overlay to display download progress, preventing interaction during active downloads
- **Drag-and-Drop File Selection**: Add drag-and-drop interface for easier file selection
- **File Size Display**: Show individual file sizes in the file list before downloading
- **Download History**: Track and display recently downloaded file combinations
- **Theme Toggle**: Add light/dark theme switcher

### Technical Enhancements
- **Service Worker Background Downloads**: Implement page-independent service worker to allow navigation during downloads (currently marked as "Not Yet Implemented")
- **Pause/Resume Downloads**: Add ability to pause and resume ongoing downloads
- **Parallel Downloads**: Download multiple files simultaneously instead of sequentially
- **Download Speed Limiter**: Add option to limit download speed to prevent bandwidth saturation
- **Retry Failed Downloads**: Automatic retry mechanism for failed file downloads
- **Compression Level Selection**: Allow users to choose ZIP compression level (faster vs. smaller)
- **Alternative Fallback Strategy**: Instead of using blob method (high memory usage) when streaming fails, split batch downloads into individual file downloads with appropriate naming (e.g., `batchload_001_filename.ext`). This would avoid memory issues while still providing all files to the user.

### Advanced Features
- **Custom File Naming**: Allow users to rename files before adding to ZIP
- **Folder Structure**: Support for organizing files into folders within the ZIP archive
- **Download Scheduler**: Schedule downloads for specific times
- **Bandwidth Monitor**: Display real-time network usage statistics

Note: These are suggestions for future development and are not currently implemented.

## Contributing

Feel free to fork, modify, and use this project for your own purposes!
