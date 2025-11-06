# Smart PDF Merger - Chrome Extension

**Description:**  
A lightweight Chrome extension to merge multiple PDF files, preview the first page of each PDF, reorder pages via drag-and-drop, and download the merged PDF instantly. Supports automatic renaming and removal of special characters in filenames.

---

## 📦 Contents of the ZIP

- `popup.html` – Main extension popup  
- `popup.js` – JavaScript logic for merging, renaming, and rendering previews  
- `style.css` – Styling for popup  
- `pdf.min.js` – PDF.js library  
- `pdf.worker.min.js` – PDF.js worker script  
- `sortable.min.js` – Drag-and-drop library  
- `manifest.json` – Chrome extension manifest file  
- `README.md` – This instruction file  

---

## ⚡ Installation Steps

1. **Download the ZIP file** from the host (GitHub / Google Drive / any public server).  
2. **Extract** the ZIP to a folder on your computer.  
3. Open **Chrome** and navigate to:  
4. Enable **Developer mode** (toggle switch in the top-right corner).  
5. Click **Load unpacked** and select the folder where you extracted the extension.  
6. The extension will now appear in your extensions bar. Pin it for easy access.  

---

## 🖱 How to Use

1. Click on the **Smart PDF Merger** icon in Chrome.  
2. Click **Choose Files** and select multiple PDF files.  
3. You’ll see a **list of PDFs** with a small thumbnail of the first page.  
4. **Drag-and-drop** the items to reorder them if needed.  
5. Click **Rename** (optional) to change the base name of the merged file.  
- Special characters will be automatically removed.  
6. Click **Download** to merge the PDFs and save the resulting file.  
- If a file with the same name exists, it will automatically append `(1)`, `(2)`, etc.

---

## ⚠ Notes

- Make sure you have **pdf.min.js** and **pdf.worker.min.js** in the same folder as `popup.html`.  
- The extension **does not use any remote scripts** due to Chrome’s security restrictions.  
- Merging works offline — no internet connection is required.  
