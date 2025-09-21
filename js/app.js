class DNDMapUtility {
    constructor() {
        this.gameState = new GameState();
        this.storage = new StorageManager();
        this.renderer = new CanvasRenderer();
        this.eventHandler = new EventHandler(this.gameState, this.renderer, this.storage);

        this.init();
    }

    init() {
        // Load saved walls from localStorage
        this.storage.loadWalls(this.gameState);

        // Initialize canvases
        this.renderer.init();

        // Setup event handlers
        this.eventHandler.init();

        console.log('D&D Map Utility initialized');
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dndApp = new DNDMapUtility();
});

