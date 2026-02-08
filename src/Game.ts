import { Road } from './Road';
import { Input } from './Input';
import { Renderer } from './Renderer';
import { Player, PlayerState } from './Player';
import { Opponent, OpponentState } from './Opponent';
import { SCREEN_WIDTH, SCREEN_HEIGHT, FPS, STEP, CAMERA_HEIGHT, CAMERA_DEPTH, PLAYER_Z, SEGMENT_LENGTH, DRAW_DISTANCE } from './Constants';

export class Game {
    private canvas: HTMLCanvasElement;
    private road: Road;
    private input: Input;
    private renderer: Renderer;
    private player: Player;
    private opponents: Opponent[] = [];

    private lastTime: number = 0;
    private dt: number = 0;
    private gdt: number = 0;

    private position: number = 0;
    private maxSpeed: number = SEGMENT_LENGTH / STEP;
    private trackLength: number = 0;
    private finished: boolean = false;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;

        this.road = new Road();
        this.trackLength = this.road.segments.length * SEGMENT_LENGTH;
        this.input = new Input();
        this.renderer = new Renderer(this.canvas);
        this.player = new Player(this.maxSpeed);

        this.initOpponents();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    private initOpponents() {
        for (let i = 0; i < 5; i++) {
             const z = (i + 1) * 2000;
             const x = (Math.random() * 1.5) - 0.75;
             this.opponents.push(new Opponent(x, z, this.maxSpeed));
        }
    }

    private update(dt: number) {
        if (this.finished) return;

        // Player Update
        const playerZ = this.position + PLAYER_Z;
        const playerSegment = this.road.getSegment(this.position + PLAYER_Z); // Use position for segment index for camera, but player physics uses playerZ?

        this.player.update(dt, this.input, playerSegment.curve);
        this.position = (this.position + this.player.speed * dt);

        if (this.position >= this.trackLength) {
            this.finished = true;
            this.position -= this.trackLength;
        }
        while (this.position >= this.trackLength) this.position -= this.trackLength;
        while (this.position < 0) this.position += this.trackLength;

        // Reset riders in segments
        this.road.clearRiders();

        // Opponent Updates
        for (const opponent of this.opponents) {
            opponent.update(dt, this.position + PLAYER_Z, this.player.x, this.player.speed, this.trackLength);

            // Assign to segment
            let opponentZ = opponent.z;
            while (opponentZ >= this.trackLength) opponentZ -= this.trackLength;
            while (opponentZ < 0) opponentZ += this.trackLength;

            const segmentIndex = Math.floor(opponentZ / SEGMENT_LENGTH);
            const segment = this.road.segments[segmentIndex % this.road.segments.length];
            segment.riders.push(opponent);

            // Check Collision
            let dist = opponentZ - (this.position + PLAYER_Z);
            if (dist > this.trackLength/2) dist -= this.trackLength;
            if (dist < -this.trackLength/2) dist += this.trackLength;

            if (Math.abs(dist) < 200) {
                 const opponentW = opponent.normalizedWidth;
                 const playerW = this.player.normalizedWidth;

                 if (this.overlap(this.player.x, playerW, opponent.x, opponentW)) {
                      if (opponent.state === OpponentState.Punching || opponent.state === OpponentState.Kicking) {
                          this.player.takeDamage(10);
                          const dir = (this.player.x - opponent.x) > 0 ? 1 : -1;
                          this.player.x += dir * 0.1;
                      } else if (this.player.state === PlayerState.Punching || this.player.state === PlayerState.Kicking) {
                          opponent.triggerWipeOut();
                      } else {
                          const dir = (this.player.x - opponent.x) > 0 ? 1 : -1;
                          const push = dt * 1.0;
                          this.player.x += dir * push;
                          opponent.x -= dir * push;
                          this.player.speed *= 0.99;
                          opponent.speed *= 0.99;
                      }
                 }
            }
        }

        this.checkCollision(playerSegment);
    }

    private checkCollision(segment: any) {
        if (this.player.state === PlayerState.WipeOut) return;

        for (const sprite of segment.sprites) {
            const spriteW = 0.05;
            const playerW = this.player.normalizedWidth;

            if (this.overlap(this.player.x, playerW, sprite.offset, spriteW)) {
                if (this.player.speed > 500) {
                     this.player.triggerWipeOut();
                } else {
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

        this.renderer.render(this.road, this.player, CAMERA_HEIGHT + this.road.getSegment(this.position).p1.world.y, this.position, DRAW_DISTANCE, this.finished);

        requestAnimationFrame(this.loop);
    }
}
