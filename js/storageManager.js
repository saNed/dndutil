class StorageManager {
    constructor() {
        this.storageKey = 'dndutil-walls';
    }

    saveWalls(gameState) {
        try {
            const wallData = {
                walls: gameState.walls,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(wallData));
            console.log('Walls saved to localStorage');
        } catch (error) {
            console.error('Failed to save walls to localStorage:', error);
        }
    }

    loadWalls(gameState) {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const wallData = JSON.parse(savedData);
                gameState.walls = wallData.walls || [];
                console.log('Loaded', gameState.walls.length, 'walls from localStorage');
                return true;
            }
        } catch (error) {
            console.error('Failed to load walls from localStorage:', error);
            gameState.walls = [];
        }
        return false;
    }

    clearWalls() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Cleared walls from localStorage');
        } catch (error) {
            console.error('Failed to clear walls from localStorage:', error);
        }
    }

    exportWalls(gameState) {
        try {
            const wallData = {
                walls: gameState.walls,
                timestamp: Date.now(),
                exportDate: new Date().toISOString()
            };
            return JSON.stringify(wallData, null, 2);
        } catch (error) {
            console.error('Failed to export walls:', error);
            return null;
        }
    }

    importWalls(gameState, jsonData) {
        try {
            const wallData = JSON.parse(jsonData);
            if (wallData.walls && Array.isArray(wallData.walls)) {
                gameState.walls = wallData.walls;
                this.saveWalls(gameState);
                console.log('Imported', gameState.walls.length, 'walls');
                return true;
            } else {
                console.error('Invalid wall data format');
                return false;
            }
        } catch (error) {
            console.error('Failed to import walls:', error);
            return false;
        }
    }

    getStorageStats() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const wallData = JSON.parse(savedData);
                return {
                    wallCount: wallData.walls ? wallData.walls.length : 0,
                    lastSaved: wallData.timestamp ? new Date(wallData.timestamp) : null,
                    storageSize: savedData.length
                };
            }
        } catch (error) {
            console.error('Failed to get storage stats:', error);
        }
        return {
            wallCount: 0,
            lastSaved: null,
            storageSize: 0
        };
    }
}