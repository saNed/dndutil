class GameState {
    constructor() {
        // Mode state
        this.currentMode = 'view'; // 'view', 'editWalls', 'playGame'

        // Wall data
        this.walls = [];
        this.currentWall = null;
        this.selectedVertex = null;

        // Character data
        this.playerCharacters = [];
        this.npcs = [];

        // Interaction state
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedPC = null;
        this.isDraggingPC = false;
        this.dragStartPos = { x: 0, y: 0 };

        // Game constants - adjustable via browser console
        this.SIGHT_RADIUS = 6; // feet
        this.GRID_SIZE = 5; // pixels per foot (calculated based on map)

        // Canvas references
        this.mapImage = null;
        this.wallCanvas = null;
        this.wallCtx = null;
        this.fogCanvas = null;
        this.fogCtx = null;

        // Make SIGHT_RADIUS available globally for console adjustment
        window.SIGHT_RADIUS = this.SIGHT_RADIUS;
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    getMode() {
        return this.currentMode;
    }

    resetGameState() {
        this.currentWall = null;
        this.playerCharacters = [];
        this.npcs = [];
        this.selectedVertex = null;
        this.currentMode = 'view';
        this.selectedPC = null;
        this.isDragging = false;
        this.isDraggingPC = false;
    }

    addWall(wall) {
        this.walls.push(wall);
    }

    removeWall(wall) {
        const index = this.walls.indexOf(wall);
        if (index > -1) {
            this.walls.splice(index, 1);
        }
    }

    clearAllWalls() {
        this.walls = [];
        this.currentWall = null;
        this.selectedVertex = null;
    }

    addPlayerCharacter(pc) {
        this.playerCharacters.push(pc);
    }

    addNPC(npc) {
        this.npcs.push(npc);
    }

    findVertexAt(x, y, radius = 15) {
        // Check current wall first
        if (this.currentWall) {
            for (const vertex of this.currentWall.vertices) {
                const distance = Math.sqrt((x - vertex.x) ** 2 + (y - vertex.y) ** 2);
                if (distance <= radius) {
                    return vertex;
                }
            }
        }

        // Check completed walls
        for (const wall of this.walls) {
            for (const vertex of wall.vertices) {
                const distance = Math.sqrt((x - vertex.x) ** 2 + (y - vertex.y) ** 2);
                if (distance <= radius) {
                    return vertex;
                }
            }
        }

        return null;
    }

    findWallContainingVertex(targetVertex) {
        // Check current wall
        if (this.currentWall && this.currentWall.vertices.includes(targetVertex)) {
            return this.currentWall;
        }

        // Check completed walls
        return this.walls.find(wall => wall.vertices.includes(targetVertex));
    }

    findPCAt(x, y, radius = 15) {
        for (const pc of this.playerCharacters) {
            const distance = Math.sqrt((x - pc.x) ** 2 + (y - pc.y) ** 2);
            if (distance <= radius) {
                return pc;
            }
        }
        return null;
    }


    setCanvasReferences(wallCanvas, wallCtx, fogCanvas, fogCtx, mapImage) {
        this.wallCanvas = wallCanvas;
        this.wallCtx = wallCtx;
        this.fogCanvas = fogCanvas;
        this.fogCtx = fogCtx;
        this.mapImage = mapImage;
    }

    calculateGridSize(displayWidth, displayHeight) {
        // Calculate grid size (assume map is roughly 50x50 feet for now)
        this.GRID_SIZE = Math.min(displayWidth / 50, displayHeight / 50);
        return this.GRID_SIZE;
    }
}