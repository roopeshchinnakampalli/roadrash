import { Road } from './Road';
import { Input } from './Input';
import { Renderer } from './Renderer';
import { Player, PlayerState } from './Player';
import { SCREEN_WIDTH, SCREEN_HEIGHT, FPS, STEP, CAMERA_HEIGHT, CAMERA_DEPTH, PLAYER_Z, SEGMENT_LENGTH, DRAW_DISTANCE } from './Constants';

export class Game {
    private canvas: HTMLCanvasElement;
    private road: Road;
    private input: Input;
    private renderer: Renderer;
    private player: Player;

    private lastTime: number = 0;
    private dt: number = 0;
    private gdt: number = 0;

    private position: number = 0;
    private maxSpeed: number = SEGMENT_LENGTH / STEP; // Max speed relative to segment length

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;

        this.road = new Road();
        this.input = new Input();
        this.renderer = new Renderer(this.canvas);
        this.player = new Player(this.maxSpeed);

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    private update(dt: number) {
        // Player update logic now handled by Player class
        const playerSegment = this.road.getSegment(this.position + PLAYER_Z);

        // Pass curve from current segment
        this.player.update(dt, this.input, playerSegment.curve);

        // Check for collision
        this.checkCollision(playerSegment);

        // Update global position based on player speed
        this.position = (this.position + this.player.speed * dt) % (this.road.segments.length * SEGMENT_LENGTH);
    }

    private checkCollision(segment: any) {
        if (this.player.state === PlayerState.WipeOut) return;

        // Loop through sprites on the current segment
        for (const sprite of segment.sprites) {
            // Only collide if player is also near the road edge for trees/signs?
            // Actually, sprites have an offset.

            const spriteW = 0.05;
            const playerW = this.player.normalizedWidth;

            // Check overlap
            if (this.overlap(this.player.x, playerW, sprite.offset, spriteW)) {
                // Ensure we only wipe out if moving fast enough? Or just always.
                if (this.player.speed > 500) {
                     this.player.triggerWipeOut();
                } else {
                     // Just stop?
                     this.player.speed = 0;
                }
            }
        }
    }

    private overlap(x1: number, w1: number, x2: number, w2: number) {
        const half1 = w1 / 2;
        const half2 = w2 / 2;
        const min1 = x1 - half1;
        const max1 = x1 + half1;
        const min2 = x2 - half2;
        const max2 = x2 + half2;
        return max1 >= min2 && min1 <= max2;
    }

    private loop(time: number) {
        if (!this.lastTime) this.lastTime = time;
        this.dt = Math.min(1, (time - this.lastTime) / 1000);
        this.lastTime = time;
        this.gdt = this.gdt + this.dt;

        while (this.gdt > STEP) {
            this.gdt = this.gdt - STEP;
            this.update(STEP);
        }

        this.renderer.render(this.road, this.player, CAMERA_HEIGHT + this.road.getSegment(this.position).p1.world.y, this.position, DRAW_DISTANCE);

        requestAnimationFrame(this.loop);
    }
}
