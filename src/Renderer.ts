import { Road, Segment, Point } from './Road';
import { Player } from './Player';
import { Opponent, OpponentState } from './Opponent';
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

    public render(road: Road, player: Player, cameraY: number, cameraZ: number, drawDistance: number, finished: boolean) {
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

            // Curve calculation
            const p1x = x;
            dx += segment.curve;
            x += dx;
            const p2x = x;

            // Project Points
             const p1z = p1.world.z + loopOffset;
             const tempP1: Point = {
                world: { x: p1.world.x + p1x, y: p1.world.y, z: p1z },
                camera: { x: 0, y: 0, z: 0 },
                screen: { x: 0, y: 0, w: 0, scale: 0 }
            };
            const cameraX = playerX * ROAD_WIDTH;
            this.project(tempP1, cameraX, cameraY, cameraZ, CAMERA_DEPTH, this.width, this.height, ROAD_WIDTH);

            // Store screen props
            segment.p1.screen.x = tempP1.screen.x;
            segment.p1.screen.y = tempP1.screen.y;
            segment.p1.screen.w = tempP1.screen.w;
            segment.p1.screen.scale = tempP1.screen.scale;

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

        // Draw Sprites and Riders Back-to-Front
        for (let n = drawDistance - 1; n > 0; n--) {
            const segment = road.segments[(baseIndex + n) % road.segments.length];
            const spriteScale = segment.p1.screen.scale;
            const spriteY = segment.p1.screen.y;
            const clipY = segment.clip;

            // Draw Sprites
            for (const sprite of segment.sprites) {
                const spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * ROAD_WIDTH * this.width / 2);
                this.drawSprite(sprite, spriteScale, spriteX, spriteY, clipY);
            }

            // Draw Riders
            for (const rider of segment.riders) {
                 const spriteX = segment.p1.screen.x + (spriteScale * rider.x * ROAD_WIDTH * this.width / 2);
                 this.drawRider(rider, spriteScale, spriteX, spriteY, clipY);
            }
        }

        // Draw Player
        this.renderPlayer(this.width, this.height, this.width / 2, this.height - 20, 0.5, player);

        // Draw HUD
        this.renderHUD(player, finished);
    }

    private renderHUD(player: Player, finished: boolean) {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(10, 10, 200, 60);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'white';
        this.ctx.strokeRect(10, 10, 200, 60);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Speed: ${Math.floor(player.speed / 100)} km/h`, 20, 35);

        this.ctx.fillText("Health:", 20, 60);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(90, 45, 100, 15);
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(90, 45, (player.health / player.maxHealth) * 100, 15);

        if (finished) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, this.height/2 - 50, this.width, 100);
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("FINISH!", this.width/2, this.height/2 + 10);
            this.ctx.textAlign = 'left';
        }
    }

    private drawSprite(sprite: Sprite, scale: number, destX: number, destY: number, clipY: number) {
        const spriteWidth = 64 * scale * 50;
        const spriteHeight = 64 * scale * 50;
        const top = destY - spriteHeight;

        if (destY < 0 || top > this.height) return;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.width, clipY);
        this.ctx.clip();

        this.renderSpriteIcon(sprite, destX, destY, spriteWidth, spriteHeight);

        this.ctx.restore();
    }

    private drawRider(rider: Opponent, scale: number, destX: number, destY: number, clipY: number) {
        const width = 64 * scale * 50;
        const height = 64 * scale * 50;
        const top = destY - height;

        if (destY < 0 || top > this.height) return;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.width, clipY);
        this.ctx.clip();

        this.renderRiderShape(destX, destY, width, height, rider);

        this.ctx.restore();
    }

    private renderRiderShape(x: number, y: number, w: number, h: number, rider: Opponent) {
         // Simple bike
         this.ctx.fillStyle = 'black';
         this.ctx.fillRect(x - w/4, y - h/5, w/2, h/5); // Wheel

         this.ctx.fillStyle = 'blue'; // Opponent Color
         this.ctx.fillRect(x - w/2, y - h*0.6, w, h*0.4); // Body

         this.ctx.fillStyle = 'white'; // Helmet
         this.ctx.beginPath();
         this.ctx.arc(x, y - h*0.8, w*0.2, 0, Math.PI * 2);
         this.ctx.fill();

         // State Visuals
         if (rider.state === OpponentState.Punching) {
             this.ctx.fillStyle = 'orange';
             this.ctx.fillRect(x - w*0.6, y - h*0.7, w*0.4, h*0.1); // Punch left
         } else if (rider.state === OpponentState.Kicking) {
             this.ctx.fillStyle = 'yellow';
             this.ctx.fillRect(x - w*0.6, y - h*0.3, w*0.4, h*0.1); // Kick left
         } else if (rider.state === OpponentState.WipeOut) {
             this.ctx.fillStyle = 'grey';
             this.ctx.beginPath();
             this.ctx.arc(x, y - h/2, w/2, 0, Math.PI * 2);
             this.ctx.fill();
         }
    }

    private renderSpriteIcon(sprite: Sprite, x: number, y: number, w: number, h: number) {
         if (sprite.type === SpriteType.TREE) {
             this.ctx.fillStyle = COLORS.TREE;
             this.ctx.fillRect(x - w/2, y - h, w, h);

             this.ctx.fillStyle = '#654321';
             this.ctx.fillRect(x - w/8, y - h/2, w/4, h/2);
             this.ctx.fillStyle = '#005108';
             this.ctx.beginPath();
             this.ctx.moveTo(x, y - h);
             this.ctx.lineTo(x - w/2, y - h/2);
             this.ctx.lineTo(x + w/2, y - h/2);
             this.ctx.fill();
         } else if (sprite.type === SpriteType.SIGN) {
             this.ctx.fillStyle = 'grey';
             this.ctx.fillRect(x - w/10, y - h, w/5, h);
             this.ctx.fillStyle = 'yellow';
             this.ctx.fillRect(x - w/2, y - h, w, h/3);
             this.ctx.fillStyle = 'black';
             this.ctx.font = `${Math.max(10, h/4)}px Arial`;
             this.ctx.textAlign = 'center';
             this.ctx.fillText("!", x, y - h*0.75);
         }
    }

    private renderPlayer(width: number, height: number, destX: number, destY: number, steer: number, player: Player) {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(destX - 5, destY - 10, 10, 10); // Wheel

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(destX - 10, destY - 30, 20, 20); // Body

        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(destX, destY - 40, 8, 0, Math.PI * 2); // Head
        this.ctx.fill();

        if (player.state === 'Punching') {
            this.ctx.fillStyle = 'orange';
            this.ctx.fillRect(destX + 10, destY - 35, 15, 5);
        } else if (player.state === 'Kicking') {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(destX + 10, destY - 15, 15, 5);
        } else if (player.state === 'WipeOut') {
             this.ctx.fillStyle = 'grey';
             this.ctx.beginPath();
             this.ctx.arc(destX, destY - 20, 25, 0, Math.PI * 2);
             this.ctx.fill();
        }
    }

    private drawSegment(ctx: CanvasRenderingContext2D, width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, color: any) {
        const r1 = w1 / 3;
        const r2 = w2 / 3;
        const l1 = w1 / 32;
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
