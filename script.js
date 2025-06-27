class PixelArtApp {
    constructor() {
        this.gridSize = 32
        this.currentColor = '#FF69B4'
        this.currentTool = 'pencil'
        this.isDrawing = false
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
        if (this.currentTool === 'pencil') {
            this.pixels[index] = this.currentColor
            pixel.style.backgroundColor = this.currentColor
        } else if (this.currentTool === 'eraser') {
            this.pixels[index] = ''
            pixel.style.backgroundColor = 'transparent'
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