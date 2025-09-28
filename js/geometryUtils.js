class GeometryUtils {

    isPositionBlockedByWall(walls, startX, startY, endX, endY) {
        // Check if line of sight from start to end position is blocked by any wall
        for (const wall of walls) {
            if (wall.vertices.length < 2) continue;

            // Check intersection with each wall segment
            for (let i = 0; i < wall.vertices.length - 1; i++) {
                const wallStart = wall.vertices[i];
                const wallEnd = wall.vertices[i + 1];

                if (this.lineIntersectsLine(startX, startY, endX, endY, wallStart.x, wallStart.y, wallEnd.x, wallEnd.y)) {
                    return true;
                }
            }
        }
        return false;
    }

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Calculate line intersection using parametric form
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denom) < 1e-10) {
            // Lines are parallel
            return false;
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        // Check if intersection point is within both line segments
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
}