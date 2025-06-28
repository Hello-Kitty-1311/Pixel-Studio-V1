class PixelArtApp {
    constructor() {
        this.gridSize = 32
        this.currentColor = '#000000'
        this.currentTool = 'pencil'
        this.eyedropperActive = false
        this.symmetryMode = 'none'
        this.zoomLevel = 1
        this.gridVisible = true
        this.animating = false
        this.shortcutsVisible = false
        this.isDrawing = false
        this.drawStartPos = null
        this.opacity = 1
        this.brushSize = 1
        this.layers = []
        this.activeLayer = 0
        this.undoStack = []
        this.redoStack = []
        this.frames = []
        this.currentFrame = 0
        this.isPlaying = false
        this.fps = 12
        this.animationInterval = null
        this.onionSkinEnabled = false
        this.onionOpacity = 0.3
        this.previousFrameData = null
        this.canvas = document.getElementById('pixelCanvas')
        this.brushPattern = 'solid'
        this.textureIntensity = 0.5
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
        
        this.updateGrid()
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        document.addEventListener('mouseup', this.handleMouseUp.bind(this))

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value
        })

        document.getElementById('opacitySlider').addEventListener('input', (e) => {
            this.opacity = e.target.value / 100
        })

        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value)
        })
        document.getElementById('brushPattern').addEventListener('change', (e) => {
    this.brushPattern = e.target.value
})

document.getElementById('textureIntensity').addEventListener('input', (e) => {
    this.textureIntensity = e.target.value / 100
    document.documentElement.style.setProperty('--texture-intensity', this.textureIntensity)
})

        document.getElementById('canvasSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value)
            this.initializeCanvas()
            this.layers = []
            this.addLayer()
        })
        document.getElementById('toggleHsv').addEventListener('click', () => {
    const hsvPicker = document.getElementById('hsvPicker')
    hsvPicker.style.display = hsvPicker.style.display === 'none' ? 'block' : 'none'
})

document.getElementById('hueSlider').addEventListener('input', this.updateHsvColor.bind(this))
document.getElementById('satSlider').addEventListener('input', this.updateHsvColor.bind(this))
document.getElementById('valSlider').addEventListener('input', this.updateHsvColor.bind(this))

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

        document.querySelector('.add-layer-btn').addEventListener('click', () => this.addLayer())
        document.getElementById('onionSkinToggle').addEventListener('change', (e) => {
    this.onionSkinEnabled = e.target.checked
    this.updateCanvas()
})
document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback())
document.getElementById('prevFrameBtn').addEventListener('click', () => this.previousFrame())
document.getElementById('nextFrameBtn').addEventListener('click', () => this.nextFrame())
document.getElementById('addFrameBtn').addEventListener('click', () => this.addFrame())
document.getElementById('fpsSlider').addEventListener('input', (e) => {
    this.fps = parseInt(e.target.value)
    if (this.isPlaying) {
        this.stopPlayback()
        this.startPlayback()
    }
})

document.getElementById('onionOpacity').addEventListener('input', (e) => {
    this.onionOpacity = e.target.value / 100
    document.documentElement.style.setProperty('--onion-opacity', this.onionOpacity)
    this.updateCanvas()
})

        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.drawShape(btn.dataset.shape)
                document.getElementById('shapesModal').style.display = 'none'
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
        document.getElementById('patternsBtn').addEventListener('click', () => {
            document.getElementById('patternsModal').style.display = 'flex'
        })
        document.getElementById('eyedropperBtn').addEventListener('click', () => {
            document.querySelector('.tool-btn.active').classList.remove('active')
            document.getElementById('eyedropperBtn').classList.add('active')
            this.currentTool = 'eyedropper'
        })
        document.getElementById('symmetryBtn').addEventListener('click', () => {
            const symmetrySelect = document.getElementById('symmetryMode')
            const modes = ['none', 'horizontal', 'vertical', 'both']
            const currentIndex = modes.indexOf(this.symmetryMode)
            const nextIndex = (currentIndex + 1) % modes.length
            this.symmetryMode = modes[nextIndex]
            symmetrySelect.value = this.symmetryMode
        })
        document.getElementById('zoomSlider').addEventListener('input', (e) => {
            this.zoomLevel = parseFloat(e.target.value)
            this.updateZoom()
        })

        document.getElementById('gridToggleBtn').addEventListener('click', () => {
            this.gridVisible = !this.gridVisible
            this.updateGrid()
        })
        document.getElementById('animateBtn').addEventListener('click', () => {
            this.toggleAnimation()
        })

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e)
        })

        document.addEventListener('keydown', (e) => {
            if (e.key === '?' || e.key === '/') {
                e.preventDefault()
                this.toggleShortcuts()
            }
        })

        document.getElementById('symmetryMode').addEventListener('change', (e) => {
            this.symmetryMode = e.target.value
        })

        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.generatePattern(btn.dataset.pattern)
                document.getElementById('patternsModal').style.display = 'none'
            })
        })
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
            this.previousFrameData = [...this.layers[this.activeLayer].data]
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

    updateHsvColor() {
    const h = document.getElementById('hueSlider').value
    const s = document.getElementById('satSlider').value / 100
    const v = document.getElementById('valSlider').value / 100
    
    const hex = this.hsvToHex(h, s, v)
    this.currentColor = hex
    document.getElementById('colorPicker').value = hex
}

