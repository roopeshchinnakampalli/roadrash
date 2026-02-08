import { Road, Segment, Point } from './Road';
import { CAMERA_DEPTH, SCREEN_WIDTH, SCREEN_HEIGHT, ROAD_WIDTH, COLORS, SEGMENT_LENGTH } from './Constants';

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

    public render(road: Road, cameraX: number, cameraY: number, cameraZ: number, playerX: number, drawDistance: number) {
        this.clear();

        const baseSegment = road.getSegment(cameraZ);
        const baseIndex = baseSegment.index;
        const maxy = this.height;
        let clipBottom = this.height;
        const trackLength = road.segments.length * SEGMENT_LENGTH;

        const basePercent = (cameraZ % SEGMENT_LENGTH) / SEGMENT_LENGTH;
        let dx = -(baseSegment.curve * basePercent);
        let x = 0;

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

            this.project(tempP1, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);
            this.project(tempP2, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);

            if (tempP1.camera.z <= CAMERA_DEPTH || tempP2.screen.y >= clipBottom || tempP2.screen.y >= tempP1.screen.y) {
                 continue;
            }

            // Draw segment
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

        // Draw Player
        this.renderPlayer(this.width, this.height, this.width / 2, this.height - 20, 0.5); // Placeholder
    }

    private renderPlayer(width: number, height: number, destX: number, destY: number, steer: number) {
        // Simple bike representation
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(destX - 5, destY - 10, 10, 10); // Wheel

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(destX - 10, destY - 30, 20, 20); // Body

        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(destX, destY - 40, 8, 0, Math.PI * 2); // Head
        this.ctx.fill();
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
