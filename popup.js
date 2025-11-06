const fileWrapper = document.getElementById('fileInputWrapper');
const fileInput = document.getElementById("fileInput");
const fileListDiv = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const renameBtn = document.getElementById("renameBtn");

let pdfFiles = [];
let outputName = "pdf-merged"; // default base name

// Click wrapper to open file picker
fileWrapper.addEventListener('click', () => fileInput.click());

// File input change
fileInput.addEventListener("change", (e) => {
  pdfFiles = Array.from(e.target.files);
  renderList();

  const enabled = pdfFiles.length >= 2;
  mergeBtn.disabled = !enabled;
  renameBtn.disabled = !enabled;

  fileWrapper.querySelector('span').textContent = `${pdfFiles.length} file(s) selected`;
});

// Render file list with canvas preview
function renderList() {
  fileListDiv.innerHTML = "";

  pdfFiles.forEach((file, i) => {
    const div = document.createElement("div");
    div.className = "file-item";
    div.setAttribute("data-index", i);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${i + 1}. ${file.name}`;
    nameSpan.style.flex = "1";

    const canvas = document.createElement("canvas");
    canvas.style.marginLeft = "10px";
    canvas.style.border = "1px solid #ccc";
    canvas.style.borderRadius = "4px";

    div.appendChild(nameSpan);
    div.appendChild(canvas);
    fileListDiv.appendChild(div);

    const reader = new FileReader();
    reader.onload = function () {
      const typedarray = new Uint8Array(reader.result);

      pdfjsLib.getDocument({ data: typedarray }).promise.then((pdfDoc) => {
        pdfDoc.getPage(1).then((page) => {
          const scale = 0.2; // thumbnail scale
          const viewport = page.getViewport({ scale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext("2d");
          page.render({ canvasContext: ctx, viewport });
        });
      }).catch(err => console.error("PDF render error:", err));
    };
    reader.readAsArrayBuffer(file);
  });
}

// Drag reorder
new Sortable(fileListDiv, {
  animation: 150,
  onEnd: (evt) => {
    const { oldIndex, newIndex } = evt;
    const moved = pdfFiles.splice(oldIndex, 1)[0];
    pdfFiles.splice(newIndex, 0, moved);
    renderList();
  }
});

// Rename logic
renameBtn.addEventListener("click", () => {
  const newName = prompt("Enter new base name for merged PDF:", outputName);
  if (newName && newName.trim() !== "") {
    outputName = newName.replace(/[^a-zA-Z0-9]/g, '') || "pdfmerged";
    alert(`File will be saved as ${outputName}.pdf (auto-numbered if duplicate)`);
  }
});

// Merge & download
mergeBtn.addEventListener("click", async () => {
  if (pdfFiles.length < 2) return alert("Select at least two PDFs.");

  mergeBtn.textContent = "Merging...";
  mergeBtn.disabled = true;

  const { PDFDocument } = PDFLib;
  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((p) => mergedPdf.addPage(p));
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  let finalName = outputName + ".pdf";
  let counter = 1;

  // Duplicate check (for Chrome extensions)
  const checkDuplicate = async (filename) => {
    return new Promise((resolve) => {
      if (chrome && chrome.downloads) {
        chrome.downloads.search({ query: [filename] }, (results) => {
          resolve(results.length > 0);
        });
      } else {
        resolve(false);
      }
    });
  };

  while (await checkDuplicate(finalName)) {
    finalName = `${outputName}(${counter}).pdf`;
    counter++;
  }

  if (chrome && chrome.downloads) {
    chrome.downloads.download({ url: blobUrl, filename: finalName });
  } else {
    // fallback for browser
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = finalName;
    link.click();
  }

  mergeBtn.textContent = "Download";
  mergeBtn.disabled = false;
});
