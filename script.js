class PixelArtApp {
    constructor() {
        this.gridSize = 32
        this.currentColor = '#FF69B4'
        this.currentTool = 'pencil'
        this.isDrawing = false
        this.brushSize = 1
        this.canvas = document.getElementById('pixelCanvas')
        this.pixels = []
        
        this.initializeCanvas()
        this.setupEventListeners()
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        document.addEventListener('mouseup', this.handleMouseUp.bind(this))

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value
        })

        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value)
        })

        document.getElementById('canvasSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value)
            this.initializeCanvas()
        })

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.tool-btn.active').classList.remove('active')
                btn.classList.add('active')
                this.currentTool = btn.id.replace('Btn', '')
            })
        })

        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas())
        document.getElementById('downloadBtn').addEventListener('click', () => this.download())
    }

    handleMouseDown(e) {
        if (e.target.classList.contains('pixel')) {
            this.isDrawing = true
            this.draw(e.target)
        }
    }

    handleMouseMove(e) {
        if (this.isDrawing && e.target.classList.contains('pixel')) {
            this.draw(e.target)
        }
    }

    handleMouseUp() {
        this.isDrawing = false
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
                    this.pixels[index] = this.currentColor
                    this.canvas.children[index].style.backgroundColor = this.currentColor
                }
            }
        }
    }

    erasePixel(row, col) {
        for (let i = -this.brushSize + 1; i < this.brushSize; i++) {
            for (let j = -this.brushSize + 1; j < this.brushSize; j++) {
                const newRow = row + i
                const newCol = col + j
                if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                    const index = newRow * this.gridSize + newCol
                    this.pixels[index] = ''
                    this.canvas.children[index].style.backgroundColor = 'transparent'
                }
            }
        }
    }

    fillArea(row, col) {
        const targetColor = this.pixels[row * this.gridSize + col]
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
            if (this.pixels[index] !== targetColor) continue

            this.pixels[index] = newColor
            this.canvas.children[index].style.backgroundColor = newColor

            stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
        }
    }   

    clearCanvas() {
        this.pixels = new Array(this.gridSize * this.gridSize).fill('')
        const pixelElements = this.canvas.children
        for (let pixel of pixelElements) {
            pixel.style.backgroundColor = 'transparent'
        }
    }

    download() {
        const canvas = document.createElement('canvas')
        canvas.width = this.gridSize
        canvas.height = this.gridSize
        const ctx = canvas.getContext('2d')
        
        this.pixels.forEach((color, i) => {
            if (color) {
                const x = i % this.gridSize
                const y = Math.floor(i / this.gridSize)
                ctx.fillStyle = color
                ctx.fillRect(x, y, 1, 1)
            }
        })
        
        const link = document.createElement('a')
        link.download = 'pixel-art.png'
        link.href = canvas.toDataURL()
        link.click()
    }

    initializeCanvas() {
        this.canvas.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`
        this.canvas.innerHTML = ''
        this.pixels = new Array(this.gridSize * this.gridSize).fill('')
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pixel = document.createElement('div')
            pixel.className = 'pixel'
            pixel.dataset.index = i
            this.canvas.appendChild(pixel)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelArtApp()
})