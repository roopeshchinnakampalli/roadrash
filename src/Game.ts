import { Road } from './Road';
import { Input } from './Input';
import { Renderer } from './Renderer';
import { SCREEN_WIDTH, SCREEN_HEIGHT, FPS, STEP, CAMERA_HEIGHT, CAMERA_DEPTH, PLAYER_Z, SEGMENT_LENGTH, DRAW_DISTANCE } from './Constants';

export class Game {
    private canvas: HTMLCanvasElement;
    private road: Road;
    private input: Input;
    private renderer: Renderer;

    private lastTime: number = 0;
    private dt: number = 0;
    private gdt: number = 0;

    private position: number = 0;
    private playerX: number = 0;
    private speed: number = 0;
    private maxSpeed: number = SEGMENT_LENGTH / STEP; // Max speed relative to segment length

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;

        this.road = new Road();
        this.input = new Input();
        this.renderer = new Renderer(this.canvas);

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    private update(dt: number) {
        this.position = (this.position + this.speed * dt) % (this.road.segments.length * SEGMENT_LENGTH);

        const playerSegment = this.road.getSegment(this.position + PLAYER_Z);
        const speedPercent = this.speed / this.maxSpeed;
        const dx = dt * 2 * speedPercent; // lateral speed

        if (this.input.isKeyDown('ArrowLeft'))
            this.playerX = this.playerX - dx;
        else if (this.input.isKeyDown('ArrowRight'))
            this.playerX = this.playerX + dx;

        this.playerX = this.playerX - (dx * speedPercent * playerSegment.curve * dt); // centrifugal force

        if (this.input.isKeyDown('ArrowUp'))
            this.speed = this.speed + (dt * 1000); // acceleration
        else if (this.input.isKeyDown('ArrowDown'))
            this.speed = this.speed - (dt * 2000); // braking
        else
            this.speed = this.speed - (dt * 500); // friction

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
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

        this.renderer.render(this.road, this.playerX * this.road.roadWidth, CAMERA_HEIGHT + this.road.getSegment(this.position).p1.world.y, this.position, this.playerX, DRAW_DISTANCE);

        requestAnimationFrame(this.loop);
    }
}
