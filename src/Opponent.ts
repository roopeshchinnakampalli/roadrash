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

            // Move
            this.z += this.speed * dt;
            if (this.z >= trackLength) this.z -= trackLength;
            if (this.z < 0) this.z += trackLength;

            // Timers
            if (this.stateTimer > 0) {
                this.stateTimer -= dt * 1000;
                if (this.stateTimer <= 0) {
                    this.state = OpponentState.Cruising;
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

        // Catch up or slow down
        if (dist < -500) { // Behind
            targetSpeed = playerSpeed + 1500;
        } else if (dist > 500) { // Ahead
            targetSpeed = playerSpeed * 0.8;
        }

        // Clamp target speed
        targetSpeed = Math.min(targetSpeed, this.maxSpeed);
        targetSpeed = Math.max(targetSpeed, 0);

        // Accelerate towards target
        const accel = dt * 1000;
        if (this.speed < targetSpeed) this.speed += accel;
        else if (this.speed > targetSpeed) this.speed -= accel;

        // Steering
        // Try to attack if close
        if (Math.abs(dist) < 500) {
             const steerDir = (playerX - this.x);
             if (Math.abs(steerDir) > 0.05) {
                 this.x += (steerDir > 0 ? 1 : -1) * dt * 0.5;
             }

             // Attack Logic
             if (Math.abs(dist) < 100 && Math.abs(steerDir) < 0.2 && this.state === OpponentState.Cruising && this.attackCooldown <= 0) {
                 if (Math.random() < 0.02) { // Low chance per frame
                     this.state = Math.random() > 0.5 ? OpponentState.Punching : OpponentState.Kicking;
                     this.stateTimer = 500;
                 }
             }
        } else {
             // Center lane drift
             if (Math.abs(this.x) > 0.1) {
                 this.x += (this.x > 0 ? -1 : 1) * dt * 0.2;
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
        }
    }

    public triggerWipeOut() {
        if (this.state !== OpponentState.WipeOut) {
            this.state = OpponentState.WipeOut;
            this.stateTimer = this.wipeOutDuration;
        }
    }
}
