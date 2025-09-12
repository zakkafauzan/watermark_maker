# Watermark Maker

A lightweight, client-side image watermarking tool. Upload one or many images, preview a live watermark overlay, tweak settings, and export results as a ZIP or individual PNGs.

## Features

- Multi-image upload (click or drag-and-drop)
- Live preview on a large canvas of the first image
- Watermark controls:
  - Text content, font family, color, and size
  - Opacity (0–100%)
  - Optional background: none or color
  - Repeat modes: x, y, xy, none
  - Repeat spacing (px)
  - Rotation: -360° to 360°
- Export options:
  - All watermarked images as PNGs inside a ZIP
  - Individual PNG export of the current image
  - Uses File System Access API when available (Save As dialog), falls back to download

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/watermark_maker.git
   cd watermark_maker
   ```
2. Open `index.html` in your browser.

No build step or server is required. Everything runs in the browser.

## Usage

1. Click “Choose Images” or drop images into the dropzone.
2. Adjust watermark settings under “Watermark Settings”.
   - Enter text and adjust font, color, and size.
   - Set opacity.
   - Choose background mode (none or color) and color if needed.
   - Select repeat mode and adjust spacing (px).
   - Rotate the watermark as needed.
3. The first image shows a live preview.
4. Click “Export ZIP” to save all selected images with the watermark applied, or “Export PNG” to save just the currently previewed image.

## Notes

- Processing happens entirely client-side using `<canvas>`.
- Exported images are PNG to preserve quality and transparency of the watermark background if used.
- Preview vs export can differ. The preview canvas may be scaled to fit the screen, while export renders at the image's export size. As a result, the apparent text size relative to the image in preview may not exactly match the exported file.
- Very large images may be scaled in preview; export aims to render at the intended output size. You can adjust sizing in `app.js` (see `exportAllAsZip()` / `exportAllAsPng()`).

## Tech Stack

- HTML, CSS, JavaScript
- Canvas 2D for rendering
- JSZip for ZIP generation

## Project Structure

```
.
├─ index.html      # Markup; links styles and scripts
├─ styles.css      # Styling
├─ app.js          # App logic (upload, controls, rendering, export)
└─ README.md       # This file
```

## Customization

- Change default fonts, sizes, and theme colors in `styles.css`.
- Modify export size logic in `app.js` within `exportAllAsZip()` / `exportAllAsPng()` (offscreen canvas width/height).

## License

MIT
