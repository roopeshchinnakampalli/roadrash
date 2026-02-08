import { Player, PlayerState } from './Player';
import { SEGMENT_LENGTH, STEP } from './Constants';

export enum OpponentState {
    Cruising = 'Cruising',
    Punching = 'Punching',
    Kicking = 'Kicking',
    WipeOut = 'WipeOut'
}

export class Opponent {
    public x: number = 0; // Normalized -1 to 1 (0 is center)
    public z: number = 0; // Absolute track Z position
    public speed: number = 0;
    public maxSpeed: number = 0;
    public state: OpponentState = OpponentState.Cruising;
    public lean: number = 0; // -1 to 1
    public width: number = 0.5; // Visual width
    public normalizedWidth: number = 0.05;

    public segmentIndex: number = 0;

    private stateTimer: number = 0;
    private attackCooldown: number = 0;
    private wipeOutDuration: number = 2000; // ms

    constructor(x: number, z: number, maxSpeed: number) {
        this.x = x;
        this.z = z;
        this.maxSpeed = maxSpeed;
        this.speed = maxSpeed * 0.9;
    }

    public update(dt: number, playerZ: number, playerX: number, playerSpeed: number, trackLength: number) {
        if (this.state === OpponentState.WipeOut) {
            this.handleWipeOut(dt);
        } else {
            this.aiLogic(dt, playerZ, playerX, playerSpeed, trackLength);

            // Move Z
            this.z += this.speed * dt;
            if (this.z >= trackLength) this.z -= trackLength;
            if (this.z < 0) this.z += trackLength;

            // Update timers
            if (this.stateTimer > 0) {
                this.stateTimer -= dt * 1000;
                if (this.stateTimer <= 0) {
                    this.state = OpponentState.Cruising;
                    this.lean = 0;
                    this.attackCooldown = 2000; // 2s cooldown
                }
            }
            if (this.attackCooldown > 0) {
                this.attackCooldown -= dt * 1000;
            }
        }
    }

    private aiLogic(dt: number, playerZ: number, playerX: number, playerSpeed: number, trackLength: number) {
        // Distance relative to player
        let dist = this.z - playerZ;
        while (dist >= trackLength/2) dist -= trackLength;
        while (dist < -trackLength/2) dist += trackLength;

        // Rubber-banding
        let targetSpeed = playerSpeed * (0.95 + Math.random() * 0.1); // Match player speed roughly

        // Catch up or slow down drastically if too far
        if (dist < -1000) { // Far behind
            targetSpeed = playerSpeed + 2000;
        } else if (dist > 1000) { // Far ahead
            targetSpeed = playerSpeed * 0.6;
        }

        // Clamp target speed
        targetSpeed = Math.min(targetSpeed, this.maxSpeed);
        targetSpeed = Math.max(targetSpeed, 0);

        // Accelerate towards target
        const accel = dt * 1000;
        if (this.speed < targetSpeed) this.speed += accel;
        else if (this.speed > targetSpeed) this.speed -= accel;

        // Steering logic
        const steerSpeed = dt * 0.8;

        // Attack behavior
        if (Math.abs(dist) < 500) {
             const steerDir = (playerX - this.x);

             // If player is close, move towards them to block/attack
             if (Math.abs(steerDir) > 0.1) {
                 const dir = steerDir > 0 ? 1 : -1;
                 this.x += dir * steerSpeed;
                 this.lean = dir; // Lean into turn
             } else {
                 this.lean = 0;
             }

             // Attack Logic
             if (Math.abs(dist) < 200 && Math.abs(steerDir) < 0.3 && this.state === OpponentState.Cruising && this.attackCooldown <= 0) {
                 if (Math.random() < 0.05) { // Chance per frame
                     this.state = Math.random() > 0.5 ? OpponentState.Punching : OpponentState.Kicking;
                     this.stateTimer = 500;
                     this.lean = 0; // Straighten up to attack?
                 }
             }
        } else {
             // Center lane drift when alone
             if (Math.abs(this.x) > 0.1) {
                 this.x += (this.x > 0 ? -1 : 1) * steerSpeed * 0.5;
                 this.lean = (this.x > 0 ? -1 : 1) * 0.5;
             } else {
                 this.lean = 0;
             }
        }

        // Clamp X
        this.x = Math.max(-1, Math.min(1, this.x));
    }

    private handleWipeOut(dt: number) {
        this.speed -= (dt * 2000);
        if (this.speed < 0) this.speed = 0;

        this.stateTimer -= dt * 1000;
        if (this.stateTimer <= 0 && this.speed === 0) {
            this.state = OpponentState.Cruising;
            this.speed = this.maxSpeed * 0.5;
            this.lean = 0;
        }
    }

    public triggerWipeOut() {
        if (this.state !== OpponentState.WipeOut) {
            this.state = OpponentState.WipeOut;
            this.stateTimer = this.wipeOutDuration;
        }
    }
}
