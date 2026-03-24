// popup.js - FLEXIBLE BILL SORTING WITH LGA### NUMBER COMPARISON
// Position 4 LGA### > Position 3 LGA### based on numeric value

const fileInput = document.getElementById("fileInput");
const folderInput = document.getElementById("folderInput");
const fileListDiv = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const outputName = document.getElementById("outputName");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const message = document.getElementById("message");

let pdfFiles = [];
let isMerging = false;

// ------------------ HELPERS ------------------
function normalizeKey(file) {
  return file.webkitRelativePath || file.name;
}

function extractLGANumber(name) {
  const match = name.match(/LGA(\d{3})/i);
  return match ? parseInt(match[1], 10) : null;
}

function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = `message ${type}`;
}

function showProgress() {
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
}

function hideProgress() {
  progressContainer.classList.add("hidden");
  progressBar.style.width = "0%";
}

function updateOutputNameFromFiles() {
  if (!pdfFiles.length) {
    outputName.value = "";
    return;
  }

  let match = pdfFiles.find(f => f.name.toLowerCase().startsWith("i"));
  let baseName = (match || pdfFiles[0]).name.replace(/\.pdf$/i, "");

  baseName = baseName.replace(
    /^([iI])_?(\d+)_?(\d+)?/,
    (_, p1, p2, p3) => p1.toUpperCase() + (p2 || "") + (p3 || "")
  );

  outputName.value = baseName + "-merged";
}

function renderList() {
  fileListDiv.innerHTML = "";

  pdfFiles.forEach((file, idx) => {
    const p = document.createElement("p");
    p.className = "file-item";
    p.draggable = true;

    const nameSpan = document.createElement("span");
    nameSpan.className = "file-name";
    nameSpan.textContent = file.name;

    const del = document.createElement("span");
    del.className = "file-del";
    del.textContent = "×";
    del.title = "Remove file";

    del.onclick = (e) => {
      e.stopPropagation();
      pdfFiles.splice(idx, 1);
      renderList();
      updateOutputNameFromFiles();
    };

    p.appendChild(nameSpan);
    p.appendChild(del);
    fileListDiv.appendChild(p);
  });
}

// ------------------ SMART LGA SORTING (3rd < 4th numerically) ------------------
function autoArrangeBills() {
  const categorized = pdfFiles.map(file => {
    const name = normalizeKey(file).toUpperCase();
    
    return {
      file,
      name,
      isLGAINO: name.includes('LGAINO'),
      isINumber: /I_\d+/.test(name),
      lgaNumber: extractLGANumber(name)
    };
  });

  const orderedFiles = [];
  const usedFiles = new Set();

  // 1. ALWAYS FIRST: LGAINO
  const lgainoFile = categorized.find(item => item.isLGAINO && !usedFiles.has(item.file));
  if (lgainoFile) {
    orderedFiles.push(lgainoFile.file);
    usedFiles.add(lgainoFile.file);
  }

  // 2. ALWAYS SECOND: I_XXXX
  const iNumberFile = categorized.find(item => item.isINumber && !usedFiles.has(item.file));
  if (iNumberFile) {
    orderedFiles.push(iNumberFile.file);
    usedFiles.add(iNumberFile.file);
  }

  // 3+4. LGA### files - SORT numerically (smaller first)
  const lgaFiles = categorized
    .filter(item => item.lgaNumber && !usedFiles.has(item.file))
    .sort((a, b) => a.lgaNumber - b.lgaNumber);

  lgaFiles.forEach(item => {
    orderedFiles.push(item.file);
    usedFiles.add(item.file);
  });

  // Remaining files at end
  const remainingFiles = pdfFiles.filter(f => !usedFiles.has(f));
  
  if (orderedFiles.length > 0) {
    pdfFiles = [...orderedFiles, ...remainingFiles];
    return true;
  }

  return false;
}

