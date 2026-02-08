import { SEGMENT_LENGTH, COLORS, ROAD_WIDTH } from './Constants';
import { Sprite, SpriteType } from './Sprite';
import { Opponent } from './Opponent';

export interface Point {
    world: { x: number; y: number; z: number };
    screen: { x: number; y: number; w: number; scale: number };
    camera: { x: number; y: number; z: number };
}

export interface Segment {
    index: number;
    p1: Point;
    p2: Point;
    color: { road: string, grass: string, rumble: string, lane?: string };
    curve: number;
    clip: number;
    sprites: Sprite[];
    riders: Opponent[];
}

export class Road {
    public segments: Segment[] = [];
    public segmentLength: number = SEGMENT_LENGTH;
    public rumbleLength: number = 3;
    public roadWidth: number = ROAD_WIDTH;
    public lanes: number = 3;

    constructor() {
        this.reset();
    }

    public reset() {
        this.segments = [];

        this.addStraight(25);
        this.addCurve(200, 2);
        this.addHill(200, 200);
        this.addCurve(200, -2);
        this.addHill(200, -200);
        this.addStraight(50);
        this.addSCurves();
        this.addBumps();
        this.addLowRollingHills();
        this.addDownhillToEnd();

        this.addSprites();
    }

    public clearRiders() {
        for (const segment of this.segments) {
            segment.riders = [];
        }
    }

    private addSegment(curve: number, y: number) {
        const n = this.segments.length;
        this.segments.push({
            index: n,
            p1: { world: { x: 0, y: this.getLastY(), z: n * this.segmentLength }, camera: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0, w: 0, scale: 0 } },
            p2: { world: { x: 0, y: y, z: (n + 1) * this.segmentLength }, camera: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0, w: 0, scale: 0 } },
            color: Math.floor(n / this.rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT,
            curve: curve,
            clip: 0,
            sprites: [],
            riders: []
        });
    }

    private getLastY() {
        return (this.segments.length == 0) ? 0 : this.segments[this.segments.length - 1].p2.world.y;
    }

    public addRoad(enter: number, hold: number, leave: number, curve: number, y: number) {
        const startY = this.getLastY();
        const endY = startY + (y * this.segmentLength);
        const total = enter + hold + leave;

        for (let n = 0; n < enter; n++)
            this.addSegment(this.easeIn(0, curve, n / enter), this.easeInOut(startY, endY, n / total));
        for (let n = 0; n < hold; n++)
            this.addSegment(curve, this.easeInOut(startY, endY, (enter + n) / total));
        for (let n = 0; n < leave; n++)
            this.addSegment(this.easeInOut(curve, 0, n / leave), this.easeInOut(startY, endY, (enter + hold + n) / total));
    }

    public addStraight(num: number = 25) {
        this.addRoad(num, num, num, 0, 0);
    }

    public addCurve(num: number = 200, curve: number = 0) {
        this.addRoad(num, num, num, curve, 0);
    }

    public addHill(num: number = 200, height: number = 0) {
        this.addRoad(num, num, num, 0, height);
    }

    public addLowRollingHills(num: number = 10, height: number = 40) {
        this.addRoad(num, num, num, 0, height/2);
        this.addRoad(num, num, num, 0, -height);
        this.addRoad(num, num, num, 0, height);
        this.addRoad(num, num, num, 0, 0);
        this.addRoad(num, num, num, 0, height/2);
        this.addRoad(num, num, num, 0, 0);
    }

    public addSCurves() {
        this.addRoad(50, 50, 50, -2, 0);
        this.addRoad(50, 50, 50, 2, 0);
        this.addRoad(50, 50, 50, 3, 40);
        this.addRoad(50, 50, 50, -3, -40);
        this.addRoad(50, 50, 50, -3, 40);
        this.addRoad(50, 50, 50, 2, -40);
    }

    public addBumps() {
        this.addRoad(10, 10, 10, 0, 5);
        this.addRoad(10, 10, 10, 0, -2);
        this.addRoad(10, 10, 10, 0, -5);
        this.addRoad(10, 10, 10, 0, 8);
        this.addRoad(10, 10, 10, 0, 5);
        this.addRoad(10, 10, 10, 0, -7);
        this.addRoad(10, 10, 10, 0, 5);
        this.addRoad(10, 10, 10, 0, -2);
    }

    public addDownhillToEnd(num: number = 200) {
         this.addRoad(num, num, num, -2, -this.getLastY()/this.segmentLength);
    }

    public getSegment(z: number): Segment {
        return this.segments[Math.floor(z / this.segmentLength) % this.segments.length];
    }

    private addSprites() {
        for (let n = 10; n < this.segments.length - 50; n += 1) { // Very dense to create speed sense
            const curve = this.segments[n].curve;

            // Trees - Dense, lining the road
            if (n % 2 === 0) { // Every other segment
                const side = n % 4 === 0 ? 1 : -1; // Alternate sides
                const offset = side * (1.5 + Math.random() * 3.0);
                this.segments[n].sprites.push({ type: SpriteType.TREE, offset: offset });
            }

            // Signs - On curves or hills
            if (Math.abs(curve) > 1 && n % 5 === 0) {
                 const side = curve > 0 ? -1 : 1; // Arrows pointing turn direction usually on outside? Or inside? Let's just put on side.
                 const offset = side * 1.3;
                 this.segments[n].sprites.push({ type: SpriteType.SIGN, offset: offset });
            }

            // Random clutter
            if (Math.random() > 0.9) {
                 const side = Math.random() > 0.5 ? 1 : -1;
                 const offset = side * (2.0 + Math.random() * 5.0);
                 this.segments[n].sprites.push({ type: SpriteType.TREE, offset: offset });
            }
        }
    }

    private easeIn(a: number, b: number, percent: number) { return a + (b - a) * Math.pow(percent, 2); }
    private easeOut(a: number, b: number, percent: number) { return a + (b - a) * (1 - Math.pow(1 - percent, 2)); }
    private easeInOut(a: number, b: number, percent: number) { return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5); }
}
