class PixelArtApp {
    constructor() {
        this.gridSize = 32
        this.currentColor = '#000000'
        this.currentTool = 'pencil'
        this.isDrawing = false
        this.drawStartPos = null
        this.opacity = 1
        this.brushSize = 1
        this.layers = []
        this.activeLayer = 0
        this.undoStack = []
        this.redoStack = []
        this.showGrid = true
        
        this.canvas = document.getElementById('pixelCanvas')
        this.touchEnabled = 'ontouchstart' in window
        
        this.initializeCanvas()
        this.addLayer()
        this.setupEventListeners()
        this.createDefaultPalette()
    }

    initializeCanvas() {
        this.canvas.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`
        this.canvas.innerHTML = ''
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pixel = document.createElement('div')
            pixel.className = 'pixel'
            pixel.dataset.index = i
            this.canvas.appendChild(pixel)
        }
    }

    setupEventListeners() {
        if (this.touchEnabled) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
        } else {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
            document.addEventListener('mouseup', this.handleMouseUp.bind(this))
        }

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value
        })

        document.getElementById('opacitySlider').addEventListener('input', (e) => {
            this.opacity = e.target.value / 100
        })

        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value)
        })

        document.getElementById('canvasSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value)
            this.initializeCanvas()
            this.layers = []
            this.addLayer()
        })

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.tool-btn.active').classList.remove('active')
                btn.classList.add('active')
                this.currentTool = btn.id.replace('Btn', '')
            })
        })

        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas())
        document.getElementById('undoBtn').addEventListener('click', () => this.undo())
        document.getElementById('redoBtn').addEventListener('click', () => this.redo())
        document.getElementById('downloadBtn').addEventListener('click', () => this.download())
        document.getElementById('gridToggle').addEventListener('click', () => this.toggleGrid())

        document.querySelector('.add-layer-btn').addEventListener('click', () => this.addLayer())

        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.drawShape(btn.dataset.shape)
                document.getElementById('shapesModal').style.display = 'none'
            })
        })

        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPattern(btn.dataset.pattern)
                document.getElementById('patternsModal').style.display = 'none'
            })
        })

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.className = btn.dataset.theme + '-theme'
                document.querySelector('.theme-btn.active').classList.remove('active')
                btn.classList.add('active')
            })
        })

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none'
            })
        })

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none'
                }
            })
        })

        document.getElementById('shapesBtn').addEventListener('click', () => {
            document.getElementById('shapesModal').style.display = 'flex'
        })

        document.getElementById('patternBtn').addEventListener('click', () => {
            document.getElementById('patternsModal').style.display = 'flex'
        })
    }

    handleTouchStart(e) {
        e.preventDefault()
        const touch = e.touches[0]
        const pixel = document.elementFromPoint(touch.clientX, touch.clientY)
        if (pixel && pixel.classList.contains('pixel')) {
            this.isDrawing = true
            this.drawStartPos = parseInt(pixel.dataset.index)
            this.draw(pixel)
        }
    }

    handleTouchMove(e) {
        e.preventDefault()
        if (!this.isDrawing) return
        const touch = e.touches[0]
        const pixel = document.elementFromPoint(touch.clientX, touch.clientY)
        if (pixel && pixel.classList.contains('pixel')) {
            this.draw(pixel)
        }
    }

    handleTouchEnd() {
        if (this.isDrawing) {
            this.isDrawing = false
            this.drawStartPos = null
            this.saveState()
        }
    }

    handleMouseDown(e) {
        if (e.target.classList.contains('pixel')) {
            this.isDrawing = true
            this.drawStartPos = parseInt(e.target.dataset.index)
            this.draw(e.target)
        }
    }

    handleMouseMove(e) {
        if (this.isDrawing && e.target.classList.contains('pixel')) {
            this.draw(e.target)
        }
    }

    handleMouseUp() {
        if (this.isDrawing) {
            this.isDrawing = false
            this.drawStartPos = null
            this.saveState()
        }
    }

    createDefaultPalette() {
        const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
                       '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#FF9900']
        const palette = document.querySelector('.color-palette')
        
        colors.forEach(color => {
            const swatch = document.createElement('div')
            swatch.className = 'color-swatch'
            swatch.style.backgroundColor = color
            swatch.addEventListener('click', () => {
                this.currentColor = color
                document.getElementById('colorPicker').value = color
            })
            palette.appendChild(swatch)
        })
    }

    draw(pixel) {
        const index = parseInt(pixel.dataset.index)
        const row = Math.floor(index / this.gridSize)
        const col = index % this.gridSize

        if (this.currentTool === 'pencil') {
            this.drawPixel(row, col)
        } else if (this.currentTool === 'eraser') {
            this.erasePixel(row, col)
        } else if (this.currentTool === 'fill') {
            this.fillArea(row, col)
        }
    }

    drawPixel(row, col) {
        for (let i = -this.brushSize + 1; i < this.brushSize; i++) {
            for (let j = -this.brushSize + 1; j < this.brushSize; j++) {
                const newRow = row + i
                const newCol = col + j
                if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                    const index = newRow * this.gridSize + newCol
                    this.layers[this.activeLayer].data[index] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    erasePixel(row, col) {
        for (let i = -this.brushSize + 1; i < this.brushSize; i++) {
            for (let j = -this.brushSize + 1; j < this.brushSize; j++) {
                const newRow = row + i
                const newCol = col + j
                if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                    const index = newRow * this.gridSize + newCol
                    this.layers[this.activeLayer].data[index] = ''
                }
            }
        }
        this.updateCanvas()
    }

    fillArea(row, col) {
        const targetColor = this.layers[this.activeLayer].data[row * this.gridSize + col]
        const newColor = this.currentColor
        if (targetColor === newColor) return

        const stack = [[row, col]]
        const seen = new Set()

        while (stack.length > 0) {
            const [r, c] = stack.pop()
            const index = r * this.gridSize + c
            const key = `${r},${c}`

            if (seen.has(key)) continue
            seen.add(key)

            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) continue
            if (this.layers[this.activeLayer].data[index] !== targetColor) continue

            this.layers[this.activeLayer].data[index] = newColor

            stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
        }

        this.updateCanvas()
    }

    drawShape(shape) {
        const startPos = this.drawStartPos
        if (startPos === null) return

        const startRow = Math.floor(startPos / this.gridSize)
        const startCol = startPos % this.gridSize
        const size = Math.floor(this.gridSize / 4)

        switch (shape) {
            case 'rectangle':
                this.drawRectangle(startRow, startCol, size)
                break
            case 'circle':
                this.drawCircle(startRow, startCol, size)
                break
            case 'triangle':
                this.drawTriangle(startRow, startCol, size)
                break
                case 'line':
                this.drawLine(startRow, startCol, size)
                break
        }
        this.saveState()
    }

    drawRectangle(startRow, startCol, size) {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const row = startRow + i
                const col = startCol + j
                if (row < this.gridSize && col < this.gridSize) {
                    this.layers[this.activeLayer].data[row * this.gridSize + col] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    drawCircle(startRow, startCol, radius) {
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                if (i * i + j * j <= radius * radius) {
                    const row = startRow + i
                    const col = startCol + j
                    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                        this.layers[this.activeLayer].data[row * this.gridSize + col] = this.currentColor
                    }
                }
            }
        }
        this.updateCanvas()
    }

    drawTriangle(startRow, startCol, size) {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j <= i; j++) {
                const row = startRow + i
                const col = startCol + j
                if (row < this.gridSize && col < this.gridSize) {
                    this.layers[this.activeLayer].data[row * this.gridSize + col] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    drawLine(startRow, startCol, length) {
        for (let i = 0; i < length; i++) {
            const row = startRow
            const col = startCol + i
            if (row < this.gridSize && col < this.gridSize) {
                this.layers[this.activeLayer].data[row * this.gridSize + col] = this.currentColor
            }
        }
        this.updateCanvas()
    }

    applyPattern(pattern) {
        this.saveState()
        switch (pattern) {
            case 'checkerboard':
                this.createCheckerboard()
                break
            case 'stripes':
                this.createStripes()
                break
            case 'dots':
                this.createDots()
                break
            case 'gradient':
                this.createGradient()
                break
        }
    }

    createCheckerboard() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if ((i + j) % 2 === 0) {
                    this.layers[this.activeLayer].data[i * this.gridSize + j] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    createStripes() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (i % 2 === 0) {
                    this.layers[this.activeLayer].data[i * this.gridSize + j] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    createDots() {
        const spacing = 4
        for (let i = spacing/2; i < this.gridSize; i += spacing) {
            for (let j = spacing/2; j < this.gridSize; j += spacing) {
                if (i < this.gridSize && j < this.gridSize) {
                    this.layers[this.activeLayer].data[i * this.gridSize + j] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    createGradient() {
        const startColor = this.hexToRgb(this.currentColor)
        const endColor = { r: 255 - startColor.r, g: 255 - startColor.g, b: 255 - startColor.b }
        
        for (let i = 0; i < this.gridSize; i++) {
            const ratio = i / this.gridSize
            const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio)
            const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio)
            const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio)
            
            for (let j = 0; j < this.gridSize; j++) {
                this.layers[this.activeLayer].data[i * this.gridSize + j] = `rgb(${r},${g},${b})`
            }
        }
        this.updateCanvas()
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null
    }

    clearCanvas() {
        this.saveState()
        this.layers[this.activeLayer].data = new Array(this.gridSize * this.gridSize).fill('')
        this.updateCanvas()
    }

    toggleGrid() {
        this.showGrid = !this.showGrid
        const pixels = this.canvas.children
        for (let pixel of pixels) {
            if (this.showGrid) {
                pixel.style.border = '1px solid #eee'
            } else {
                pixel.style.border = 'none'
            }
        }
    }

    updateCanvas() {
        const pixels = this.canvas.children
        for (let i = 0; i < pixels.length; i++) {
            let finalColor = ''
            this.layers.forEach(layer => {
                if (layer.visible && layer.data[i]) {
                    const color = layer.data[i]
                    if (color) {
                        finalColor = color
                    }
                }
            })
            pixels[i].style.backgroundColor = finalColor || 'transparent'
        }
    }

    addLayer() {
        const layer = {
            id: Date.now(),
            visible: true,
            opacity: 1,
            data: new Array(this.gridSize * this.gridSize).fill('')
        }
        
        this.layers.push(layer)
        this.activeLayer = this.layers.length - 1
        this.createLayerUI(layer)
    }

    createLayerUI(layer) {
        const layersList = document.querySelector('.layers-list')
        const layerElement = document.createElement('div')
        layerElement.className = 'layer-item'
        layerElement.innerHTML = `
            <input type="checkbox" ${layer.visible ? 'checked' : ''}>
            <input type="range" value="${layer.opacity * 100}" min="0" max="100">
            <button class="layer-delete">&times;</button>
        `
        
        layerElement.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            layer.visible = e.target.checked
            this.updateCanvas()
        })
        
        layerElement.querySelector('input[type="range"]').addEventListener('input', (e) => {
            layer.opacity = e.target.value / 100
            this.updateCanvas()
        })
        
        layerElement.querySelector('.layer-delete').addEventListener('click', () => {
            if (this.layers.length > 1) {
                this.deleteLayer(layer.id)
            }
        })
        
        layerElement.addEventListener('click', (e) => {
            if (!e.target.matches('input, button')) {
                this.activeLayer = this.layers.findIndex(l => l.id === layer.id)
                this.updateLayerSelection()
            }
        })
        
        layersList.appendChild(layerElement)
        this.updateLayerSelection()
    }

    updateLayerSelection() {
        const layerItems = document.querySelectorAll('.layer-item')
        layerItems.forEach((item, index) => {
            item.style.border = index === this.activeLayer ? '2px solid var(--cosmic-accent)' : 'none'
        })
    }

    deleteLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId)
        if (index !== -1 && this.layers.length > 1) {
            this.layers.splice(index, 1)
            this.activeLayer = Math.max(0, this.activeLayer - 1)
            this.updateLayerUI()
            this.updateCanvas()
        }
    }

    updateLayerUI() {
        const layersList = document.querySelector('.layers-list')
        layersList.innerHTML = ''
        this.layers.forEach(layer => this.createLayerUI(layer))
    }

    saveState() {
        const state = this.layers.map(layer => ({
            ...layer,
            data: [...layer.data]
        }))
        this.undoStack.push(state)
        this.redoStack = []
    }

    undo() {
        if (this.undoStack.length > 0) {
            const currentState = this.layers.map(layer => ({
                ...layer,
                data: [...layer.data]
            }))
            this.redoStack.push(currentState)
            
            const previousState = this.undoStack.pop()
            this.layers = previousState
            this.updateCanvas()
            this.updateLayerUI()
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const currentState = this.layers.map(layer => ({
                ...layer,
                data: [...layer.data]
            }))
            this.undoStack.push(currentState)
            
            const nextState = this.redoStack.pop()
            this.layers = nextState
            this.updateCanvas()
            this.updateLayerUI()
        }
    }

    download() {
        const canvas = document.createElement('canvas')
        canvas.width = this.gridSize
        canvas.height = this.gridSize
        const ctx = canvas.getContext('2d')
        
        this.layers.forEach(layer => {
            if (layer.visible) {
                layer.data.forEach((color, i) => {
                    if (color) {
                        const x = i % this.gridSize
                        const y = Math.floor(i / this.gridSize)
                        ctx.fillStyle = color
                        ctx.globalAlpha = layer.opacity
                        ctx.fillRect(x, y, 1, 1)
                    }
                })
            }
        })
        
        const link = document.createElement('a')
        link.download = 'pixel-art.png'
        link.href = canvas.toDataURL()
        link.click()
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelArtApp()
})