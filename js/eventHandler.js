class EventHandler {
    constructor(gameState, renderer, storage) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.storage = storage;

        // Click detection for triple-click
        this.clickCount = 0;
        this.clickTimer = null;

        // Bind methods to preserve 'this' context
        this.handleMapUpload = this.handleMapUpload.bind(this);
        this.toggleWallEditMode = this.toggleWallEditMode.bind(this);
        this.startPlayMode = this.startPlayMode.bind(this);
        this.reAddFog = this.reAddFog.bind(this);
        this.clearAllWalls = this.clearAllWalls.bind(this);
        this.handleWallCanvasClick = this.handleWallCanvasClick.bind(this);
        this.handleWallCanvasDoubleClick = this.handleWallCanvasDoubleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleFogCanvasClick = this.handleFogCanvasClick.bind(this);
        this.handleFogCanvasDoubleClick = this.handleFogCanvasDoubleClick.bind(this);
        this.handleFogMouseDown = this.handleFogMouseDown.bind(this);
        this.handleFogMouseMove = this.handleFogMouseMove.bind(this);
        this.handlePCDragMove = this.handlePCDragMove.bind(this);
        this.handlePCDragEnd = this.handlePCDragEnd.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    init() {
        // Get DOM elements
        const fileInput = document.getElementById('fileInput');
        const chooseMapBtn = document.getElementById('chooseMapBtn');
        const editWallsBtn = document.getElementById('editWallsBtn');
        const playGameBtn = document.getElementById('playGameBtn');
        const reAddFogBtn = document.getElementById('reAddFogBtn');
        const clearWallsBtn = document.getElementById('clearWallsBtn');

        // Initialize canvas references
        const canvasRefs = this.renderer.init();
        if (canvasRefs) {
            const mapImg = document.getElementById('mapImage');
            this.gameState.setCanvasReferences(
                canvasRefs.wallCanvas,
                canvasRefs.wallCtx,
                canvasRefs.fogCanvas,
                canvasRefs.fogCtx,
                mapImg
            );

            // Setup canvas event listeners
            this.setupCanvasEventListeners();
        }

        // Button event listeners
        chooseMapBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleMapUpload);
        editWallsBtn.addEventListener('click', this.toggleWallEditMode);
        playGameBtn.addEventListener('click', this.startPlayMode);
        reAddFogBtn.addEventListener('click', this.reAddFog);
        clearWallsBtn.addEventListener('click', this.clearAllWalls);

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
    }

    setupCanvasEventListeners() {
        // Wall canvas events
        this.gameState.wallCanvas.addEventListener('click', this.handleWallCanvasClick);
        this.gameState.wallCanvas.addEventListener('dblclick', this.handleWallCanvasDoubleClick);
        this.gameState.wallCanvas.addEventListener('mousedown', this.handleMouseDown);
        this.gameState.wallCanvas.addEventListener('mousemove', this.handleMouseMove);
        this.gameState.wallCanvas.addEventListener('mouseup', this.handleMouseUp);

        // Fog canvas events
        this.gameState.fogCanvas.addEventListener('click', this.handleFogCanvasClick);
        this.gameState.fogCanvas.addEventListener('dblclick', this.handleFogCanvasDoubleClick);
        this.gameState.fogCanvas.addEventListener('mousedown', this.handleFogMouseDown);
        this.gameState.fogCanvas.addEventListener('mousemove', this.handleFogMouseMove);
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
        }
    }

    handleMapUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.updateStatus('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.gameState.mapImage.src = e.target.result;
            this.gameState.mapImage.onload = () => {
                // Show the container first so the image gets laid out
                const mapContainer = document.getElementById('mapContainer');
                mapContainer.style.display = 'block';

                // Use setTimeout to ensure the image is laid out before sizing canvases
                setTimeout(() => {
                    const success = this.renderer.setupCanvases(this.gameState, this.gameState.mapImage);
                    if (success) {
                        // Enable buttons
                        document.getElementById('editWallsBtn').disabled = false;
                        document.getElementById('playGameBtn').disabled = false;
                        document.getElementById('reAddFogBtn').disabled = false;
                        document.getElementById('clearWallsBtn').disabled = false;

                        this.updateStatus('Map loaded successfully. You can now edit walls or start playing.');

                        // Reset game state (but keep saved walls)
                        this.gameState.resetGameState();

                        // Update button states
                        document.getElementById('editWallsBtn').textContent = 'Edit Walls';
                        this.gameState.wallCanvas.classList.remove('editing');
                        this.gameState.fogCanvas.classList.remove('playing');
                        this.gameState.mapImage.classList.remove('interaction-disabled');

                        // Show status about loaded walls
                        if (this.gameState.walls.length > 0) {
                            this.updateStatus(`Map loaded with ${this.gameState.walls.length} saved walls. You can edit walls or start playing.`);
                        }
                    }
                }, 0);
            };
        };
        reader.readAsDataURL(file);
    }

    toggleWallEditMode() {
        if (this.gameState.currentMode === 'editWalls') {
            // Exit wall editing mode
            this.gameState.setMode('view');
            document.getElementById('editWallsBtn').textContent = 'Edit Walls';
            this.gameState.wallCanvas.classList.remove('editing');
            this.gameState.mapImage.classList.remove('interaction-disabled');
            this.gameState.currentWall = null;
            this.gameState.selectedVertex = null;
            this.renderer.drawWalls(this.gameState);
            this.updateStatus('Exited wall editing mode. Map is now in view mode.');
        } else {
            // Enter wall editing mode
            this.gameState.setMode('editWalls');
            document.getElementById('editWallsBtn').textContent = 'Stop Editing Walls';
            this.gameState.wallCanvas.classList.add('editing');
            this.gameState.fogCanvas.classList.remove('playing');
            this.gameState.mapImage.classList.add('interaction-disabled');
            this.updateStatus('Wall editing mode - click to place vertices, double-click to finish wall, click vertex + delete to remove wall');
        }
    }

    startPlayMode() {
        this.gameState.setMode('playGame');
        document.getElementById('editWallsBtn').textContent = 'Edit Walls';
        this.gameState.wallCanvas.classList.remove('editing');
        this.gameState.fogCanvas.classList.add('playing');
        this.gameState.mapImage.classList.add('interaction-disabled');
        this.gameState.currentWall = null;
        this.gameState.selectedVertex = null;

        // Redraw walls without vertices
        this.renderer.drawWalls(this.gameState);

        // Initialize fog
        this.renderer.initializeFog(this.gameState);
        this.renderer.startFogAnimation(this.gameState);

        this.updateStatus('Play mode - click to spawn/move PCs, double-click for new PC, triple-click for NPC');
    }

    reAddFog() {
        const success = this.renderer.reAddFog(this.gameState);
        if (success) {
            this.updateStatus('Fog has been reset! Only current PC sight areas remain clear.');
        } else {
            this.updateStatus('Re-add Fog only works in play mode.');
        }
    }

    clearAllWalls() {
        if (confirm('Are you sure you want to clear all walls? This cannot be undone.')) {
            this.gameState.clearAllWalls();
            this.storage.clearWalls();
            this.renderer.drawWalls(this.gameState);
            this.updateStatus('All walls have been cleared and removed from storage.');
        }
    }

    // Wall editing event handlers
    handleWallCanvasClick(event) {
        if (this.gameState.currentMode !== 'editWalls') return;

        const rect = this.gameState.wallCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicking on an existing vertex
        const clickedVertex = this.gameState.findVertexAt(x, y);
        if (clickedVertex) {
            this.gameState.selectedVertex = clickedVertex;
            this.updateStatus('Vertex selected. Press Delete to remove wall, or drag to move.');
            return;
        }

        this.gameState.selectedVertex = null;

        // If no current wall, start a new one
        if (!this.gameState.currentWall) {
            this.gameState.currentWall = {
                vertices: [{ x, y }],
                id: Date.now()
            };
            this.renderer.drawWalls(this.gameState);
            this.updateStatus('Started new wall. Click to add more vertices, double-click to finish.');
        } else {
            // Add vertex to current wall
            this.gameState.currentWall.vertices.push({ x, y });
            this.renderer.drawWalls(this.gameState);
            this.updateStatus(`Wall has ${this.gameState.currentWall.vertices.length} vertices. Double-click to finish.`);
        }
    }

    handleWallCanvasDoubleClick(event) {
        if (this.gameState.currentMode !== 'editWalls' || !this.gameState.currentWall) return;

        const rect = this.gameState.wallCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Add final vertex and complete the wall
        if (this.gameState.currentWall.vertices.length > 0) {
            this.gameState.currentWall.vertices.push({ x, y });
            this.gameState.addWall(this.gameState.currentWall);
            this.gameState.currentWall = null;
            this.renderer.drawWalls(this.gameState);
            this.storage.saveWalls(this.gameState);
            this.updateStatus('Wall completed. Click to start a new wall.');
        }
    }

    handleMouseDown(event) {
        if (this.gameState.currentMode !== 'editWalls') return;

        const rect = this.gameState.wallCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedVertex = this.gameState.findVertexAt(x, y);
        if (clickedVertex) {
            this.gameState.selectedVertex = clickedVertex;
            this.gameState.isDragging = true;
            this.gameState.dragOffset = {
                x: x - clickedVertex.x,
                y: y - clickedVertex.y
            };
            this.gameState.wallCanvas.style.cursor = 'grabbing';
            event.preventDefault();
        }
    }

    handleMouseMove(event) {
        if (this.gameState.currentMode !== 'editWalls') return;

        const rect = this.gameState.wallCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.gameState.isDragging && this.gameState.selectedVertex) {
            // Update vertex position
            this.gameState.selectedVertex.x = x - this.gameState.dragOffset.x;
            this.gameState.selectedVertex.y = y - this.gameState.dragOffset.y;

            // Redraw walls with updated position
            this.renderer.drawWalls(this.gameState);
            event.preventDefault();
        } else {
            // Update cursor based on whether we're hovering over a vertex
            const hoverVertex = this.gameState.findVertexAt(x, y);
            this.gameState.wallCanvas.style.cursor = hoverVertex ? 'grab' : 'crosshair';
        }
    }

    handleMouseUp(event) {
        if (this.gameState.isDragging) {
            this.gameState.isDragging = false;
            this.gameState.dragOffset = { x: 0, y: 0 };
            this.gameState.wallCanvas.style.cursor = 'crosshair';
            this.storage.saveWalls(this.gameState);
            this.updateStatus('Vertex moved. Click to select another vertex or continue adding walls.');
        }
    }

    // Character interaction event handlers
    handleFogCanvasClick(event) {
        if (this.gameState.currentMode !== 'playGame') return;

        const rect = this.gameState.fogCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.clickCount++;

        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
        }

        this.clickTimer = setTimeout(() => {
            if (this.clickCount === 1) {
                this.handleSingleClick(x, y);
            } else if (this.clickCount === 2) {
                this.handleDoubleClick(x, y);
            } else if (this.clickCount === 3) {
                this.handleTripleClick(x, y);
            }
            this.clickCount = 0;
        }, 300);
    }

    handleSingleClick(x, y) {
        // Check if clicking on existing PC
        const pc = this.gameState.findPCAt(x, y);
        if (pc) {
            this.gameState.selectedPC = pc;
            this.updateStatus('PC selected. Drag to move, or click elsewhere to deselect.');
        } else {
            this.gameState.selectedPC = null;
            this.updateStatus('No PC at this location. Double-click to create new PC, triple-click for NPC.');
        }
        this.renderer.drawCharacters(this.gameState);
    }

    handleDoubleClick(x, y) {
        // Create new PC
        this.gameState.updateSightRadius(); // Update from global window value
        const newPC = {
            x: x,
            y: y,
            id: Date.now(),
            type: 'pc'
        };
        this.gameState.addPlayerCharacter(newPC);
        this.gameState.selectedPC = newPC;

        // Clear fog around new PC
        this.renderer.clearFogAroundPosition(this.gameState, x, y, this.gameState.SIGHT_RADIUS * this.gameState.GRID_SIZE, true);

        this.renderer.drawCharacters(this.gameState);
        this.updateStatus(`New PC created. PCs can see ${this.gameState.SIGHT_RADIUS} feet around them.`);
    }

    handleTripleClick(x, y) {
        // Create new NPC
        const newNPC = {
            x: x,
            y: y,
            id: Date.now(),
            type: 'npc'
        };
        this.gameState.addNPC(newNPC);

        this.renderer.drawCharacters(this.gameState);
        this.updateStatus('New NPC created. NPCs do not affect fog.');
    }

    handleFogCanvasDoubleClick(event) {
        // Prevent the double-click from being handled separately
        event.preventDefault();
    }

    handleFogMouseDown(event) {
        if (this.gameState.currentMode !== 'playGame') return;

        const rect = this.gameState.fogCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const pc = this.gameState.findPCAt(x, y);
        if (pc) {
            this.gameState.selectedPC = pc;
            this.gameState.isDraggingPC = true;
            this.gameState.dragStartPos = { x: pc.x, y: pc.y };
            this.gameState.fogCanvas.style.cursor = 'grabbing';

            // Add mousemove and mouseup listeners to document for better drag experience
            document.addEventListener('mousemove', this.handlePCDragMove);
            document.addEventListener('mouseup', this.handlePCDragEnd);

            event.preventDefault();
        }
    }

    handlePCDragMove(event) {
        if (!this.gameState.isDraggingPC || !this.gameState.selectedPC) return;

        const rect = this.gameState.fogCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Update PC position
        this.gameState.selectedPC.x = x;
        this.gameState.selectedPC.y = y;

        // Clear fog around PC as it moves
        this.gameState.updateSightRadius(); // Update from global window value
        this.renderer.clearFogAroundPosition(this.gameState, x, y, this.gameState.SIGHT_RADIUS * this.gameState.GRID_SIZE, true);

        this.renderer.drawCharacters(this.gameState);
        event.preventDefault();
    }

    handlePCDragEnd(event) {
        if (this.gameState.isDraggingPC) {
            this.gameState.isDraggingPC = false;
            this.gameState.fogCanvas.style.cursor = 'default';

            // Remove event listeners
            document.removeEventListener('mousemove', this.handlePCDragMove);
            document.removeEventListener('mouseup', this.handlePCDragEnd);

            this.updateStatus('PC moved. Fog has been cleared in their new line of sight.');
        }
    }

    handleFogMouseMove(event) {
        if (this.gameState.currentMode !== 'playGame' || this.gameState.isDraggingPC) return;

        const rect = this.gameState.fogCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const pc = this.gameState.findPCAt(x, y);
        this.gameState.fogCanvas.style.cursor = pc ? 'grab' : 'default';
    }

    handleKeyDown(event) {
        if (this.gameState.currentMode !== 'editWalls' || !this.gameState.selectedVertex) return;

        if (event.key === 'Delete' || event.key === 'Backspace') {
            const wall = this.gameState.findWallContainingVertex(this.gameState.selectedVertex);
            if (wall) {
                // Remove the entire wall
                if (wall === this.gameState.currentWall) {
                    this.gameState.currentWall = null;
                } else {
                    this.gameState.removeWall(wall);
                }

                this.gameState.selectedVertex = null;
                this.renderer.drawWalls(this.gameState);
                this.storage.saveWalls(this.gameState);
                this.updateStatus('Wall deleted. Continue editing or click to start a new wall.');
            }
            event.preventDefault();
        }
    }
}