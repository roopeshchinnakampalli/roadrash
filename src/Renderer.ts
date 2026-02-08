import { Road, Segment, Point } from './Road';
import { Player } from './Player';
import { CAMERA_DEPTH, SCREEN_WIDTH, SCREEN_HEIGHT, ROAD_WIDTH, COLORS, SEGMENT_LENGTH } from './Constants';
import { Sprite, SpriteType } from './Sprite';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Draw sky
        this.ctx.fillStyle = COLORS.SKY;
        this.ctx.fillRect(0, 0, this.width, this.height);
        // Draw fog/distant terrain
        this.ctx.fillStyle = COLORS.FOG;
        this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);
    }

    public project(p: Point, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;

        // Prevent division by zero or negative scale behind camera
        if (p.camera.z <= 0) {
             p.screen.scale = 0;
        } else {
             p.screen.scale = cameraDepth / p.camera.z;
        }

        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
    }

    public render(road: Road, player: Player, cameraY: number, cameraZ: number, drawDistance: number) {
        this.clear();

        const baseSegment = road.getSegment(cameraZ);
        const baseIndex = baseSegment.index;
        const maxy = this.height;
        let clipBottom = this.height;
        const trackLength = road.segments.length * SEGMENT_LENGTH;
        const playerX = player.x;

        const basePercent = (cameraZ % SEGMENT_LENGTH) / SEGMENT_LENGTH;
        let dx = -(baseSegment.curve * basePercent);
        let x = 0;

        // Draw segments from front to back
        for (let n = 0; n < drawDistance; n++) {
            const segment = road.segments[(baseIndex + n) % road.segments.length];
            const looped = segment.index < baseIndex;
            const loopOffset = looped ? trackLength : 0;

            const p1 = segment.p1;
            const p2 = segment.p2;

            const p1z = p1.world.z + loopOffset;
            const p2z = p2.world.z + loopOffset;

            // Curve calculation
            const p1x = x;
            dx += segment.curve;
            x += dx;
            const p2x = x;

            const tempP1: Point = {
                world: { x: p1.world.x + p1x, y: p1.world.y, z: p1z },
                camera: { x: 0, y: 0, z: 0 },
                screen: { x: 0, y: 0, w: 0, scale: 0 }
            };

            const tempP2: Point = {
                world: { x: p2.world.x + p2x, y: p2.world.y, z: p2z },
                camera: { x: 0, y: 0, z: 0 },
                screen: { x: 0, y: 0, w: 0, scale: 0 }
            };

            const cameraX = playerX * ROAD_WIDTH;

            this.project(tempP1, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);
            this.project(tempP2, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);

            // Store clip data for sprite rendering (must happen back-to-front for proper layering)
            // Actually, sprites should be drawn back-to-front along with segments?
            // Standard approach: Draw road back-to-front. Draw sprites back-to-front.
            // If we draw segments front-to-back for culling, we can't easily interleave sprites unless we store them.
            // Wait, we are drawing segments back-to-front? No, loop starts at `baseIndex` (closest) and goes to `drawDistance`.
            // The typical "painter's algorithm" for this engine is BACK-TO-FRONT.
            // But my current loop goes `n = 0` to `drawDistance`, which is front-to-back?
            // `baseIndex` is where the camera is.
            // If I draw front-to-back (closest first), I need to manage occlusion (clipBottom).
            // Yes, I am using `clipBottom`. This is front-to-back rendering for the road surface.

            // For sprites, we usually want back-to-front so distant sprites are behind closer ones.
            // AND distant sprites are behind closer ROAD segments (hills).
            // But closer sprites are IN FRONT of distant road segments.

            // Standard approach in these engines:
            // 1. Draw road segments BACK to FRONT. (No clipBottom needed, just overdraw).
            // OR
            // 2. Draw road segments FRONT to BACK (using clipBottom for optimization/hills).
            //    Then draw Sprites BACK to FRONT, respecting the hill occlusion.

            // With FRONT-TO-BACK road rendering, we need to store the segments to draw sprites later?
            // Or we can just draw sprites after?

            // If I draw sprites back-to-front after the road, I need to know which segments cover them (hills).
            // `clipBottom` logic handles road covering road.
            // For sprites, we need to check if the sprite is visible.
            // A sprite at segment N is occluded if the road at segment N-1 (or closer) was drawn "higher" on screen.

            // Actually, the simplest way is to collect sprites while iterating, then draw them back-to-front.
            // Since we iterate front-to-back, we can just push sprites to a list.
            // But we need the screen coordinates.

            // Let's modify the loop to store projected points? No, that's heavy.

            // Let's stick to the current plan:
            // Render road Front-to-Back.
            // Then Render Sprites Back-to-Front.

            // To handle hills occluding sprites:
            // We need to record the `clipY` for each segment?
            // `segment.clip` property exists in `Road.ts` interface! I can use that.

            segment.clip = clipBottom;

            if (tempP1.camera.z <= CAMERA_DEPTH || tempP2.screen.y >= clipBottom || tempP2.screen.y >= tempP1.screen.y) {
                 continue;
            }

            this.drawSegment(
                this.ctx,
                this.width,
                road.lanes,
                tempP1.screen.x,
                tempP1.screen.y,
                tempP1.screen.w,
                tempP2.screen.x,
                tempP2.screen.y,
                tempP2.screen.w,
                segment.color
            );

            clipBottom = tempP2.screen.y;
            // Update segment clip for sprites in this segment
            segment.clip = clipBottom;
        }

        // Draw Sprites Back-to-Front
        for (let n = drawDistance - 1; n > 0; n--) {
            const segment = road.segments[(baseIndex + n) % road.segments.length];
             // We need to re-project sprite position?
             // Since we didn't store the exact X offset calculation from the curve, we might need to re-calculate 'x' for the sprite...
             // This is tricky. The 'x' accumulator in the loop above is crucial.

             // Alternative: Store the accumulated X for each segment in the first pass?
             // Yes, let's store `p1.screen` or similar on the segment temporarily?
             // Or just an `screenX` and `screenScale` on the segment?
             // `segment.p1.screen` exists! I can update it in the first loop.

             // In the first loop, I am creating `tempP1`. I should update `segment.p1.screen` with `tempP1.screen`.
             // Wait, `tempP1.screen` is a reference to a new object? No, `screen` is a nested object.
             // `const tempP1 = { ... screen: { ... } }`.
             // I should copy values back to `segment.p1.screen`.
        }

        // Re-write loop to support sprite rendering

        // Reset x and dx
        dx = -(baseSegment.curve * basePercent);
        x = 0;
        clipBottom = this.height;

        // We'll traverse Front-to-Back to draw Road and Calculate Coordinates
        for (let n = 0; n < drawDistance; n++) {
            const segment = road.segments[(baseIndex + n) % road.segments.length];
            const looped = segment.index < baseIndex;
            const loopOffset = looped ? trackLength : 0;

            const p1 = segment.p1;
            const p2 = segment.p2;

            // Curve
            const p1x = x;
            dx += segment.curve;
            x += dx;
            const p2x = x;

            // Project P1
             const p1z = p1.world.z + loopOffset;
             const tempP1: Point = {
                world: { x: p1.world.x + p1x, y: p1.world.y, z: p1z },
                camera: { x: 0, y: 0, z: 0 },
                screen: { x: 0, y: 0, w: 0, scale: 0 }
            };
            const cameraX = playerX * ROAD_WIDTH;
            this.project(tempP1, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);

            // Store screen props on segment for sprite rendering
            segment.p1.screen.x = tempP1.screen.x;
            segment.p1.screen.y = tempP1.screen.y;
            segment.p1.screen.w = tempP1.screen.w;
            segment.p1.screen.scale = tempP1.screen.scale;

            // Project P2
            const p2z = p2.world.z + loopOffset;
            const tempP2: Point = {
                world: { x: p2.world.x + p2x, y: p2.world.y, z: p2z },
                camera: { x: 0, y: 0, z: 0 },
                screen: { x: 0, y: 0, w: 0, scale: 0 }
            };
            this.project(tempP2, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);

            // Store clip
            segment.clip = clipBottom;

            if (tempP1.camera.z <= CAMERA_DEPTH || tempP2.screen.y >= clipBottom || tempP2.screen.y >= tempP1.screen.y) {
                 continue;
            }

            this.drawSegment(
                this.ctx,
                this.width,
                road.lanes,
                tempP1.screen.x,
                tempP1.screen.y,
                tempP1.screen.w,
                tempP2.screen.x,
                tempP2.screen.y,
                tempP2.screen.w,
                segment.color
            );

            clipBottom = tempP2.screen.y;
        }

        // Draw Sprites Back-to-Front
        for (let n = drawDistance - 1; n > 0; n--) {
            const segment = road.segments[(baseIndex + n) % road.segments.length];

            for (const sprite of segment.sprites) {
                // Calculate sprite position
                const spriteScale = segment.p1.screen.scale;
                const spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * ROAD_WIDTH * this.width / 2);
                const spriteY = segment.p1.screen.y;

                // Draw sprite respecting clip
                // But `segment.clip` is the clip BEFORE this segment was drawn (if Front-to-Back).
                // Wait, in the loop above: `segment.clip = clipBottom` (current clip bottom).
                // If a hill goes UP, clipBottom decreases (moves up).
                // Objects on the segment should be clipped by `segment.clip`?
                // Actually, objects stand ON the ground.

                this.drawSprite(sprite, spriteScale, spriteX, spriteY, segment.clip);
            }
        }

        // Draw Player
        this.renderPlayer(this.width, this.height, this.width / 2, this.height - 20, 0.5, player);

        // Draw HUD
        this.renderHUD(player);
    }

    private renderHUD(player: Player) {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(10, 10, 200, 60);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'white';
        this.ctx.strokeRect(10, 10, 200, 60);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Speed: ${Math.floor(player.speed / 100)} km/h`, 20, 35);

        // Health Bar
        this.ctx.fillText("Health:", 20, 60);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(90, 45, 100, 15);
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(90, 45, (player.health / player.maxHealth) * 100, 15);
    }

    private drawSprite(sprite: Sprite, scale: number, destX: number, destY: number, clipY: number) {
        const spriteWidth = 64 * scale * 50; // Arbitrary scale factor
        const spriteHeight = 64 * scale * 50;

        const top = destY - spriteHeight;

        // Simple culling
        if (destY < 0 || top > this.height) return;

        // Clip logic: if sprite is below the clipY (which is the road hill), we might need to crop?
        // Actually, `clipY` is the top of the road drawn previously (closer road).
        // Since we draw back-to-front, we are drawing sprites on top of distant road.
        // But if there is a closer hill (drawn later in Front-to-Back road loop), it would obscure this sprite.
        // Wait, my sprite loop is Back-to-Front.
        // Road was Front-to-Back.
        // The road polygons are already on screen.
        // If I draw a distant sprite now, it will be ON TOP of the distant road (correct).
        // But it will also be ON TOP of the closer road (incorrect) if the closer road covers it.
        // BUT, closer road was drawn FIRST.
        // So drawing a distant sprite now will overwrite the closer road!
        // This is the problem with mixing Front-to-Back road with Back-to-Front sprites.

        // Solution:
        // Use the stored `clip` from the road pass.
        // If the sprite's bottom (destY) is below the clip of the segment, it's fine?
        // No, `clip` tells us the screen Y where the road was drawn.

        // Correct approach for mixed rendering:
        // 1. Draw Road Front-to-Back.
        // 2. Draw Sprites Back-to-Front.
        //    AND check against the current "horizon" or clip?

        // Actually, typical implementation is:
        // Draw Sprites Back-to-Front.
        // For each sprite, check if it's occluded by a closer segment?
        // That's hard.

        // Easier:
        // Draw EVERYTHING Back-to-Front.
        // Road segments: Draw n=DrawDistance down to 0.
        // Sprites: Draw sprites on segment n.
        // This naturally handles occlusion (Painter's Algo).
        // BUT, Back-to-Front road rendering is slower (overdraw) and harder to handle the "clip" for hills (sky/terrain).
        // Actually, for hills, Back-to-Front is fine, you just draw over.
        // The `clipBottom` optimization in Front-to-Back is strictly to avoid overdraw and easily fill "grass" logic.

        // Given I already have Front-to-Back road working well for hills/curves.
        // I should stick to it.
        // To fix the sprite occlusion:
        // When drawing sprites Back-to-Front, we need to know the `clipY` of the terrain *in front* of it?
        // In Front-to-Back loop, `clipBottom` tracks the lowest visible Y so far (the crest of the hill effectively).
        // Any segment drawn subsequently (further back) must be above `clipBottom`.
        // This implies that anything *below* `clipBottom` is occluded by the hill.
        // So for a sprite at segment N, if its screen Y is below the `clipBottom` recorded at segment N, it is visible?
        // No, `clipBottom` at segment N is determined by segments 0..N-1.
        // So `segment.clip` stored in my loop IS the occlusion line.
        // Anything below `segment.clip` is hidden by closer ground.
        // So: `const clipH = segment.clip; if (destY > clipH) { ... clip ... }`?
        // Yes! `segment.clip` is the screen Y of the road "horizon" as seen from that segment looking forward?
        // No, `segment.clip` as I stored it is the `clipBottom` *before* drawing segment N.
        // So it represents the highest point of the road *closer* than segment N.
        // So any part of the sprite *below* `segment.clip` should be visible?
        // Wait, screen Y increases downwards.
        // `clipBottom` starts at `height` (bottom of screen) and moves UP (decreases) as we go up hills.
        // So `clipBottom` is the "top edge" of the previously drawn road (closer road).
        // Anything with Y > clipBottom (lower on screen) is *in front* of the previous road? No.
        // Valid road is drawn *above* clipBottom (Y < clipBottom).
        // Wait, `if (segment.p2.screen.y >= clipBottom) continue`.
        // This means we only draw if the new segment is HIGHER (smaller Y) than the previous.
        // So the road builds UP the screen.
        // So `clipBottom` is the line below which the screen is filled with closer road.
        // So any sprite at segment N (distant) must be drawn *above* `clipBottom` (Y < clipBottom) to be visible?
        // Yes! If a sprite's Y is > clipBottom, it is "under" the closer road.

        // So for Sprite Rendering:
        // `clipY` = `segment.clip`.
        // Draw the sprite, but clip it at `clipY`.
        // Since Y increases downwards, "below clipY" means Y > clipY.
        // We want to keep the part where Y < clipY.

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.width, clipY); // Clip region: Top of screen down to clipY.
        this.ctx.clip();

        this.renderSpriteIcon(sprite, destX, destY, spriteWidth, spriteHeight);

        this.ctx.restore();
    }

    private renderSpriteIcon(sprite: Sprite, x: number, y: number, w: number, h: number) {
         // Placeholder shapes
         if (sprite.type === SpriteType.TREE) {
             this.ctx.fillStyle = COLORS.TREE;
             this.ctx.fillRect(x - w/2, y - h, w, h);

             // Trunk
             this.ctx.fillStyle = '#654321';
             this.ctx.fillRect(x - w/8, y - h/2, w/4, h/2);
             // Leaves
             this.ctx.fillStyle = '#005108';
             this.ctx.beginPath();
             this.ctx.moveTo(x, y - h);
             this.ctx.lineTo(x - w/2, y - h/2);
             this.ctx.lineTo(x + w/2, y - h/2);
             this.ctx.fill();
         } else if (sprite.type === SpriteType.SIGN) {
             // Post
             this.ctx.fillStyle = 'grey';
             this.ctx.fillRect(x - w/10, y - h, w/5, h);
             // Sign
             this.ctx.fillStyle = 'yellow';
             this.ctx.fillRect(x - w/2, y - h, w, h/3);
             this.ctx.fillStyle = 'black';
             this.ctx.font = `${Math.max(10, h/4)}px Arial`;
             this.ctx.textAlign = 'center';
             this.ctx.fillText("!", x, y - h*0.75);
         }
    }

    private renderPlayer(width: number, height: number, destX: number, destY: number, steer: number, player: Player) {
        // ... (Keep existing)
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(destX - 5, destY - 10, 10, 10); // Wheel

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(destX - 10, destY - 30, 20, 20); // Body

        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(destX, destY - 40, 8, 0, Math.PI * 2); // Head
        this.ctx.fill();

        // Draw hands/actions
        if (player.state === 'Punching') {
            this.ctx.fillStyle = 'orange';
            this.ctx.fillRect(destX + 10, destY - 35, 15, 5); // Punch arm
        } else if (player.state === 'Kicking') {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(destX + 10, destY - 15, 15, 5); // Kick leg
        } else if (player.state === 'WipeOut') {
             this.ctx.fillStyle = 'grey';
             this.ctx.beginPath();
             this.ctx.arc(destX, destY - 20, 25, 0, Math.PI * 2);
             this.ctx.fill();
        }
    }

    private drawSegment(ctx: CanvasRenderingContext2D, width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, color: any) {
        const r1 = w1 / 3; // rumble width
        const r2 = w2 / 3;
        const l1 = w1 / 32; // lane marker width
        const l2 = w2 / 32;

        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);

        this.drawPolygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
        this.drawPolygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
        this.drawPolygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

        if (color.lane) {
            const laneW1 = w1 * 2 / lanes;
            const laneW2 = w2 * 2 / lanes;
            let laneX1 = x1 - w1 + laneW1;
            let laneX2 = x2 - w2 + laneW2;
            for (let i = 1; i < lanes; i++) {
                this.drawPolygon(ctx, laneX1 - l1/2, y1, laneX1 + l1/2, y1, laneX2 + l2/2, y2, laneX2 - l2/2, y2, color.lane);
                laneX1 += laneW1;
                laneX2 += laneW2;
            }
        }
    }

    private drawPolygon(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    }
}