hsvToHex(h, s, v) {
    const c = v * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = v - c
    
    let r, g, b
    if (h < 60) [r, g, b] = [c, x, 0]
    else if (h < 120) [r, g, b] = [x, c, 0]
    else if (h < 180) [r, g, b] = [0, c, x]
    else if (h < 240) [r, g, b] = [0, x, c]
    else if (h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

    drawPixel(row, col) {
        this.drawPixelAtPosition(row, col)
        
        if (this.symmetryMode === 'horizontal' || this.symmetryMode === 'both') {
            const mirrorRow = this.gridSize - 1 - row
            this.drawPixelAtPosition(mirrorRow, col)
        }
        
        if (this.symmetryMode === 'vertical' || this.symmetryMode === 'both') {
            const mirrorCol = this.gridSize - 1 - col
            this.drawPixelAtPosition(row, mirrorCol)
        }
        
        if (this.symmetryMode === 'both') {
            const mirrorRow = this.gridSize - 1 - row
            const mirrorCol = this.gridSize - 1 - col
            this.drawPixelAtPosition(mirrorRow, mirrorCol)
        }
        
        this.updateCanvas()
    }

    drawPixelAtPosition(row, col) {
    const halfBrush = Math.floor(this.brushSize / 2)
    
    for (let i = -halfBrush; i <= halfBrush; i++) {
        for (let j = -halfBrush; j <= halfBrush; j++) {
            const newRow = row + i
            const newCol = col + j
            
            if (this.brushSize === 1 || 
                (this.brushSize > 1 && Math.abs(i) + Math.abs(j) <= halfBrush)) {
                
                if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                    const index = newRow * this.gridSize + newCol
                    
                    if (this.shouldDrawPixel(newRow, newCol)) {
                        this.layers[this.activeLayer].data[index] = this.getPatternColor(newRow, newCol)
                    }
                }
            }
        }
    }
}

shouldDrawPixel(row, col) {
    switch (this.brushPattern) {
        case 'dither':
            return (row + col) % 2 === 0
        case 'noise':
            return Math.random() > 0.3
        case 'crosshatch':
            return (row % 3 === 0) || (col % 3 === 0)
        default:
            return true
    }
}

getPatternColor(row, col) {
    if (this.brushPattern === 'noise' && this.textureIntensity > 0) {
        const noise = Math.random() * this.textureIntensity
        const color = this.hexToRgb(this.currentColor)
        const adjusted = {
            r: Math.max(0, Math.min(255, color.r + (noise - 0.5) * 100)),
            g: Math.max(0, Math.min(255, color.g + (noise - 0.5) * 100)),
            b: Math.max(0, Math.min(255, color.b + (noise - 0.5) * 100))
        }
        return this.rgbToHex(adjusted.r, adjusted.g, adjusted.b)
    }
    return this.currentColor
}

hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

rgbToHex(r, g, b) {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

    pickColor(index) {
        let pickedColor = ''
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i]
            if (layer.visible && layer.data[index]) {
                pickedColor = layer.data[index]
                break
            }
        }
        
        if (pickedColor) {
            this.currentColor = pickedColor
            document.getElementById('colorPicker').value = pickedColor
        }
    }

    drawPixel(row, col) {
        const halfBrush = Math.floor(this.brushSize / 2)
        
        for (let i = -halfBrush; i <= halfBrush; i++) {
            for (let j = -halfBrush; j <= halfBrush; j++) {
                const newRow = row + i
                const newCol = col + j
                
                if (this.brushSize === 1 || 
                    (this.brushSize > 1 && Math.abs(i) + Math.abs(j) <= halfBrush)) {
                    
                    if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                        const index = newRow * this.gridSize + newCol
                        this.layers[this.activeLayer].data[index] = this.currentColor
                    }
                }
            }
        }
        this.updateCanvas()
    }

    erasePixel(row, col) {
        this.erasePixelAtPosition(row, col)
        
        if (this.symmetryMode === 'horizontal' || this.symmetryMode === 'both') {
            const mirrorRow = this.gridSize - 1 - row
            this.erasePixelAtPosition(mirrorRow, col)
        }
        
        if (this.symmetryMode === 'vertical' || this.symmetryMode === 'both') {
            const mirrorCol = this.gridSize - 1 - col
            this.erasePixelAtPosition(row, mirrorCol)
        }
        
        if (this.symmetryMode === 'both') {
            const mirrorRow = this.gridSize - 1 - row
            const mirrorCol = this.gridSize - 1 - col
            this.erasePixelAtPosition(mirrorRow, mirrorCol)
        }
        
        this.updateCanvas()
    }

    erasePixelAtPosition(row, col) {
        const halfBrush = Math.floor(this.brushSize / 2)
        
        for (let i = -halfBrush; i <= halfBrush; i++) {
            for (let j = -halfBrush; j <= halfBrush; j++) {
                const newRow = row + i
                const newCol = col + j
                
                if (this.brushSize === 1 || 
                    (this.brushSize > 1 && Math.abs(i) + Math.abs(j) <= halfBrush)) {
                    
                    if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                        const index = newRow * this.gridSize + newCol
                        this.layers[this.activeLayer].data[index] = ''
                    }
                }
            }
        }
    }
    updateZoom() {
        const canvas = document.getElementById('pixelCanvas')
        const container = document.querySelector('.canvas-container')
        
        canvas.style.transform = `scale(${this.zoomLevel})`
        
        if (this.zoomLevel > 1) {
            container.classList.add('zoomed')
            canvas.classList.add('zoomed')
        } else {
            container.classList.remove('zoomed')
            canvas.classList.remove('zoomed')
        }
    }

    updateGrid() {
        const pixels = this.canvas.children
        for (let i = 0; i < pixels.length; i++) {
            pixels[i].classList.remove('grid-visible', 'grid-hidden')
            pixels[i].classList.add(this.gridVisible ? 'grid-visible' : 'grid-hidden')
        }
    }
    toggleAnimation() {
        this.animating = !this.animating
        const container = document.querySelector('.canvas-container')
        const btn = document.getElementById('animateBtn')
        
        if (this.animating) {
            container.classList.add('animating')
            btn.innerHTML = '<i class="fas fa-pause"></i>'
        } else {
            container.classList.remove('animating')
            btn.innerHTML = '<i class="fas fa-play"></i>'
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault()
                    if (e.shiftKey) {
                        this.redo()
                    } else {
                        this.undo()
                    }
                    break
                case 's':
                    e.preventDefault()
                    this.download()
                    break
            }
        }

        switch (e.key) {
            case 'b':
                e.preventDefault()
                document.getElementById('pencilBtn').click()
                break
            case 'e':
                e.preventDefault()
                document.getElementById('eraserBtn').click()
                break
            case 'f':
                e.preventDefault()
                document.getElementById('fillBtn').click()
                break
            case 'i':
                e.preventDefault()
                document.getElementById('eyedropperBtn').click()
                break
            case 'c':
                e.preventDefault()
                this.clearCanvas()
                break
            case ' ':
                e.preventDefault()
                this.toggleAnimation()
                break
        }

        if (e.key >= '1' && e.key <= '4') {
            e.preventDefault()
            this.brushSize = parseInt(e.key)
            document.getElementById('brushSize').value = this.brushSize
        }
    }

    toggleShortcuts() {
        this.shortcutsVisible = !this.shortcutsVisible
        let shortcutsDiv = document.querySelector('.keyboard-shortcuts')
        
        if (!shortcutsDiv) {
            shortcutsDiv = document.createElement('div')
            shortcutsDiv.className = 'keyboard-shortcuts'
            shortcutsDiv.innerHTML = `
                <strong>Keyboard Shortcuts:</strong><br>
                B - Brush<br>
                E - Eraser<br>
                F - Fill<br>
                I - Eyedropper<br>
                C - Clear<br>
                Space - Animate<br>
                1-4 - Brush Size<br>
                Ctrl+Z - Undo<br>
                Ctrl+Shift+Z - Redo<br>
                Ctrl+S - Download<br>
                ? - Toggle Shortcuts
            `
            document.body.appendChild(shortcutsDiv)
        }
        
        shortcutsDiv.classList.toggle('shortcuts-visible', this.shortcutsVisible)
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

    generatePattern(pattern) {
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
            case 'grid':
                this.createGrid()
                break
        }
    }

    createCheckerboard() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if ((i + j) % 2 === 0) {
                    const index = i * this.gridSize + j
                    this.layers[this.activeLayer].data[index] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    createStripes() {
        for (let i = 0; i < this.gridSize; i++) {
            if (i % 4 < 2) {
                for (let j = 0; j < this.gridSize; j++) {
                    const index = i * this.gridSize + j
                    this.layers[this.activeLayer].data[index] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    createDots() {
        for (let i = 2; i < this.gridSize; i += 4) {
            for (let j = 2; j < this.gridSize; j += 4) {
                const index = i * this.gridSize + j
                this.layers[this.activeLayer].data[index] = this.currentColor
            }
        }
        this.updateCanvas()
    }

    createGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (i % 4 === 0 || j % 4 === 0) {
                    const index = i * this.gridSize + j
                    this.layers[this.activeLayer].data[index] = this.currentColor
                }
            }
        }
        this.updateCanvas()
    }

    clearCanvas() {
        this.saveState()
        this.layers[this.activeLayer].data = new Array(this.gridSize * this.gridSize).fill('')
        this.updateCanvas()
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
        pixels[i].classList.remove('onion-previous')
        
        if (this.onionSkinEnabled && this.previousFrameData && this.previousFrameData[i] && !finalColor) {
            pixels[i].classList.add('onion-previous')
            pixels[i].style.backgroundColor = this.previousFrameData[i]
        }
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
    
    if (this.frames.length === 0) {
        this.addFrame()
    }
}

addFrame() {
    const frameData = this.layers.map(layer => ({...layer, data: [...layer.data]}))
    this.frames.push(frameData)
    this.currentFrame = this.frames.length - 1
    this.updateFrameDisplay()
    this.createFrameTimeline()
}

togglePlayback() {
    if (this.isPlaying) {
        this.stopPlayback()
    } else {
        this.startPlayback()
    }
}

startPlayback() {
    if (this.frames.length < 2) return
    
    this.isPlaying = true
    document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>'
    
    this.animationInterval = setInterval(() => {
        this.currentFrame = (this.currentFrame + 1) % this.frames.length
        this.loadFrame(this.currentFrame)
        this.updateFrameDisplay()
    }, 1000 / this.fps)
}

stopPlayback() {
    this.isPlaying = false
    document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>'
    if (this.animationInterval) {
        clearInterval(this.animationInterval)
        this.animationInterval = null
    }
}

previousFrame() {
    if (this.frames.length === 0) return
    this.currentFrame = (this.currentFrame - 1 + this.frames.length) % this.frames.length
    this.loadFrame(this.currentFrame)
    this.updateFrameDisplay()
}

nextFrame() {
    if (this.frames.length === 0) return
    this.currentFrame = (this.currentFrame + 1) % this.frames.length
    this.loadFrame(this.currentFrame)
    this.updateFrameDisplay()
}

loadFrame(frameIndex) {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
        this.layers = this.frames[frameIndex].map(layer => ({...layer, data: [...layer.data]}))
        this.updateCanvas()
        this.updateLayerUI()
    }
}

updateFrameDisplay() {
    document.getElementById('currentFrame').textContent = this.currentFrame + 1
    document.getElementById('totalFrames').textContent = this.frames.length
}

createFrameTimeline() {
    let timeline = document.querySelector('.frame-timeline')
    if (!timeline) {
        timeline = document.createElement('div')
        timeline.className = 'frame-timeline'
        document.querySelector('.animation-controls').appendChild(timeline)
    }
    
    timeline.innerHTML = ''
    this.frames.forEach((frame, index) => {
        const thumb = document.createElement('div')
        thumb.className = `frame-thumb ${index === this.currentFrame ? 'active' : ''}`
        thumb.addEventListener('click', () => {
            this.currentFrame = index
            this.loadFrame(index)
            this.updateFrameDisplay()
            this.createFrameTimeline()
        })
        timeline.appendChild(thumb)
    })
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
            item.style.border = index === this.activeLayer ? '2px solid #007bff' : 'none'
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