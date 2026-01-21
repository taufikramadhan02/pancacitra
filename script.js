// Deklarasi variabel global
        const canvasBefore = document.getElementById('canvasBefore');
        const canvasAfter = document.getElementById('canvasAfter');
        const ctxBefore = canvasBefore.getContext('2d');
        const ctxAfter = canvasAfter.getContext('2d');
        let original = null;
        let currentImage = null;

        // Inisialisasi
        document.addEventListener('DOMContentLoaded', function() {
            openPanel('filter');
        });

        // Fungsi navigasi
        function showHome() {
            document.getElementById('home').style.display = 'block';
            document.getElementById('features').style.display = 'none';
        }

        function showFeatures() {
            document.getElementById('home').style.display = 'none';
            document.getElementById('features').style.display = 'block';
        }

        function openPanel(id) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.list-group-item').forEach(i => i.classList.remove('active'));

            const panelId = id + 'Panel';
            document.getElementById(panelId).classList.add('active');
            event.target.classList.add('active');
        }

        // Event listener untuk upload gambar
        document.getElementById('imageInput').addEventListener('change', function(e) {
            if (!e.target.files[0]) return;

            if (!e.target.files[0].type.match('image.*')) {
                alert('Silakan pilih file gambar (JPEG, PNG, dll)');
                return;
            }

            const img = new Image();
            const reader = new FileReader();

            reader.onload = function(ev) {
                img.src = ev.target.result;
                img.onload = function() {
                    const maxWidth = 600;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvasBefore.width = canvasAfter.width = width;
                    canvasBefore.height = canvasAfter.height = height;

                    ctxBefore.drawImage(img, 0, 0, width, height);
                    original = ctxBefore.getImageData(0, 0, width, height);
                    currentImage = original;
                    process();
                };
            };

            reader.readAsDataURL(e.target.files[0]);
        });

        // Event listeners untuk slider dan dropdown
        document.getElementById('brightness').addEventListener('input', function() {
            document.getElementById('brightnessVal').textContent = this.value;
            process();
        });

        document.getElementById('contrast').addEventListener('input', function() {
            document.getElementById('contrastVal').textContent = parseFloat(this.value).toFixed(1);
            process();
        });

        document.getElementById('saturation').addEventListener('input', function() {
            document.getElementById('saturationVal').textContent = parseFloat(this.value).toFixed(1);
            process();
        });

        document.getElementById('hue').addEventListener('input', function() {
            document.getElementById('hueVal').textContent = this.value + '°';
            process();
        });

        document.getElementById('smoothSize').addEventListener('input', function() {
            document.getElementById('smoothSizeVal').textContent = this.value;
            process();
        });

        document.getElementById('sharpenAmount').addEventListener('input', function() {
            document.getElementById('sharpenAmountVal').textContent = parseFloat(this.value).toFixed(1);
            process();
        });

        document.getElementById('thresholdValue').addEventListener('input', function() {
            document.getElementById('thresholdVal').textContent = this.value;
            process();
        });

        document.getElementById('filterType').addEventListener('change', process);
        document.getElementById('edgeType').addEventListener('change', process);
        document.getElementById('smoothType').addEventListener('change', process);
        document.getElementById('sharpenType').addEventListener('change', process);
        document.getElementById('thresholdType').addEventListener('change', process);

        // Fungsi utama pemrosesan
        function process() {
            if (!original) return;

            let img = new ImageData(new Uint8ClampedArray(original.data), original.width, original.height);

            // Terapkan filter warna
            const filterType = document.getElementById('filterType').value;
            if (filterType === 'grayscale') img = grayscale(img);
            if (filterType === 'negative') img = negative(img);
            if (filterType === 'sepia') img = sepia(img);
            if (filterType === 'red' || filterType === 'green' || filterType === 'blue') {
                img = colorFilter(img, filterType);
            }

            // Terapkan penyesuaian gambar
            const brightnessVal = parseInt(document.getElementById('brightness').value);
            const contrastVal = parseFloat(document.getElementById('contrast').value);
            const saturationVal = parseFloat(document.getElementById('saturation').value);
            const hueVal = parseInt(document.getElementById('hue').value);

            if (brightnessVal !== 0) img = brightnessFn(img, brightnessVal);
            if (contrastVal !== 1.0) img = contrastFn(img, contrastVal);
            if (saturationVal !== 1.0) img = saturationFn(img, saturationVal);
            if (hueVal !== 0) img = hueFn(img, hueVal);

            // Terapkan smoothing
            const smoothType = document.getElementById('smoothType').value;
            const smoothSize = parseInt(document.getElementById('smoothSize').value);
            if (smoothType === 'mean') img = meanFilter(img, smoothSize);
            if (smoothType === 'gaussian') img = gaussianFilter(img, smoothSize);
            if (smoothType === 'median') img = medianFilter(img, smoothSize);

            // Terapkan sharpening
            const sharpenType = document.getElementById('sharpenType').value;
            const sharpenAmount = parseFloat(document.getElementById('sharpenAmount').value);
            if (sharpenType === 'basic') img = basicSharpen(img, sharpenAmount);
            if (sharpenType === 'unsharp') img = unsharpMask(img, sharpenAmount);

            // Terapkan edge detection
            const edgeType = document.getElementById('edgeType').value;
            if (edgeType !== 'off') img = edgeDetect(img, edgeType);

            // Terapkan thresholding
            const thresholdType = document.getElementById('thresholdType').value;
            const thresholdValue = parseInt(document.getElementById('thresholdValue').value);
            if (thresholdType === 'binary') img = binaryThreshold(img, thresholdValue);
            if (thresholdType === 'otsu') img = otsuThreshold(img);

            // Simpan gambar saat ini dan tampilkan
            currentImage = img;
            ctxAfter.putImageData(img, 0, 0);
        }

        // ==================== FUNGSI TRANSFORMASI ====================
        function flipHorizontal() {
            if (!currentImage) return;
            const img = currentImage;
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const srcIdx = (y * w + x) * 4;
                    const dstIdx = (y * w + (w - 1 - x)) * 4;
                    out.data[dstIdx] = img.data[srcIdx];
                    out.data[dstIdx + 1] = img.data[srcIdx + 1];
                    out.data[dstIdx + 2] = img.data[srcIdx + 2];
                    out.data[dstIdx + 3] = img.data[srcIdx + 3];
                }
            }

            currentImage = out;
            ctxAfter.putImageData(out, 0, 0);
        }

        function flipVertical() {
            if (!currentImage) return;
            const img = currentImage;
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const srcIdx = (y * w + x) * 4;
                    const dstIdx = ((h - 1 - y) * w + x) * 4;
                    out.data[dstIdx] = img.data[srcIdx];
                    out.data[dstIdx + 1] = img.data[srcIdx + 1];
                    out.data[dstIdx + 2] = img.data[srcIdx + 2];
                    out.data[dstIdx + 3] = img.data[srcIdx + 3];
                }
            }

            currentImage = out;
            ctxAfter.putImageData(out, 0, 0);
        }

        function rotate90() {
            if (!currentImage) return;
            const img = currentImage;
            const w = img.width,
                h = img.height;

            // Tukar width dan height
            canvasAfter.width = h;
            canvasAfter.height = w;
            const out = new ImageData(h, w);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const srcIdx = (y * w + x) * 4;
                    const dstIdx = (x * h + (h - 1 - y)) * 4;
                    out.data[dstIdx] = img.data[srcIdx];
                    out.data[dstIdx + 1] = img.data[srcIdx + 1];
                    out.data[dstIdx + 2] = img.data[srcIdx + 2];
                    out.data[dstIdx + 3] = img.data[srcIdx + 3];
                }
            }

            currentImage = out;
            ctxAfter.putImageData(out, 0, 0);
        }

        function rotate180() {
            if (!currentImage) return;
            const img = currentImage;
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const srcIdx = (y * w + x) * 4;
                    const dstIdx = ((h - 1 - y) * w + (w - 1 - x)) * 4;
                    out.data[dstIdx] = img.data[srcIdx];
                    out.data[dstIdx + 1] = img.data[srcIdx + 1];
                    out.data[dstIdx + 2] = img.data[srcIdx + 2];
                    out.data[dstIdx + 3] = img.data[srcIdx + 3];
                }
            }

            currentImage = out;
            ctxAfter.putImageData(out, 0, 0);
        }

        function rotate270() {
            if (!currentImage) return;
            const img = currentImage;
            const w = img.width,
                h = img.height;

            // Tukar width dan height
            canvasAfter.width = h;
            canvasAfter.height = w;
            const out = new ImageData(h, w);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const srcIdx = (y * w + x) * 4;
                    const dstIdx = ((w - 1 - x) * h + y) * 4;
                    out.data[dstIdx] = img.data[srcIdx];
                    out.data[dstIdx + 1] = img.data[srcIdx + 1];
                    out.data[dstIdx + 2] = img.data[srcIdx + 2];
                    out.data[dstIdx + 3] = img.data[srcIdx + 3];
                }
            }

            currentImage = out;
            ctxAfter.putImageData(out, 0, 0);
        }

        // ==================== FUNGSI FILTER WARNA ====================
        function grayscale(img) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                resultData[i] = resultData[i + 1] = resultData[i + 2] = gray;
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        function negative(img) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                resultData[i] = 255 - data[i];
                resultData[i + 1] = 255 - data[i + 1];
                resultData[i + 2] = 255 - data[i + 2];
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        function sepia(img) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                resultData[i] = clamp(r * 0.393 + g * 0.769 + b * 0.189);
                resultData[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
                resultData[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131) ;
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        function colorFilter(img, channel) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                if (channel === 'red') {
                    resultData[i] = data[i];
                    resultData[i + 1] = 0;
                    resultData[i + 2] = 0;
                } else if (channel === 'green') {
                    resultData[i] = 0;
                    resultData[i + 1] = data[i + 1];
                    resultData[i + 2] = 0;
                } else if (channel === 'blue') {
                    resultData[i] = 0;
                    resultData[i + 1] = 0;
                    resultData[i + 2] = data[i + 2];
                } else {
                    resultData[i] = data[i];
                    resultData[i + 1] = data[i + 1];
                    resultData[i + 2] = data[i + 2];
                }
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        // ==================== FUNGSI PENYESUAIAN ====================
        function brightnessFn(img, val) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                resultData[i] = clamp(data[i] + val);
                resultData[i + 1] = clamp(data[i + 1] + val);
                resultData[i + 2] = clamp(data[i + 2] + val);
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        function contrastFn(img, factor) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = (data[i] / 255 - 0.5) * factor + 0.5;
                const g = (data[i + 1] / 255 - 0.5) * factor + 0.5;
                const b = (data[i + 2] / 255 - 0.5) * factor + 0.5;

                resultData[i] = clamp(r * 255);
                resultData[i + 1] = clamp(g * 255);
                resultData[i + 2] = clamp(b * 255);
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        function saturationFn(img, factor) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                resultData[i] = clamp(gray + factor * (r - gray));
                resultData[i + 1] = clamp(gray + factor * (g - gray));
                resultData[i + 2] = clamp(gray + factor * (b - gray));
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        function hueFn(img, angle) {
            const result = new ImageData(img.width, img.height);
            const data = img.data;
            const resultData = result.data;

            const hueAngle = (angle % 360) * Math.PI / 180;
            const cos = Math.cos(hueAngle);
            const sin = Math.sin(hueAngle);

            const matrix = [
                [
                    0.213 + cos * 0.787 - sin * 0.213,
                    0.715 - cos * 0.715 - sin * 0.715,
                    0.072 - cos * 0.072 + sin * 0.928
                ],
                [
                    0.213 - cos * 0.213 + sin * 0.143,
                    0.715 + cos * 0.285 + sin * 0.140,
                    0.072 - cos * 0.072 - sin * 0.283
                ],
                [
                    0.213 - cos * 0.213 - sin * 0.787,
                    0.715 - cos * 0.715 + sin * 0.715,
                    0.072 + cos * 0.928 + sin * 0.072
                ]
            ];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                resultData[i] = clamp(r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]);
                resultData[i + 1] = clamp(r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]);
                resultData[i + 2] = clamp(r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]);
                resultData[i + 3] = data[i + 3];
            }
            return result;
        }

        // ==================== FUNGSI SMOOTHING ====================
        function meanFilter(img, size) {
            return convolveUniform(img, size);
        }

        function gaussianFilter(img, size) {
            const sigma = size / 3;
            const kernel = [];
            const half = Math.floor(size / 2);
            let sum = 0;

            for (let y = -half; y <= half; y++) {
                const row = [];
                for (let x = -half; x <= half; x++) {
                    const val = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                    row.push(val);
                    sum += val;
                }
                kernel.push(row);
            }

            for (let i = 0; i < kernel.length; i++) {
                for (let j = 0; j < kernel[i].length; j++) {
                    kernel[i][j] /= sum;
                }
            }

            return convolveKernel(img, kernel);
        }

        function medianFilter(img, size) {
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);
            const half = Math.floor(size / 2);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const rVals = [],
                        gVals = [],
                        bVals = [];

                    for (let ky = -half; ky <= half; ky++) {
                        for (let kx = -half; kx <= half; kx++) {
                            const py = Math.min(Math.max(y + ky, 0), h - 1);
                            const px = Math.min(Math.max(x + kx, 0), w - 1);
                            const idx = (py * w + px) * 4;
                            rVals.push(img.data[idx]);
                            gVals.push(img.data[idx + 1]);
                            bVals.push(img.data[idx + 2]);
                        }
                    }

                    rVals.sort((a, b) => a - b);
                    gVals.sort((a, b) => a - b);
                    bVals.sort((a, b) => a - b);

                    const mid = Math.floor(rVals.length / 2);
                    const i = (y * w + x) * 4;
                    out.data[i] = rVals[mid];
                    out.data[i + 1] = gVals[mid];
                    out.data[i + 2] = bVals[mid];
                    out.data[i + 3] = 255;
                }
            }
            return out;
        }

        // ==================== FUNGSI SHARPENING ====================
        function basicSharpen(img, amount) {
            const kernel = [
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0]
            ];
            const sharpened = convolveKernel(img, kernel);
            return blendImages(img, sharpened, amount);
        }

        function unsharpMask(img, amount) {
            const blurred = gaussianFilter(img, 5);
            const out = new ImageData(img.width, img.height);

            for (let i = 0; i < img.data.length; i += 4) {
                out.data[i] = clamp(img.data[i] + amount * (img.data[i] - blurred.data[i]));
                out.data[i + 1] = clamp(img.data[i + 1] + amount * (img.data[i + 1] - blurred.data[i + 1]));
                out.data[i + 2] = clamp(img.data[i + 2] + amount * (img.data[i + 2] - blurred.data[i + 2]));
                out.data[i + 3] = 255;
            }
            return out;
        }

        // ==================== FUNGSI DETEKSI TEPI ====================
        function edgeDetect(img, type) {
            const grayImg = grayscale(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height));

            if (type === 'roberts') {
                return robertsEdge(grayImg);
            } else if (type === 'prewitt') {
                const kernelX = [
                    [-1, 0, 1],
                    [-1, 0, 1],
                    [-1, 0, 1]
                ];
                return sobelGradient(grayImg, kernelX);
            } else if (type === 'sobel') {
                const kernelX = [
                    [-1, 0, 1],
                    [-2, 0, 2],
                    [-1, 0, 1]
                ];
                return sobelGradient(grayImg, kernelX);
            } else if (type === 'laplacian') {
                const kernel = [
                    [0, 1, 0],
                    [1, -4, 1],
                    [0, 1, 0]
                ];
                return convolveKernel(grayImg, kernel);
            } else if (type === 'canny') {
                return cannyEdge(grayImg);
            }
            return img;
        }

        function robertsEdge(img) {
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);

            for (let y = 0; y < h - 1; y++) {
                for (let x = 0; x < w - 1; x++) {
                    const idx1 = (y * w + x) * 4;
                    const idx2 = (y * w + (x + 1)) * 4;
                    const idx3 = ((y + 1) * w + x) * 4;
                    const idx4 = ((y + 1) * w + (x + 1)) * 4;

                    const gray1 = 0.299 * img.data[idx1] + 0.587 * img.data[idx1 + 1] + 0.114 * img.data[idx1 + 2];
                    const gray2 = 0.299 * img.data[idx2] + 0.587 * img.data[idx2 + 1] + 0.114 * img.data[idx2 + 2];
                    const gray3 = 0.299 * img.data[idx3] + 0.587 * img.data[idx3 + 1] + 0.114 * img.data[idx3 + 2];
                    const gray4 = 0.299 * img.data[idx4] + 0.587 * img.data[idx4 + 1] + 0.114 * img.data[idx4 + 2];

                    const gx = gray4 - gray1;
                    const gy = gray3 - gray2;
                    const mag = Math.sqrt(gx * gx + gy * gy);

                    const normalized = clamp(mag);
                    const i = (y * w + x) * 4;
                    out.data[i] = out.data[i + 1] = out.data[i + 2] = normalized;
                    out.data[i + 3] = 255;
                }
            }
            return out;
        }

        function sobelGradient(img, kernel) {
            const kx = kernel;
            const ky = kernel[0].map((_, i) => kernel.map(row => row[i])).reverse();

            const gxImg = convolveKernel(img, kx);
            const gyImg = convolveKernel(img, ky);

            const out = new ImageData(img.width, img.height);
            for (let i = 0; i < out.data.length; i += 4) {
                const gx = gxImg.data[i];
                const gy = gyImg.data[i];
                const mag = Math.sqrt(gx * gx + gy * gy);
                out.data[i] = out.data[i + 1] = out.data[i + 2] = clamp(mag);
                out.data[i + 3] = 255;
            }
            return out;
        }

        function cannyEdge(img) {
            const blurred = gaussianFilter(img, 5);
            const sobel = [
                [-1, 0, 1],
                [-2, 0, 2],
                [-1, 0, 1]
            ];
            const edges = sobelGradient(blurred, sobel);
            return binaryThreshold(edges, 100);
        }

        // === FUNGSI THRESHOLDING ==
        function binaryThreshold(img, thresh) {
            const gray = grayscale(img);
            for (let i = 0; i < gray.data.length; i += 4) {
                const val = gray.data[i] > thresh ? 255 : 0;
                gray.data[i] = gray.data[i + 1] = gray.data[i + 2] = val;
            }
            return gray;
        }

        function otsuThreshold(img) {
            img = grayscale(img);
            const hist = new Array(256).fill(0);
            const total = img.width * img.height;

            for (let i = 0; i < img.data.length; i += 4) {
                hist[img.data[i]]++;
            }

            let sum = 0;
            for (let i = 0; i < 256; i++) sum += i * hist[i];

            let sumB = 0,
                wB = 0,
                wF = 0;
            let maxVar = 0,
                threshold = 0;

            for (let t = 0; t < 256; t++) {
                wB += hist[t];
                if (wB === 0) continue;

                wF = total - wB;
                if (wF === 0) break;

                sumB += t * hist[t];
                const mB = sumB / wB;
                const mF = (sum - sumB) / wF;
                const varBetween = wB * wF * (mB - mF) * (mB - mF);

                if (varBetween > maxVar) {
                    maxVar = varBetween;
                    threshold = t;
                }
            }

            return binaryThreshold(img, threshold);
        }

        // == FUNGSI HISTOGRAM ==
        function drawHistogram() {
            if (!canvasAfter.width) return;
            const img = ctxAfter.getImageData(0, 0, canvasAfter.width, canvasAfter.height);
            const hist = new Array(256).fill(0);

            for (let i = 0; i < img.data.length; i += 4) {
                const gray = Math.round(0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]);
                hist[gray]++;
            }

            const canvas = document.getElementById('histCanvas');
            canvas.width = canvas.offsetWidth;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const max = Math.max(...hist);
            const barWidth = canvas.width / 256;

            ctx.fillStyle = '#2c3e50';
            hist.forEach((v, i) => {
                const h = (v / max) * canvas.height;
                ctx.fillRect(i * barWidth, canvas.height - h, barWidth, h);
            });

            // grid dan label
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 4; i++) {
                const y = canvas.height * (i / 4);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            ctx.fillStyle = '#495057';
            ctx.font = '10px Arial';
            ctx.fillText('0', 5, canvas.height - 5);
            ctx.fillText('255', canvas.width - 20, canvas.height - 5);
        }

        function equalizeHistogram() {
            if (!original) return;
            let img = new ImageData(new Uint8ClampedArray(original.data), original.width, original.height);
            img = grayscale(img);

            const hist = new Array(256).fill(0);
            const total = img.width * img.height;

            for (let i = 0; i < img.data.length; i += 4) {
                hist[img.data[i]]++;
            }

            const cdf = new Array(256);
            cdf[0] = hist[0];
            for (let i = 1; i < 256; i++) {
                cdf[i] = cdf[i - 1] + hist[i];
            }

            const cdfMin = cdf.find(v => v > 0);
            const lookup = new Array(256);
            for (let i = 0; i < 256; i++) {
                lookup[i] = Math.round(((cdf[i] - cdfMin) / (total - cdfMin)) * 255);
            }

            for (let i = 0; i < img.data.length; i += 4) {
                const val = lookup[img.data[i]];
                img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
            }

            currentImage = img;
            ctxAfter.putImageData(img, 0, 0);
            drawHistogram();
        }

        // ==================== FUNGSI UTILITAS ====================
        function convolveUniform(img, size) {
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);
            const half = Math.floor(size / 2);
            const area = size * size;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let r = 0,
                        g = 0,
                        b = 0;

                    for (let ky = -half; ky <= half; ky++) {
                        for (let kx = -half; kx <= half; kx++) {
                            const py = Math.min(Math.max(y + ky, 0), h - 1);
                            const px = Math.min(Math.max(x + kx, 0), w - 1);
                            const idx = (py * w + px) * 4;
                            r += img.data[idx];
                            g += img.data[idx + 1];
                            b += img.data[idx + 2];
                        }
                    }

                    const i = (y * w + x) * 4;
                    out.data[i] = clamp(r / area);
                    out.data[i + 1] = clamp(g / area);
                    out.data[i + 2] = clamp(b / area);
                    out.data[i + 3] = 255;
                }
            }
            return out;
        }

        function convolveKernel(img, kernel) {
            const w = img.width,
                h = img.height;
            const out = new ImageData(w, h);
            const half = Math.floor(kernel.length / 2);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let r = 0,
                        g = 0,
                        b = 0;

                    for (let ky = 0; ky < kernel.length; ky++) {
                        for (let kx = 0; kx < kernel[ky].length; kx++) {
                            const py = Math.min(Math.max(y + ky - half, 0), h - 1);
                            const px = Math.min(Math.max(x + kx - half, 0), w - 1);
                            const idx = (py * w + px) * 4;
                            const k = kernel[ky][kx];
                            r += img.data[idx] * k;
                            g += img.data[idx + 1] * k;
                            b += img.data[idx + 2] * k;
                        }
                    }

                    const i = (y * w + x) * 4;
                    out.data[i] = clamp(r);
                    out.data[i + 1] = clamp(g);
                    out.data[i + 2] = clamp(b);
                    out.data[i + 3] = 255;
                }
            }
            return out;
        }

        function blendImages(img1, img2, alpha) {
            const out = new ImageData(img1.width, img1.height);
            for (let i = 0; i < out.data.length; i += 4) {
                out.data[i] = clamp(img1.data[i] * (1 - alpha) + img2.data[i] * alpha);
                out.data[i + 1] = clamp(img1.data[i + 1] * (1 - alpha) + img2.data[i + 1] * alpha);
                out.data[i + 2] = clamp(img1.data[i + 2] * (1 - alpha) + img2.data[i + 2] * alpha);
                out.data[i + 3] = 255;
            }
            return out;
        }

        function resetImage() {
            if (!original) return;

            // Reset canvas size
            canvasAfter.width = canvasBefore.width;
            canvasAfter.height = canvasBefore.height;

            // Reset ke gambar asli
            ctxAfter.putImageData(original, 0, 0);
            currentImage = original;

            // Reset semua kontrol
            document.getElementById('brightness').value = 0;
            document.getElementById('brightnessVal').textContent = '0';
            document.getElementById('contrast').value = 1.0;
            document.getElementById('contrastVal').textContent = '1.0';
            document.getElementById('saturation').value = 1.0;
            document.getElementById('saturationVal').textContent = '1.0';
            document.getElementById('hue').value = 0;
            document.getElementById('hueVal').textContent = '0°';
            document.getElementById('filterType').value = 'none';
            document.getElementById('edgeType').value = 'off';
            document.getElementById('smoothType').value = 'off';
            document.getElementById('smoothSize').value = 3;
            document.getElementById('smoothSizeVal').textContent = '3';
            document.getElementById('sharpenType').value = 'off';
            document.getElementById('sharpenAmount').value = 1.0;
            document.getElementById('sharpenAmountVal').textContent = '1.0';
            document.getElementById('thresholdType').value = 'off';
            document.getElementById('thresholdValue').value = 128;
            document.getElementById('thresholdVal').textContent = '128';

            // Reset histogram
            const histCanvas = document.getElementById('histCanvas');
            const histCtx = histCanvas.getContext('2d');
            histCtx.clearRect(0, 0, histCanvas.width, histCanvas.height);
        }

        function downloadImage() {
            if (!canvasAfter.width) {
                alert('Tidak ada gambar untuk diunduh');
                return;
            }

            const link = document.createElement('a');
            link.download = 'sicitra-result.png';
            link.href = canvasAfter.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function clamp(v) {
            return Math.max(0, Math.min(255, Math.round(v)));
        }