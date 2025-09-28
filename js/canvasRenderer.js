class CanvasRenderer {
    constructor() {
        this.fogAnimationId = null;
        this.baseFogCanvas = null;
        this.geometryUtils = new GeometryUtils();
    }

    init() {
        const wallCanvas = document.getElementById('wallCanvas');
        const fogCanvas = document.getElementById('fogCanvas');

        if (wallCanvas && fogCanvas) {
            const wallCtx = wallCanvas.getContext('2d');
            const fogCtx = fogCanvas.getContext('2d');
            return { wallCanvas, wallCtx, fogCanvas, fogCtx };
        }

        return null;
    }

    setupCanvases(gameState, mapImg) {
        const rect = mapImg.getBoundingClientRect();
        const displayWidth = mapImg.offsetWidth;
        const displayHeight = mapImg.offsetHeight;

        console.log('Setup canvases - displayWidth:', displayWidth, 'displayHeight:', displayHeight);

        // Ensure we have valid dimensions
        if (displayWidth === 0 || displayHeight === 0) {
            console.error('Canvas dimensions are 0! Image may not be laid out yet.');
            return false;
        }

        // Set canvas dimensions to match displayed image
        gameState.wallCanvas.width = displayWidth;
        gameState.wallCanvas.height = displayHeight;
        gameState.fogCanvas.width = displayWidth;
        gameState.fogCanvas.height = displayHeight;

        // Calculate grid size
        gameState.calculateGridSize(displayWidth, displayHeight);

        console.log('Canvas setup complete - width:', displayWidth, 'height:', displayHeight, 'grid size:', gameState.GRID_SIZE);

        this.clearCanvas(gameState.wallCtx);
        this.clearCanvas(gameState.fogCtx);

        // Draw any loaded walls
        this.drawWalls(gameState);

        return true;
    }

    clearCanvas(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawWalls(gameState) {
        this.clearCanvas(gameState.wallCtx);

        // Draw completed walls
        gameState.walls.forEach(wall => {
            if (wall.vertices.length < 2) return;

            gameState.wallCtx.strokeStyle = '#ff0000';
            gameState.wallCtx.lineWidth = 3;
            gameState.wallCtx.beginPath();

            for (let i = 0; i < wall.vertices.length - 1; i++) {
                const current = wall.vertices[i];
                const next = wall.vertices[i + 1];

                if (i === 0) {
                    gameState.wallCtx.moveTo(current.x, current.y);
                }
                gameState.wallCtx.lineTo(next.x, next.y);
            }

            gameState.wallCtx.stroke();

            // Draw vertices only in edit mode
            if (gameState.currentMode === 'editWalls') {
                wall.vertices.forEach(vertex => {
                    this.drawVertex(gameState.wallCtx, vertex, gameState.selectedVertex === vertex ? '#ffff00' : '#ff0000');
                });
            }
        });

        // Draw current wall being created
        if (gameState.currentWall && gameState.currentWall.vertices.length > 0) {
            gameState.wallCtx.strokeStyle = '#ffaa00';
            gameState.wallCtx.lineWidth = 2;
            gameState.wallCtx.setLineDash([5, 5]);
            gameState.wallCtx.beginPath();

            for (let i = 0; i < gameState.currentWall.vertices.length - 1; i++) {
                const current = gameState.currentWall.vertices[i];
                const next = gameState.currentWall.vertices[i + 1];

                if (i === 0) {
                    gameState.wallCtx.moveTo(current.x, current.y);
                }
                gameState.wallCtx.lineTo(next.x, next.y);
            }

            gameState.wallCtx.stroke();
            gameState.wallCtx.setLineDash([]);

            // Draw vertices for current wall only in edit mode
            if (gameState.currentMode === 'editWalls') {
                gameState.currentWall.vertices.forEach(vertex => {
                    this.drawVertex(gameState.wallCtx, vertex, '#ffaa00');
                });
            }
        }
    }

    drawVertex(ctx, vertex, color = '#ff0000') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Add thick border for visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add white inner circle for better contrast
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawCharacters(gameState) {
        // Draw characters directly on fog canvas
        gameState.fogCtx.save();

        // Draw PCs
        gameState.playerCharacters.forEach(pc => {
            this.drawCharacter(gameState.fogCtx, pc.x, pc.y, pc === gameState.selectedPC ? '#00ff00' : '#0066ff', 'PC');
        });

        // Draw NPCs
        gameState.npcs.forEach(npc => {
            this.drawCharacter(gameState.fogCtx, npc.x, npc.y, '#ff0000', 'NPC');
        });

        gameState.fogCtx.restore();
    }

    drawCharacter(ctx, x, y, color, label) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        // Draw character circle
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 15);

        // Add black outline to text for visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(label, x, y - 15);
    }

    initializeFog(gameState) {
        this.clearCanvas(gameState.fogCtx);

        // Create animated fog pattern
        const width = gameState.fogCanvas.width;
        const height = gameState.fogCanvas.height;

        // Fill entire canvas with opaque fog
        gameState.fogCtx.fillStyle = '#4a4a4a';
        gameState.fogCtx.globalAlpha = 1.0;
        gameState.fogCtx.fillRect(0, 0, width, height);

        // Clear areas around existing PCs
        gameState.playerCharacters.forEach(pc => {
            this.clearFogAroundPosition(gameState, pc.x, pc.y, gameState.SIGHT_RADIUS * gameState.GRID_SIZE, true);
        });

        // Draw characters on top
        this.drawCharacters(gameState);
    }

    startFogAnimation(gameState) {
        if (this.fogAnimationId) {
            cancelAnimationFrame(this.fogAnimationId);
        }

        // Create a copy of the current fog state for the base
        this.baseFogCanvas = document.createElement('canvas');
        this.baseFogCanvas.width = gameState.fogCanvas.width;
        this.baseFogCanvas.height = gameState.fogCanvas.height;
        const baseFogCtx = this.baseFogCanvas.getContext('2d');
        baseFogCtx.drawImage(gameState.fogCanvas, 0, 0);

        // Ensure base fog includes all current PC positions
        this.refreshBaseFogWithAllPCs(gameState);

        const animateFog = () => {
            if (gameState.currentMode === 'playGame') {
                // Restore base fog
                gameState.fogCtx.clearRect(0, 0, gameState.fogCanvas.width, gameState.fogCanvas.height);
                gameState.fogCtx.drawImage(this.baseFogCanvas, 0, 0);

                // Add very subtle shimmer effect
                const time = Date.now() * 0.0008;
                gameState.fogCtx.save();
                gameState.fogCtx.globalAlpha = 0.03;

                // Simple gradient shimmer
                const gradient = gameState.fogCtx.createLinearGradient(0, 0, gameState.fogCanvas.width, gameState.fogCanvas.height);
                const shimmerOffset = Math.sin(time) * 0.1;
                gradient.addColorStop(0, '#666666');
                gradient.addColorStop(0.5 + shimmerOffset, '#777777');
                gradient.addColorStop(1, '#555555');

                gameState.fogCtx.fillStyle = gradient;
                gameState.fogCtx.fillRect(0, 0, gameState.fogCanvas.width, gameState.fogCanvas.height);
                gameState.fogCtx.restore();

                // Keep all current PC positions clear (temporary clear each frame)
                gameState.playerCharacters.forEach(pc => {
                    this.clearFogAroundPosition(gameState, pc.x, pc.y, gameState.SIGHT_RADIUS * gameState.GRID_SIZE, false);
                });

                // Redraw characters on top
                this.drawCharacters(gameState);

                this.fogAnimationId = requestAnimationFrame(animateFog);
            }
        };

        animateFog();
    }

    updateBaseFog(gameState) {
        // Update the base fog when permanent changes are made
        if (this.baseFogCanvas && gameState.currentMode === 'playGame') {
            const baseFogCtx = this.baseFogCanvas.getContext('2d');
            baseFogCtx.clearRect(0, 0, this.baseFogCanvas.width, this.baseFogCanvas.height);
            baseFogCtx.drawImage(gameState.fogCanvas, 0, 0);
        }
    }

    refreshBaseFogWithAllPCs(gameState) {
        // Refresh the base fog to show current line of sight for all PCs
        if (this.baseFogCanvas && gameState.currentMode === 'playGame') {
            // Copy current fog state to base
            const baseFogCtx = this.baseFogCanvas.getContext('2d');
            baseFogCtx.clearRect(0, 0, this.baseFogCanvas.width, this.baseFogCanvas.height);
            baseFogCtx.drawImage(gameState.fogCanvas, 0, 0);

            // Clear fog around all current PC positions in the base fog
            gameState.playerCharacters.forEach(pc => {
                this.clearFogAroundPositionInCanvas(baseFogCtx, gameState, pc.x, pc.y, gameState.SIGHT_RADIUS * gameState.GRID_SIZE);
            });
        }
    }

    clearFogAroundPositionInCanvas(ctx, gameState, x, y, radius) {
        // Clear fog with line-of-sight calculation in a specific canvas context
        const clearedPixels = new Set();

        // Cast rays in all directions
        const rayCount = 360;
        for (let angle = 0; angle < rayCount; angle++) {
            const radians = (angle * Math.PI) / 180;
            const dx = Math.cos(radians);
            const dy = Math.sin(radians);

            // Cast ray until it hits a wall or reaches max distance
            for (let distance = 0; distance <= radius; distance += 1) {
                const rayX = x + dx * distance;
                const rayY = y + dy * distance;

                // Check if ray hits a wall
                if (this.geometryUtils.isPositionBlockedByWall(gameState.walls, x, y, rayX, rayY)) {
                    break;
                }

                // Clear fog at this position
                const pixelKey = `${Math.floor(rayX)},${Math.floor(rayY)}`;
                if (!clearedPixels.has(pixelKey)) {
                    clearedPixels.add(pixelKey);

                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.beginPath();
                    ctx.arc(rayX, rayY, 2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }

    clearFogAroundPosition(gameState, x, y, radius, permanent = true) {
        // Line-of-sight calculation (same for both permanent and temporary)
        const clearedPixels = new Set();

        // Cast rays in all directions
        const rayCount = 360;
        for (let angle = 0; angle < rayCount; angle++) {
            const radians = (angle * Math.PI) / 180;
            const dx = Math.cos(radians);
            const dy = Math.sin(radians);

            // Cast ray until it hits a wall or reaches max distance
            for (let distance = 0; distance <= radius; distance += 1) {
                const rayX = x + dx * distance;
                const rayY = y + dy * distance;

                // Check if ray hits a wall
                if (this.geometryUtils.isPositionBlockedByWall(gameState.walls, x, y, rayX, rayY)) {
                    break;
                }

                // Clear fog at this position
                const pixelKey = `${Math.floor(rayX)},${Math.floor(rayY)}`;
                if (!clearedPixels.has(pixelKey)) {
                    clearedPixels.add(pixelKey);

                    gameState.fogCtx.save();
                    gameState.fogCtx.globalCompositeOperation = 'destination-out';
                    gameState.fogCtx.beginPath();
                    gameState.fogCtx.arc(rayX, rayY, 2, 0, 2 * Math.PI);
                    gameState.fogCtx.fill();
                    gameState.fogCtx.restore();
                }
            }
        }

        // Update base fog if this was a permanent change
        if (permanent) {
            this.updateBaseFog(gameState);
        }
    }

    reAddFog(gameState) {
        if (gameState.currentMode !== 'playGame') {
            return false;
        }

        // Clear and refill the entire fog canvas
        this.clearCanvas(gameState.fogCtx);

        const width = gameState.fogCanvas.width;
        const height = gameState.fogCanvas.height;

        // Fill entire canvas with opaque fog
        gameState.fogCtx.fillStyle = '#4a4a4a';
        gameState.fogCtx.globalAlpha = 1.0;
        gameState.fogCtx.fillRect(0, 0, width, height);

        // Clear areas around existing PCs only
        gameState.playerCharacters.forEach(pc => {
            this.clearFogAroundPosition(gameState, pc.x, pc.y, gameState.SIGHT_RADIUS * gameState.GRID_SIZE, true);
        });

        // Update the base fog for animation
        if (this.baseFogCanvas) {
            const baseFogCtx = this.baseFogCanvas.getContext('2d');
            baseFogCtx.clearRect(0, 0, this.baseFogCanvas.width, this.baseFogCanvas.height);
            baseFogCtx.drawImage(gameState.fogCanvas, 0, 0);
        }

        // Draw characters on top
        this.drawCharacters(gameState);

        return true;
    }
}