// ------------------ CORE FILE HANDLING ------------------
function addPdfFiles(files) {
  const incoming = Array.from(files).filter(f =>
    f.name.toLowerCase().endsWith(".pdf")
  );

  if (!incoming.length) return;

  // Remove duplicates
  const map = new Map();
  pdfFiles.forEach(f => map.set(normalizeKey(f), f));
  incoming.forEach(f => map.set(normalizeKey(f), f));

  pdfFiles = Array.from(map.values());

  // 🚀 ALWAYS AUTO-ARRANGE FIRST
  const arranged = autoArrangeBills();
  
  if (!arranged) {
    pdfFiles.sort((a, b) =>
      normalizeKey(a).localeCompare(
        normalizeKey(b),
        undefined,
        { numeric: true, sensitivity: "base" }
      )
    );
  }

  renderList();
  updateOutputNameFromFiles();
  
  // Smart status
  if (arranged) {
    const billOrder = [];
    pdfFiles.slice(0, 4).forEach(f => {
      const name = normalizeKey(f).toUpperCase();
      if (name.includes('LGAINO')) billOrder.push('LGAINO');
      else if (/I_\d+/.test(name)) billOrder.push('I_#');
      else {
        const num = extractLGANumber(name);
        billOrder.push(num ? `LGA${num.toString().padStart(3, '0')}` : 'Other');
      }
    });
    showMessage(`✅ Auto-sorted: ${billOrder.join(' → ')}`, "success");
  } else {
    showMessage(`${pdfFiles.length} PDFs (alpha order)`, "info");
  }
}

// ------------------ INPUT EVENTS ------------------
fileInput.addEventListener("change", (e) => {
  addPdfFiles(e.target.files);
  fileInput.value = "";
});

folderInput.addEventListener("change", (e) => {
  addPdfFiles(e.target.files);
  folderInput.value = "";
});

// ------------------ DRAG & DROP ------------------
let draggedItem = null;

fileListDiv.addEventListener('dragstart', (e) => {
  draggedItem = e.target.closest('.file-item');
  e.target.style.opacity = '0.5';
}, true);

fileListDiv.addEventListener('dragend', (e) => {
  e.target.style.opacity = '1';
  draggedItem = null;
}, true);

fileListDiv.addEventListener('dragover', (e) => {
  e.preventDefault();
}, true);

fileListDiv.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!draggedItem) return;

  const afterElement = getDragAfterElement(fileListDiv, e.clientY);
  const draggedIdx = pdfFiles.findIndex(f => normalizeKey(f) === normalizeKey(draggedItem.file));
  
  if (afterElement == null) {
    pdfFiles.push(pdfFiles.splice(draggedIdx, 1)[0]);
  } else {
    const afterIdx = pdfFiles.findIndex(f => normalizeKey(f) === normalizeKey(afterElement.file));
    pdfFiles.splice(afterIdx, 0, pdfFiles.splice(draggedIdx, 1)[0]);
  }
  
  renderList();
}, true);

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.file-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ------------------ PDF MERGING ------------------
async function mergePDFs() {
  if (pdfFiles.length < 2) {
    throw new Error("Please select at least 2 PDF files.");
  }

  if (!window.PDFLib) {
    throw new Error("PDFLib not loaded. Please wait or refresh.");
  }

  const mergedPdf = await PDFLib.PDFDocument.create();

  for (let i = 0; i < pdfFiles.length; i++) {
    const bytes = await pdfFiles[i].arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => mergedPdf.addPage(p));
    progressBar.style.width = `${Math.round(((i + 1) / pdfFiles.length) * 100)}%`;
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (outputName.value.trim() || "merged") + ".pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// ------------------ MERGE BUTTON ------------------
mergeBtn.addEventListener("click", async () => {
  if (isMerging) return;
  isMerging = true;
  mergeBtn.disabled = true;
  mergeBtn.textContent = "Merging...";
  showProgress();

  try {
    await mergePDFs();
    showMessage(`✅ Merged ${pdfFiles.length} PDFs!`, "success");
  } catch (err) {
    showMessage(err.message || "Merge failed.", "error");
  } finally {
    hideProgress();
    isMerging = false;
    mergeBtn.disabled = false;
    mergeBtn.textContent = "Merge PDFs";
  }
});

// ------------------ INIT ------------------
document.addEventListener('DOMContentLoaded', () => {
  showMessage("🚀 Auto-sorts LGA### numerically (smaller → larger)!", "info");
  pdfFiles = [];
  renderList();
});
