import { Road, Segment, Point } from './Road';
import { Player, PlayerState } from './Player';
import { Opponent, OpponentState } from './Opponent';
import { CAMERA_DEPTH, SCREEN_WIDTH, SCREEN_HEIGHT, ROAD_WIDTH, COLORS, SEGMENT_LENGTH } from './Constants';
import { Sprite, SpriteType } from './Sprite';
import { Assets } from './Assets';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private roadPatternLight: CanvasPattern | null = null;
    private roadPatternDark: CanvasPattern | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    public clear(player: Player, road: Road, cameraZ: number) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground(player, road, cameraZ);
    }

    private drawBackground(player: Player, road: Road, cameraZ: number) {
        const width = this.width;
        const height = this.height;

        const playerOffset = player.x * width * 0.5;
        const curveOffset = road.getSegment(cameraZ).curve * 2000;

        const drawLayer = (layer: HTMLCanvasElement, scrollSpeed: number) => {
             const scrollX = (curveOffset + playerOffset) * scrollSpeed;
             const bgWidth = layer.width;

             let offsetX = scrollX % bgWidth;
             if (offsetX < 0) offsetX += bgWidth;

             this.ctx.drawImage(layer, -offsetX, 0, bgWidth, height);
             this.ctx.drawImage(layer, bgWidth - offsetX, 0, bgWidth, height);
             if (bgWidth - offsetX < width) {
                  this.ctx.drawImage(layer, bgWidth * 2 - offsetX, 0, bgWidth, height);
             }
        };

        // Draw layers back to front
        drawLayer(Assets.backgroundSky, 0.001); // Sky moves very slowly
        drawLayer(Assets.backgroundHills, 0.02); // Distant hills move slower
        drawLayer(Assets.backgroundTrees, 0.06); // Closer trees move faster
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

    public render(road: Road, player: Player, cameraY: number, cameraXOffset: number, cameraZ: number, drawDistance: number, finished: boolean) {
        // Initialize patterns once if needed
        if (!this.roadPatternLight && Assets.roadPatternLight) {
            this.roadPatternLight = this.ctx.createPattern(Assets.roadPatternLight, 'repeat');
        }
        if (!this.roadPatternDark && Assets.roadPatternDark) {
            this.roadPatternDark = this.ctx.createPattern(Assets.roadPatternDark, 'repeat');
        }

        this.clear(player, road, cameraZ);

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

        // Draw Player (with slight bob/vibration)
        const bounce = (Math.sin(Date.now() / 50) * 2) * (player.speed / player.maxSpeed);
        this.renderPlayer(this.width, this.height, this.width / 2 + cameraXOffset, this.height - 20 + bounce, 0.5, player);

        // Draw HUD
        this.renderHUD(player, finished);
    }

    private renderHUD(player: Player, finished: boolean) {
        // Retro HUD - Minimalist
        this.ctx.save();

        // Jitter speed text slightly at high speed
        let jitterX = 0;
        let jitterY = 0;
        if (player.speed > player.maxSpeed * 0.8) {
             jitterX = (Math.random() - 0.5) * 2;
             jitterY = (Math.random() - 0.5) * 2;
        }

        // Speed
        this.ctx.fillStyle = '#FFD700'; // Gold/Yellow
        this.ctx.font = 'bold italic 40px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        const speedKmh = Math.floor(player.speed / 100);
        this.ctx.shadowColor = 'black';
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fillText(`${speedKmh}`, this.width - 20 + jitterX, this.height - 20 + jitterY);

        this.ctx.font = '20px monospace';
        this.ctx.fillText(`KM/H`, this.width - 20, this.height - 60);

        // Health Bar (Simple bar at bottom left)
        const healthPct = Math.max(0, player.health / player.maxHealth);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(20, this.height - 30, 150, 10); // BG

        this.ctx.fillStyle = healthPct > 0.5 ? '#00FF00' : (healthPct > 0.2 ? '#FFFF00' : '#FF0000');
        this.ctx.fillRect(20, this.height - 30, 150 * healthPct, 10); // FG

        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(20, this.height - 30, 150, 10);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText("CONDITION", 20, this.height - 35);

        // Finish overlay
        if (finished) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, this.height/2 - 50, this.width, 100);
            this.ctx.fillStyle = '#ffd700'; // Gold
            this.ctx.font = 'bold 60px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText("FINISH!", this.width/2, this.height/2);
            this.ctx.shadowBlur = 0;
            this.ctx.textAlign = 'left';
        }

        this.ctx.restore();
    }

    private drawSprite(sprite: Sprite, scale: number, destX: number, destY: number, clipY: number) {
        // Scale adjustment for 128x128 source assets mostly, but let's check sprite type
        let asset: HTMLCanvasElement;
        if (sprite.type === SpriteType.TREE) {
            asset = Assets.tree;
        } else if (sprite.type === SpriteType.SIGN) {
            asset = Assets.sign;
        } else {
            return;
        }

        const spriteScale = scale * 1000 * (1/80); // Adjust this factor to look right
        const w = asset.width * spriteScale;
        const h = asset.height * spriteScale;

        const destX_ = destX;
        const destY_ = destY;
        const top = destY_ - h;

        if (destY_ < 0 || top > this.height) return;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.width, clipY);
        this.ctx.clip();

        this.ctx.drawImage(asset, destX_ - w/2, destY_ - h, w, h);

        this.ctx.restore();
    }

    private drawRider(rider: Opponent, scale: number, destX: number, destY: number, clipY: number) {
        let asset = Assets.opponentIdle;
        if (rider.state === OpponentState.Punching) asset = Assets.opponentPunch;
        else if (rider.state === OpponentState.Kicking) asset = Assets.opponentKick;
        else if (rider.state === OpponentState.WipeOut) asset = Assets.opponentWipeout;
        else {
            if (rider.lean < -0.1) asset = Assets.opponentLeft;
            else if (rider.lean > 0.1) asset = Assets.opponentRight;
        }

        const spriteScale = scale * 1000 * (1/80);
        const w = asset.width * spriteScale;
        const h = asset.height * spriteScale;

        const top = destY - h;

        if (destY < 0 || top > this.height) return;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.width, clipY);
        this.ctx.clip();

        this.ctx.drawImage(asset, destX - w/2, destY - h, w, h);

        this.ctx.restore();
    }

    private renderPlayer(width: number, height: number, destX: number, destY: number, steer: number, player: Player) {
        // Select sprite based on state and input
        let asset = Assets.playerIdle;

        if (player.state === PlayerState.WipeOut) {
            asset = Assets.playerWipeout;
        } else if (player.state === PlayerState.Punching) {
            asset = Assets.playerPunch;
        } else if (player.state === PlayerState.Kicking) {
            asset = Assets.playerKick;
        } else {
             if (player.lean < -0.1) asset = Assets.playerLeft;
             else if (player.lean > 0.1) asset = Assets.playerRight;
        }

        const scale = 3; // HUD scale
        const w = asset.width * scale;
        const h = asset.height * scale;

        // Draw Player at bottom center
        // destY is height - 20
        this.ctx.drawImage(asset, destX - w/2, destY - h + 20, w, h);
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

        // Textured Road
        if (this.roadPatternLight && color.road === COLORS.LIGHT.road) {
            ctx.fillStyle = this.roadPatternLight;
        } else if (this.roadPatternDark && color.road === COLORS.DARK.road) {
            ctx.fillStyle = this.roadPatternDark;
        } else {
            ctx.fillStyle = color.road;
        }

        ctx.beginPath();
        ctx.moveTo(x1 - w1, y1);
        ctx.lineTo(x1 + w1, y1);
        ctx.lineTo(x2 + w2, y2);
        ctx.lineTo(x2 - w2, y2);
        ctx.closePath();
        ctx.fill();

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
