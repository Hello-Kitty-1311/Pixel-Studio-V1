class PixelArtApp {
    constructor() {
        this.canvas = document.getElementById('pixelCanvas');
        this.gridSize = 32;
        this.currentColor = '#000000';
        this.currentTool = 'pencil';
        this.symmetryMode = 'none';
        this.zoomLevel = 1;
        this.gridVisible = true;
        this.animating = false;
        this.shortcutsVisible = false;
        this.isDrawing = false;
        this.drawStartPos = null;
        this.opacity = 1;
        this.brushSize = 1;
        this.layers = [];
        this.activeLayer = 0;
        this.undoStack = [];
        this.redoStack = [];

        this.initializeCanvas();
        this.addLayer();
        this.setupEventListeners();
        this.createDefaultPalette();
        this.saveState(); 
    }

    
    initializeCanvas() {
        this.canvas.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.canvas.innerHTML = '';

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.index = i;
            this.canvas.appendChild(pixel);
        }

        this.updateGrid();
    }

    createDefaultPalette() {
        const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#FF9900'];
        const palette = document.querySelector('.color-palette');

        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                this.currentColor = color;
                document.getElementById('colorPicker').value = color;
            });
            palette.appendChild(swatch);
        });
    }

    
    setupEventListeners() {
        this._setupCanvasListeners();
        this._setupToolbarListeners();
        this._setupToolButtons();
        this._setupActionButtons();
        this._setupLayerListeners();
        this._setupModalListeners();
        this._setupKeyboardListeners();
    }

    _setupCanvasListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    _setupToolbarListeners() {
        document.getElementById('colorPicker').addEventListener('input', (e) => this.currentColor = e.target.value);
        document.getElementById('opacitySlider').addEventListener('input', (e) => this.opacity = e.target.value / 100);
        document.getElementById('brushSize').addEventListener('input', (e) => this.brushSize = parseInt(e.target.value));
        document.getElementById('canvasSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.initializeCanvas();
            this.layers = [];
            this.addLayer();
        });
        document.getElementById('symmetryMode').addEventListener('change', (e) => this.symmetryMode = e.target.value);
        document.getElementById('zoomSlider').addEventListener('input', (e) => {
            this.zoomLevel = parseFloat(e.target.value);
            this.updateZoom();
        });
        document.getElementById('gridToggleBtn').addEventListener('click', () => {
            this.gridVisible = !this.gridVisible;
            this.updateGrid();
        });
    }

    _setupToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (document.querySelector('.tool-btn.active')) {
                    document.querySelector('.tool-btn.active').classList.remove('active');
                }
                btn.classList.add('active');
                this.currentTool = btn.id.replace('Btn', '');
            });
        });

        document.getElementById('symmetryBtn').addEventListener('click', () => {
            const symmetrySelect = document.getElementById('symmetryMode');
            const modes = ['none', 'horizontal', 'vertical', 'both'];
            const currentIndex = modes.indexOf(this.symmetryMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            this.symmetryMode = modes[nextIndex];
            symmetrySelect.value = this.symmetryMode;
        });
    }

    _setupActionButtons() {
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('downloadBtn').addEventListener('click', () => this.download());
        document.getElementById('animateBtn').addEventListener('click', () => this.toggleAnimation());
    }

    _setupLayerListeners() {
        document.querySelector('.add-layer-btn').addEventListener('click', () => this.addLayer());
    }

    _setupModalListeners() {
        document.getElementById('shapesBtn').addEventListener('click', () => document.getElementById('shapesModal').style.display = 'flex');
        document.getElementById('patternsBtn').addEventListener('click', () => document.getElementById('patternsModal').style.display = 'flex');

        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.drawShape(btn.dataset.shape);
                document.getElementById('shapesModal').style.display = 'none';
            });
        });

        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.generatePattern(btn.dataset.pattern);
                document.getElementById('patternsModal').style.display = 'none';
            });
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        });
    }

    _setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' || e.key === '/') {
                e.preventDefault();
                this.toggleShortcuts();
            }
        });
    }

    
    handleMouseDown(e) {
        if (e.target.classList.contains('pixel')) {
            this.isDrawing = true;
            this.drawStartPos = parseInt(e.target.dataset.index);
            this.draw(e.target);
        }
    }

    handleMouseMove(e) {
        if (this.isDrawing && e.target.classList.contains('pixel')) {
            this.draw(e.target);
        }
    }

    handleMouseUp() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    
    draw(target) {
        const index = parseInt(target.dataset.index);
        const row = Math.floor(index / this.gridSize);
        const col = index % this.gridSize;

        switch (this.currentTool) {
            case 'pencil':
                this.drawPixel(row, col);
                break;
            case 'eraser':
                this.erasePixel(row, col);
                break;
            case 'eyedropper':
                this.pickColor(index);
                document.getElementById('pencilBtn').click(); 
                break;
            case 'fill':
                this.fillArea(row, col);
                break;
        }
    }

    drawPixel(row, col) {
        this._applySymmetry(row, col, this.drawPixelAtPosition.bind(this));
        this.updateCanvas();
    }

    drawPixelAtPosition(r, c) {
        const colorToApply = this._hexToRgba(this.currentColor, this.opacity);
        this._applyBrush(r, c, (index) => {
            this.layers[this.activeLayer].data[index] = colorToApply;
        });
    }

    erasePixel(row, col) {
        this._applySymmetry(row, col, this.erasePixelAtPosition.bind(this));
        this.updateCanvas();
    }

    erasePixelAtPosition(r, c) {
        this._applyBrush(r, c, (index) => {
            this.layers[this.activeLayer].data[index] = '';
        });
    }

    pickColor(index) {
        let pickedColor = '';
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            if (layer.visible && layer.data[index]) {
                pickedColor = layer.data[index];
                break;
            }
        }

        if (pickedColor) {
            const { hex, alpha } = this._rgbaToHexAndAlpha(pickedColor);
            this.currentColor = hex;
            document.getElementById('colorPicker').value = hex;
            this.opacity = alpha;
            document.getElementById('opacitySlider').value = alpha * 100;
        }
    }

    fillArea(row, col) {
        this.saveState();
        const index = row * this.gridSize + col;
        const targetColor = this.layers[this.activeLayer].data[index] || '';
        const newColor = this._hexToRgba(this.currentColor, this.opacity);

        if (targetColor === newColor) return;

        const stack = [[row, col]];
        const seen = new Set([`${row},${col}`]);

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const idx = r * this.gridSize + c;

            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) continue;
            if ((this.layers[this.activeLayer].data[idx] || '') !== targetColor) continue;

            this.layers[this.activeLayer].data[idx] = newColor;

            const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
            for (const [nr, nc] of neighbors) {
                if (!seen.has(`${nr},${nc}`)) {
                    stack.push([nr, nc]);
                    seen.add(`${nr},${nc}`);
                }
            }
        }
        this.updateCanvas();
    }

    
    drawShape(shape) {
        if (this.drawStartPos === null) return;
        this.saveState();
        const startRow = Math.floor(this.drawStartPos / this.gridSize);
        const startCol = this.drawStartPos % this.gridSize;
        const size = Math.floor(this.gridSize / 4);
        const color = this._hexToRgba(this.currentColor, this.opacity);

        const drawFuncs = {
            rectangle: () => this.drawRectangle(startRow, startCol, size, size, color),
            circle: () => this.drawCircle(startRow, startCol, Math.floor(size / 2), color),
            triangle: () => this.drawTriangle(startRow, startCol, size, color),
            line: () => this.drawLine(startRow, startCol, startRow, startCol + size, color),
        };
        if (drawFuncs[shape]) drawFuncs[shape]();
        this.updateCanvas();
    }

    drawRectangle(r, c, h, w, color) {
        for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) this._setPixel(r + i, c + j, color);
    }
    drawCircle(cx, cy, radius, color) {
        for (let i = -radius; i <= radius; i++) for (let j = -radius; j <= radius; j++) if (i * i + j * j <= radius * radius) this._setPixel(cx + i, cy + j, color);
    }
    drawTriangle(r, c, size, color) {
        for (let i = 0; i < size; i++) for (let j = 0; j <= i; j++) this._setPixel(r + i, c + j, color);
    }
    drawLine(r1, c1, r2, c2, color) { 
        let x0 = c1, y0 = r1, x1 = c2, y1 = r2;
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        while (true) {
            this._setPixel(y0, x0, color);
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }

    generatePattern(pattern) {
        this.saveState();
        const color = this._hexToRgba(this.currentColor, this.opacity);
        const patternFuncs = {
            checkerboard: () => { for (let i = 0; i < this.gridSize; i++) for (let j = 0; j < this.gridSize; j++) if ((i + j) % 2 === 0) this._setPixel(i, j, color); },
            stripes: () => { for (let i = 0; i < this.gridSize; i++) if (i % 4 < 2) for (let j = 0; j < this.gridSize; j++) this._setPixel(i, j, color); },
            dots: () => { for (let i = 2; i < this.gridSize; i += 4) for (let j = 2; j < this.gridSize; j += 4) this._setPixel(i, j, color); },
            grid: () => { for (let i = 0; i < this.gridSize; i++) for (let j = 0; j < this.gridSize; j++) if (i % 4 === 0 || j % 4 === 0) this._setPixel(i, j, color); }
        };
        if (patternFuncs[pattern]) patternFuncs[pattern]();
        this.updateCanvas();
    }

    
    addLayer() {
        const layer = { id: Date.now(), visible: true, opacity: 1, data: new Array(this.gridSize * this.gridSize).fill('') };
        this.layers.push(layer);
        this.activeLayer = this.layers.length - 1;
        this.updateLayerUI();
    }

    deleteLayer(layerId) {
        if (this.layers.length <= 1) return;
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index !== -1) {
            this.layers.splice(index, 1);
            if (this.activeLayer >= index) {
                this.activeLayer = Math.max(0, this.activeLayer - 1);
            }
            this.updateLayerUI();
            this.updateCanvas();
        }
    }
    
    
    saveState() {
        const state = JSON.stringify(this.layers);
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === state) return;
        this.undoStack.push(state);
        this.redoStack = [];
        if (this.undoStack.length > 50) this.undoStack.shift();
    }
    
    undo() {
        if (this.undoStack.length <= 1) return;
        this.redoStack.push(this.undoStack.pop());
        this._loadState(this.undoStack[this.undoStack.length - 1]);
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this._loadState(state);
    }
    
    _loadState(stateString) {
        this.layers = JSON.parse(stateString);
        this.updateCanvas();
        this.updateLayerUI();
    }

    
    clearCanvas() {
        this.saveState();
        if (this.layers[this.activeLayer]) {
            this.layers[this.activeLayer].data.fill('');
            this.updateCanvas();
        }
    }

    updateCanvas() {
        const pixels = this.canvas.children;
        for (let i = 0; i < pixels.length; i++) {
            let finalColor = 'transparent';
            
            
            for (const layer of this.layers) {
                if (layer.visible && layer.data[i]) {
                    finalColor = layer.data[i];
                }
            }
            pixels[i].style.backgroundColor = finalColor;
        }
    }

    updateLayerUI() {
        const layersList = document.querySelector('.layers-list');
        layersList.innerHTML = '';
        [...this.layers].reverse().forEach(layer => {
            const layerElement = document.createElement('div');
            layerElement.className = 'layer-item';
            layerElement.dataset.layerId = layer.id;
            if (this.layers.indexOf(layer) === this.activeLayer) {
                layerElement.classList.add('active');
            }

            layerElement.innerHTML = `
                <i class="fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} visibility-toggle"></i>
                <span>Layer ${this.layers.indexOf(layer) + 1}</span>
                <button class="layer-delete">×</button>
            `;

            layerElement.querySelector('.visibility-toggle').addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                this.updateCanvas();
                this.updateLayerUI();
            });

            layerElement.querySelector('.layer-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteLayer(layer.id);
            });

            layerElement.addEventListener('click', () => {
                this.activeLayer = this.layers.findIndex(l => l.id === layer.id);
                this.updateLayerUI();
            });

            layersList.appendChild(layerElement);
        });
    }

    updateGrid() {
        this.canvas.classList.toggle('grid-hidden', !this.gridVisible);
    }

    updateZoom() {
        const container = document.querySelector('.canvas-container');
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        container.classList.toggle('zoomed', this.zoomLevel > 1);
    }

    toggleAnimation() {
        this.animating = !this.animating;
        const container = document.querySelector('.canvas-container');
        const btn = document.getElementById('animateBtn');
        container.classList.toggle('animating', this.animating);
        btn.innerHTML = this.animating ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }

    toggleShortcuts() {
        this.shortcutsVisible = !this.shortcutsVisible;
        let shortcutsDiv = document.querySelector('.keyboard-shortcuts');
        if (!shortcutsDiv) {
            shortcutsDiv = document.createElement('div');
            shortcutsDiv.className = 'keyboard-shortcuts';
            shortcutsDiv.innerHTML = `<strong>Shortcuts:</strong> B-Brush, E-Eraser, F-Fill, I-Eyedropper, C-Clear, Space-Animate, 1-4-Brush Size, Ctrl+Z-Undo, Ctrl+Y-Redo, Ctrl+S-Save, ?-Toggle`;
            document.body.appendChild(shortcutsDiv);
        }
        shortcutsDiv.classList.toggle('shortcuts-visible', this.shortcutsVisible);
    }

    download() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.gridSize;
        tempCanvas.height = this.gridSize;
        const ctx = tempCanvas.getContext('2d');
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        this.layers.forEach(layer => {
            if (layer.visible) {
                layer.data.forEach((color, i) => {
                    if (color) {
                        const x = i % this.gridSize;
                        const y = Math.floor(i / this.gridSize);
                        ctx.fillStyle = color;
                        ctx.globalAlpha = layer.opacity;
                        ctx.fillRect(x, y, 1, 1);
                    }
                });
            }
        });

        const link = document.createElement('a');
        link.download = 'pixel-art.png';
        link.href = tempCanvas.toDataURL();
        link.click();
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z': e.preventDefault(); this.undo(); break;
                case 'y': e.preventDefault(); this.redo(); break;
                case 's': e.preventDefault(); this.download(); break;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case 'b': document.getElementById('pencilBtn').click(); break;
                case 'e': document.getElementById('eraserBtn').click(); break;
                case 'f': document.getElementById('fillBtn').click(); break;
                case 'i': document.getElementById('eyedropperBtn').click(); break;
                case 'c': this.clearCanvas(); break;
                case ' ': e.preventDefault(); this.toggleAnimation(); break;
                case '1': case '2': case '3': case '4':
                    this.brushSize = parseInt(e.key);
                    document.getElementById('brushSize').value = this.brushSize;
                    break;
            }
        }
    }
    
    
    _applySymmetry(row, col, func) {
        func(row, col);
        if (this.symmetryMode === 'horizontal' || this.symmetryMode === 'both') func(this.gridSize - 1 - row, col);
        if (this.symmetryMode === 'vertical' || this.symmetryMode === 'both') func(row, this.gridSize - 1 - col);
        if (this.symmetryMode === 'both') func(this.gridSize - 1 - row, this.gridSize - 1 - col);
    }

    _applyBrush(row, col, action) {
        const halfBrush = Math.floor(this.brushSize / 2);
        for (let i = -halfBrush; i <= halfBrush; i++) {
            for (let j = -halfBrush; j <= halfBrush; j++) {
                const r = row + i;
                const c = col + j;
                if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
                    action(r * this.gridSize + c);
                }
            }
        }
    }

    _setPixel(row, col, color) {
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            this.layers[this.activeLayer].data[row * this.gridSize + col] = color;
        }
    }

    _hexToRgba(hex, alpha = 1) {
        if (!hex) return '';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    _rgbaToHexAndAlpha(rgba) {
        if (!rgba.startsWith('rgba')) return { hex: rgba, alpha: 1 };
        const parts = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(/,\s*/);
        const toHex = c => ('0' + parseInt(c).toString(16)).slice(-2);
        return {
            hex: `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`,
            alpha: parseFloat(parts[3] || 1)
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelArtApp();
});