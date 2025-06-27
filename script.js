class PixelArtApp {
    constructor() {
        this.gridSize = 32
        this.canvas = document.getElementById('pixelCanvas')
        this.initializeCanvas()
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
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelArtApp()
})