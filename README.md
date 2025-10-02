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
3. Select the files you want to download
4. Click "Ausgewählte Dateien herunterladen"
5. Choose where to save the ZIP file
6. Watch the progress as files are downloaded and compressed

## Configuration

The application is configured to fetch files from:
```javascript
const API_BASE_URL = 'https://testfiles.xxip.de/';
const INDEX_URL = API_BASE_URL + 'index.txt';
```

To use with your own server:
1. Host your files on a CORS-enabled server
2. Create an `index.txt` file with one filename per line
3. Update the `API_BASE_URL` in `index.html`

## Browser Compatibility

- ✅ Chrome 89+ (File System Access API + StreamSaver)
- ✅ Firefox 90+ (StreamSaver)
- ✅ Edge 89+ (File System Access API + StreamSaver)
- ✅ Safari 15+ (StreamSaver)

## File Structure

```
clientsideMultidownloadExample/
├── website/
│   └── index.html          # Main application (single HTML file)
├── README.md               # This file
└── LICENSE                 # MIT License
```

## Memory Efficiency

The application uses streaming techniques to handle files of any size:
- Files are downloaded in chunks
- Chunks are immediately compressed
- Compressed data is streamed directly to disk
- Memory usage stays constant regardless of file size

This means you can download hundreds of MB or even GB of files without running out of memory!

## License

MIT License - See [LICENSE](LICENSE) file for details

## Author

Built with ❤️ for efficient client-side file handling

## Contributing

Feel free to fork, modify, and use this project for your own purposes!
