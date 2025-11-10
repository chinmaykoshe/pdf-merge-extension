const fileInput = document.getElementById("fileInput");
const fileListDiv = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const outputName = document.getElementById("outputName");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const message = document.getElementById("message");

let pdfFiles = [];

function renderList() {
  fileListDiv.innerHTML = "";
  pdfFiles.forEach((file, idx) => {
    const p = document.createElement("p");
    p.className = "file-item";
    p.textContent = file.name;

    // Create a delete span instead of button for smaller size
    const del = document.createElement("span");
    del.textContent = " ×"; // space + multiplication sign for close
    del.className = "file-del";
    del.onclick = () => {
      pdfFiles.splice(idx, 1);
      renderList();
    };

    p.appendChild(del);
    fileListDiv.appendChild(p);
  });
}


fileInput.addEventListener("change", (e) => {
  pdfFiles = Array.from(e.target.files);
  renderList();
});

Sortable.create(fileListDiv, {
  animation: 150,
  onEnd: () => {
    const reordered = [];
    fileListDiv.querySelectorAll(".file-item").forEach((div) => {
      // Use index instead of name match (in case of duplicate filenames)
      const idx = Array.from(fileListDiv.children).indexOf(div);
      const file = pdfFiles[idx];
      if (file) reordered.push(file);
    });
    pdfFiles = reordered;
  },
});

async function mergePDFs() {
  if (pdfFiles.length < 2) {
    message.textContent = "Please select at least 2 PDF files.";
    message.style.color = "red";
    return;
  }

  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";

  const mergedPdf = await window.PDFLib.PDFDocument.create();

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    const arrayBuffer = await file.arrayBuffer();
    const loadedPdf = await window.PDFLib.PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
    copiedPages.forEach((p) => mergedPdf.addPage(p));

    progressBar.style.width = `${Math.round(((i + 1) / pdfFiles.length) * 100)}%`;
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });

  const downloadName =
    (outputName.value.trim() || "merged") + ".pdf";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  progressContainer.classList.add("hidden");
  progressBar.style.width = "0%";
  message.textContent = "PDF merged successfully!";
  message.style.color = "green";
}

mergeBtn.addEventListener("click", mergePDFs);
