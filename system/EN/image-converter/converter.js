document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const settingsPanel = document.getElementById("settingsPanel");
    const noImgPlaceholder = document.getElementById("noImgPlaceholder");
    const resultsContent = document.getElementById("resultsContent");
    
    const outputFormat = document.getElementById("outputFormat");
    const qualityRange = document.getElementById("qualityRange");
    const qualityVal = document.getElementById("qualityVal");
    const qualityWrapper = document.getElementById("qualityWrapper");
    
    const resizeWidth = document.getElementById("resizeWidth");
    const resizeHeight = document.getElementById("resizeHeight");
    const keepAspectRatio = document.getElementById("keepAspectRatio");
    
    const singlePreviewSection = document.getElementById("singlePreviewSection");
    const origSizeEl = document.getElementById("origSize");
    const compSizeEl = document.getElementById("compSize");
    const savingsValEl = document.getElementById("savingsVal");
    const savingsWrapper = document.getElementById("savingsWrapper");
    const processedPreview = document.getElementById("processedPreview");
    const processedDims = document.getElementById("processedDims");
    const downloadBtn = document.getElementById("downloadBtn");

    const multiPreviewSection = document.getElementById("multiPreviewSection");
    const multiImagesContainer = document.getElementById("multiImagesContainer");
    const zipDownloadBtn = document.getElementById("zipDownloadBtn");

    const resetBtn = document.getElementById("resetBtn");

    // State Variables
    let imagesQueue = []; // Array of objects: { file, name, size, type, imgNode, processedBlob, processedUrl, originalAspectRatio }
    let originalAspectRatio = 1; // used for single image resizing sync

    // Trigger File Input Click
    dropzone.addEventListener("click", () => fileInput.click());

    // Drag & Drop Listeners
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // File Input Listener
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    // Process uploaded files
    async function handleFiles(files) {
        const MAX_FILES = 30;

        // Clear previous state if any
        imagesQueue.forEach(item => {
            if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
        });
        imagesQueue = [];

        const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (fileArray.length === 0) {
            alert("Please select valid image files.");
            return;
        }

        if (fileArray.length > MAX_FILES) {
            alert(`⚠️ Maximum allowed is ${MAX_FILES} images at a time.\nYou selected ${fileArray.length} images — please reduce the count and try again.`);
            return;
        }

        // Show loading state if needed
        for (const file of fileArray) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imgNode = new Image();
                    imgNode.onload = function () {
                        const aspect = imgNode.naturalWidth / imgNode.naturalHeight;
                        imagesQueue.push({
                            file: file,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            imgNode: imgNode,
                            processedBlob: null,
                            processedUrl: null,
                            originalAspectRatio: aspect
                        });
                        resolve();
                    };
                    imgNode.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Setup resize dimension defaults using the first image
        if (imagesQueue.length > 0) {
            const firstImg = imagesQueue[0].imgNode;
            originalAspectRatio = imagesQueue[0].originalAspectRatio;
            resizeWidth.value = firstImg.naturalWidth;
            resizeHeight.value = firstImg.naturalHeight;
        }

        // Toggle Views
        dropzone.style.display = "none";
        settingsPanel.style.display = "flex";
        noImgPlaceholder.style.display = "none";
        resultsContent.style.display = "block";

        toggleQualityControl();
        await processAllImages();
    }

    // Toggle Quality Control Visibility (PNG doesn't support canvas quality parameter)
    function toggleQualityControl() {
        if (outputFormat.value === "image/png") {
            qualityWrapper.style.opacity = "0.4";
            qualityRange.disabled = true;
        } else {
            qualityWrapper.style.opacity = "1";
            qualityRange.disabled = false;
        }
    }

    // Helper: format bytes to human readable string
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    // Listeners for settings
    qualityRange.addEventListener("input", (e) => {
        qualityVal.textContent = e.target.value + "%";
    });
    qualityRange.addEventListener("change", processAllImages);
    outputFormat.addEventListener("change", () => {
        toggleQualityControl();
        processAllImages();
    });

    resizeWidth.addEventListener("input", () => {
        if (keepAspectRatio.checked && imagesQueue.length > 0) {
            const w = parseInt(resizeWidth.value) || 0;
            if (w > 0) {
                // If single, use its aspect ratio, else use the first image's aspect ratio
                resizeHeight.value = Math.round(w / originalAspectRatio);
            }
        }
    });
    resizeWidth.addEventListener("change", processAllImages);

    resizeHeight.addEventListener("input", () => {
        if (keepAspectRatio.checked && imagesQueue.length > 0) {
            const h = parseInt(resizeHeight.value) || 0;
            if (h > 0) {
                resizeWidth.value = Math.round(h * originalAspectRatio);
            }
        }
    });
    resizeHeight.addEventListener("change", processAllImages);

    // Process all loaded images
    async function processAllImages() {
        if (imagesQueue.length === 0) return;

        const format = outputFormat.value;
        const quality = qualityRange.value / 100;
        
        // Loop and process each
        for (const item of imagesQueue) {
            let targetWidth = parseInt(resizeWidth.value) || item.imgNode.naturalWidth;
            let targetHeight = parseInt(resizeHeight.value) || item.imgNode.naturalHeight;

            // If keep aspect ratio is checked, calculate custom height for items to avoid stretching
            if (keepAspectRatio.checked && imagesQueue.length > 1) {
                // Resize based on the target width, keeping original aspect ratio of each individual image!
                const w = parseInt(resizeWidth.value) || item.imgNode.naturalWidth;
                targetWidth = w;
                targetHeight = Math.round(w / item.originalAspectRatio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(item.imgNode, 0, 0, targetWidth, targetHeight);

            // Convert to blob and wait
            await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        item.processedBlob = blob;
                        if (item.processedUrl) {
                            URL.revokeObjectURL(item.processedUrl);
                        }
                        item.processedUrl = URL.createObjectURL(blob);
                        item.targetWidth = targetWidth;
                        item.targetHeight = targetHeight;
                    }
                    resolve();
                }, format, quality);
            });
        }

        renderResults();
    }

    // Render previews and stats
    function renderResults() {
        if (imagesQueue.length === 0) return;

        if (imagesQueue.length === 1) {
            // Show single image view
            singlePreviewSection.style.display = "block";
            multiPreviewSection.style.display = "none";

            const item = imagesQueue[0];
            processedPreview.src = item.processedUrl;
            
            origSizeEl.textContent = formatBytes(item.size);
            compSizeEl.textContent = formatBytes(item.processedBlob.size);
            processedDims.textContent = `${item.targetWidth} x ${item.targetHeight} px`;

            const diff = item.size - item.processedBlob.size;
            if (diff > 0) {
                const savingsPct = Math.round((diff / item.size) * 100);
                savingsValEl.textContent = `${savingsPct}%`;
                savingsWrapper.style.display = "flex";
            } else {
                savingsWrapper.style.display = "none";
            }
        } else {
            // Show multi image view
            singlePreviewSection.style.display = "none";
            multiPreviewSection.style.display = "block";

            multiImagesContainer.innerHTML = "";

            imagesQueue.forEach((item, index) => {
                const diff = item.size - item.processedBlob.size;
                const savingsPct = diff > 0 ? Math.round((diff / item.size) * 100) : 0;
                
                const card = document.createElement("div");
                card.className = "multi-image-item";

                card.innerHTML = `
                    <div class="multi-image-thumb">
                        <img src="${item.processedUrl}" alt="${item.name}">
                    </div>
                    <div class="multi-image-info">
                        <span class="multi-image-name" title="${item.name}">${item.name}</span>
                        <div class="multi-image-stats">
                            <span>Size: ${formatBytes(item.size)}</span>
                            <i class="ph-bold ph-arrow-right"></i>
                            <span style="color: var(--cyan);">${formatBytes(item.processedBlob.size)}</span>
                            ${savingsPct > 0 ? `<span class="savings-pct">Saved ${savingsPct}%</span>` : ''}
                        </div>
                    </div>
                    <button class="multi-image-action" data-index="${index}" title="Download this image">
                        <i class="ph-bold ph-download-simple"></i>
                    </button>
                `;

                // Add individual download listener
                card.querySelector(".multi-image-action").addEventListener("click", () => {
                    downloadSingle(index);
                });

                multiImagesContainer.appendChild(card);
            });
        }
    }

    // Download a single processed image by index
    function downloadSingle(index) {
        const item = imagesQueue[index];
        if (!item || !item.processedBlob) return;

        const formatMap = {
            "image/webp": "webp",
            "image/jpeg": "jpg",
            "image/png": "png"
        };
        const ext = formatMap[outputFormat.value] || "png";
        
        const lastDot = item.name.lastIndexOf(".");
        const baseName = lastDot !== -1 ? item.name.substring(0, lastDot) : item.name;
        const downloadName = `${baseName}_compressed.${ext}`;

        const a = document.createElement("a");
        a.href = item.processedUrl;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Trigger single download button click (for single mode)
    downloadBtn.addEventListener("click", () => {
        if (imagesQueue.length === 1) {
            downloadSingle(0);
        }
    });

    // ZIP download listener
    zipDownloadBtn.addEventListener("click", async () => {
        if (imagesQueue.length < 2) return;

        zipDownloadBtn.disabled = true;
        const originalText = zipDownloadBtn.innerHTML;
        zipDownloadBtn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Generating ZIP file...`;

        const zip = new JSZip();
        const formatMap = {
            "image/webp": "webp",
            "image/jpeg": "jpg",
            "image/png": "png"
        };
        const ext = formatMap[outputFormat.value] || "png";

        imagesQueue.forEach((item) => {
            const lastDot = item.name.lastIndexOf(".");
            const baseName = lastDot !== -1 ? item.name.substring(0, lastDot) : item.name;
            const fileName = `${baseName}_compressed.${ext}`;
            zip.file(fileName, item.processedBlob);
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `zanketsu_images_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("An error occurred while generating the ZIP file.");
        } finally {
            zipDownloadBtn.disabled = false;
            zipDownloadBtn.innerHTML = originalText;
        }
    });

    // Reset to initial screen
    resetBtn.addEventListener("click", () => {
        imagesQueue.forEach(item => {
            if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
        });
        imagesQueue = [];
        originalAspectRatio = 1;

        fileInput.value = "";
        dropzone.style.display = "flex";
        settingsPanel.style.display = "none";
        noImgPlaceholder.style.display = "flex";
        resultsContent.style.display = "none";
    });
});
