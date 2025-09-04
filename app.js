'use strict';
(function() {
	const input = document.getElementById('file-input');
	const dropzone = document.getElementById('dropzone');
	const preview = document.getElementById('preview');
	const pickBtn = document.getElementById('pick-btn');
	const clearBtn = document.getElementById('clear-btn');
	const summary = document.getElementById('summary');

	let filesState = [];

	function formatBytes(bytes) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function updateSummary() {
		if (filesState.length === 0) {
			summary.textContent = 'No files selected.';
			return;
		}
		const totalBytes = filesState.reduce((acc, f) => acc + f.size, 0);
		summary.textContent = `${filesState.length} file(s) • ${formatBytes(totalBytes)}`;
	}

	function clearAll() {
		filesState = [];
		preview.innerHTML = '';
		input.value = '';
		updateSummary();
	}

	function isImage(file) {
		return file && file.type.startsWith('image/');
	}

	function addFiles(fileList) {
		const incoming = Array.from(fileList).filter(isImage);
		if (incoming.length === 0) return;
		filesState = filesState.concat(incoming);
		render();
	}

	function render() {
		preview.innerHTML = '';
		filesState.forEach((file) => {
			const card = document.createElement('div');
			card.className = 'card';

			const thumb = document.createElement('div');
			thumb.className = 'thumb';
			const img = document.createElement('img');
			img.alt = file.name;
			img.src = URL.createObjectURL(file);
			img.onload = () => URL.revokeObjectURL(img.src);
			thumb.appendChild(img);

			const info = document.createElement('div');
			info.className = 'info';
			const name = document.createElement('div');
			name.className = 'name';
			name.textContent = file.name;
			const details = document.createElement('div');
			details.className = 'details';
			details.textContent = `${file.type || 'image'} • ${formatBytes(file.size)}`;
			info.appendChild(name);
			info.appendChild(details);

			card.appendChild(thumb);
			card.appendChild(info);
			preview.appendChild(card);
		});
		updateSummary();
	}

	// Wiring
	input.addEventListener('change', (e) => {
		addFiles(e.target.files);
	});

	pickBtn.addEventListener('click', () => input.click());
	clearBtn.addEventListener('click', clearAll);

	dropzone.addEventListener('click', () => input.click());
	dropzone.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropzone.classList.add('dragover');
	});
	dropzone.addEventListener('dragleave', () => {
		dropzone.classList.remove('dragover');
	});
	dropzone.addEventListener('drop', (e) => {
		e.preventDefault();
		dropzone.classList.remove('dragover');
		if (e.dataTransfer && e.dataTransfer.files) {
			addFiles(e.dataTransfer.files);
		}
	});

	// Controls wiring (values stored for future watermarking logic)
	const wmText = document.getElementById('wm-text');
	const wmFont = document.getElementById('wm-font');
	const wmColor = document.getElementById('wm-color');
	const wmSize = document.getElementById('wm-size');
	const wmOpacity = document.getElementById('wm-opacity');
	const wmOpacityValue = document.getElementById('wm-opacity-value');
	const wmBg = document.getElementById('wm-bg');
	const wmRepeat = document.getElementById('wm-repeat');
	const wmSpacing = document.getElementById('wm-spacing');
	const wmRotation = document.getElementById('wm-rotation');
	const wmRotationValue = document.getElementById('wm-rotation-value');

	const state = {
		text: '',
		fontFamily: 'system-ui',
		color: '#ffffff',
		fontSizePx: 32,
		opacityPct: 100,
		background: '#000000',
		repeat: 'none',
		spacingPx: 24,
		rotationDeg: 0,
	};

	function setRepeat(value) {
		state.repeat = value;
		Array.from(wmRepeat.querySelectorAll('.option')).forEach(btn => {
			btn.classList.toggle('selected', btn.dataset.value === value);
		});
	}

	wmText.addEventListener('input', (e) => { state.text = e.target.value; });
	wmFont.addEventListener('change', (e) => { state.fontFamily = e.target.value; });
	wmColor.addEventListener('input', (e) => { state.color = e.target.value; });
	wmSize.addEventListener('input', (e) => { state.fontSizePx = Math.max(6, Math.min(300, Number(e.target.value) || 32)); });
	wmOpacity.addEventListener('input', (e) => {
		state.opacityPct = Number(e.target.value);
		wmOpacityValue.textContent = state.opacityPct + '%';
	});
	wmBg.addEventListener('input', (e) => { state.background = e.target.value; });
	wmRepeat.addEventListener('click', (e) => {
		const target = e.target.closest('.option');
		if (!target) return;
		setRepeat(target.dataset.value);
	});
	wmSpacing.addEventListener('input', (e) => { state.spacingPx = Math.max(0, Math.min(1000, Number(e.target.value) || 0)); });
	wmRotation.addEventListener('input', (e) => {
		state.rotationDeg = Number(e.target.value);
		wmRotationValue.textContent = state.rotationDeg + '°';
	});

	// Initialize defaults
	setRepeat('none');
	wmOpacityValue.textContent = '100%';
	wmRotationValue.textContent = '0°';

	// Big preview rendering
	const canvas = document.getElementById('big-preview');
	const ctx = canvas.getContext('2d');

	const imgCache = {
		image: null,
		url: null,
		width: 0,
		height: 0,
	};

	function loadFirstImageThenRender() {
		if (filesState.length === 0) {
			imgCache.image = null;
			renderBigPreview();
			return;
		}
		const file = filesState[0];
		if (imgCache.url) URL.revokeObjectURL(imgCache.url);
		imgCache.url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			imgCache.image = image;
			imgCache.width = image.naturalWidth;
			imgCache.height = image.naturalHeight;
			renderBigPreview();
		};
		image.src = imgCache.url;
	}

	function fitCanvasToImage() {
		if (!imgCache.image) {
			// Empty canvas to a pleasant aspect
			canvas.width = 1000;
			canvas.height = 600;
			return;
		}
		// Fit to container width while preserving aspect ratio
		const container = canvas.parentElement;
		const targetWidth = container.clientWidth || 1000;
		const aspect = imgCache.width / imgCache.height;
		const targetHeight = Math.round(targetWidth / aspect);
		canvas.width = targetWidth;
		canvas.height = targetHeight;
	}

	function drawTiledText(context, text, options) {
		const { repeat, rotationDeg, font, color, sizePx, opacity, bgMode, bgColor, spacingPx } = options;
		if (!text) return;
		context.save();
		context.globalAlpha = opacity;
		context.fillStyle = color;
		context.textBaseline = 'middle';
		context.textAlign = 'center';
		context.font = `${sizePx}px ${font}`;

		const metrics = context.measureText(text);
		const textW = Math.ceil(metrics.width);
		const textH = Math.ceil(sizePx * 1.2);

		// draw single or repeated patterns
		const gapX = Math.max(0, spacingPx ?? 24);
		const gapY = gapX;
		const stepX = repeat === 'y' || repeat === 'none' ? canvas.width + 1 : Math.max(1, textW + gapX);
		const stepY = repeat === 'x' || repeat === 'none' ? canvas.height + 1 : Math.max(1, textH + gapY);

		const startX = stepX === canvas.width + 1 ? canvas.width / 2 : 0;
		const startY = stepY === canvas.height + 1 ? canvas.height / 2 : 0;

		for (let y = startY; y <= canvas.height; y += stepY) {
			for (let x = startX; x <= canvas.width; x += stepX) {
				context.save();
				context.translate(x, y);
				context.rotate((rotationDeg * Math.PI) / 180);
				if (bgMode === 'color') {
					context.fillStyle = bgColor;
					const padX = 8;
					const padY = 4;
					context.fillRect(-textW / 2 - padX, -textH / 2 - padY, textW + padX * 2, textH + padY * 2);
				}
				context.fillStyle = color;
				context.fillText(text, 0, 0);
				context.restore();
			}
		}
		context.restore();
	}

	function drawImageWithWatermarkToCanvas(canvasTarget, image, options) {
		const context = canvasTarget.getContext('2d');
		const width = canvasTarget.width;
		const height = canvasTarget.height;
		context.clearRect(0, 0, width, height);
		context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, width, height);
		drawTiledText(context, options.text, {
			repeat: options.repeat,
			rotationDeg: options.rotationDeg,
			font: options.font,
			color: options.color,
			sizePx: options.sizePx,
			opacity: options.opacity,
			bgMode: options.bgMode,
			bgColor: options.bgColor,
			spacingPx: options.spacingPx,
		});

		return canvasTarget;
	}

	function renderBigPreview() {
		fitCanvasToImage();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (imgCache.image) {
			// draw scaled image to canvas size
			ctx.drawImage(imgCache.image, 0, 0, imgCache.width, imgCache.height, 0, 0, canvas.width, canvas.height);
		}
		// draw watermark
		drawTiledText(ctx, state.text, {
			repeat: state.repeat,
			rotationDeg: state.rotationDeg,
			font: state.fontFamily,
			color: state.color,
			sizePx: state.fontSizePx,
			opacity: Math.max(0, Math.min(1, state.opacityPct / 100)),
			bgMode: state.backgroundMode || 'none',
			bgColor: state.background || '#000000',
			spacingPx: state.spacingPx,
		});
	}

	async function exportAllAsZip() {
		if (filesState.length === 0) return;
		const zip = new JSZip();
		const folder = zip.folder('watermarked');
		for (const file of filesState) {
			if (!isImage(file)) continue;
			const url = URL.createObjectURL(file);
			const img = await new Promise((resolve, reject) => {
				const im = new Image();
				im.onload = () => resolve(im);
				im.onerror = reject;
				im.src = url;
			});
			URL.revokeObjectURL(url);

			// Prepare offscreen canvas matching preview width but preserving aspect
			const off = document.createElement('canvas');
			const containerWidth = canvas.parentElement.clientWidth || img.naturalWidth;
			off.width = containerWidth;
			off.height = Math.round(containerWidth * (img.naturalHeight / img.naturalWidth));

			drawImageWithWatermarkToCanvas(off, img, {
				text: state.text,
				repeat: state.repeat,
				rotationDeg: state.rotationDeg,
				font: state.fontFamily,
				color: state.color,
				sizePx: state.fontSizePx,
				opacity: Math.max(0, Math.min(1, state.opacityPct / 100)),
				bgMode: state.backgroundMode || 'none',
				bgColor: state.background || '#000000',
				spacingPx: state.spacingPx,
			});

			const blob = await new Promise(resolve => off.toBlob(resolve, 'image/png'));
			folder.file((file.name.replace(/\.[^.]+$/, '') || 'image') + '.png', blob);
		}

		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const suggestedName = 'watermarked_images.zip';

		// If the browser supports the File System Access API, prompt for location
		if (window.showSaveFilePicker) {
			try {
				const handle = await window.showSaveFilePicker({
					suggestedName,
					types: [{ description: 'ZIP files', accept: { 'application/zip': ['.zip'] } }]
				});
				const writable = await handle.createWritable();
				await writable.write(zipBlob);
				await writable.close();
				return;
			} catch (e) {
				// Fallback to download
			}
		}

		const a = document.createElement('a');
		const dlUrl = URL.createObjectURL(zipBlob);
		a.href = dlUrl;
		a.download = suggestedName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(dlUrl);
	}

	document.getElementById('export-zip').addEventListener('click', exportAllAsZip);

	// React to controls and file changes
	const rerender = () => renderBigPreview();
	['input', 'change'].forEach(evt => {
		wmText.addEventListener(evt, rerender);
		wmFont.addEventListener(evt, rerender);
		wmColor.addEventListener(evt, rerender);
		wmSize.addEventListener(evt, rerender);
		wmOpacity.addEventListener(evt, rerender);
		wmBg.addEventListener(evt, rerender);
		wmSpacing.addEventListener(evt, rerender);
		wmRotation.addEventListener(evt, rerender);
	});
	wmRepeat.addEventListener('click', rerender);

	// Background mode toggle
	const wmBgMode = document.getElementById('wm-bg-mode');
	wmBgMode.addEventListener('change', () => {
		state.backgroundMode = wmBgMode.value;
		wmBg.style.display = wmBgMode.value === 'color' ? '' : 'none';
		rerender();
	});
	// initialize background mode
	state.backgroundMode = 'none';
	wmBg.style.display = 'none';

	// Override state setters to also trigger rerender
	wmText.addEventListener('input', () => { rerender(); });
	wmFont.addEventListener('change', () => { rerender(); });
	wmColor.addEventListener('input', () => { rerender(); });
	wmSize.addEventListener('input', () => { rerender(); });
	wmOpacity.addEventListener('input', () => { rerender(); });
	wmRotation.addEventListener('input', () => { rerender(); });
	wmRepeat.addEventListener('click', () => { rerender(); });

	// Re-render on size changes
	window.addEventListener('resize', renderBigPreview);

	// Re-render whenever files list changes
	const originalAddFiles = addFiles;
	addFiles = function(fileList) {
		originalAddFiles(fileList);
		loadFirstImageThenRender();
	};
	const originalClearAll = clearAll;
	clearAll = function() {
		originalClearAll();
		loadFirstImageThenRender();
	};

	// First render
	loadFirstImageThenRender();
})();
