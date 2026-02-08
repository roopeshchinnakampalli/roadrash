import { Input } from './Input';
import { SEGMENT_LENGTH, STEP } from './Constants';

export enum PlayerState {
    Cruising = 'Cruising',
    Punching = 'Punching',
    Kicking = 'Kicking',
    WipeOut = 'WipeOut'
}

export class Player {
    public x: number = 0; // Normalized -1 to 1 (0 is center)
    public z: number = 0; // Camera Z
    public speed: number = 0;
    public maxSpeed: number = 0;
    public state: PlayerState = PlayerState.Cruising;
    public lean: number = 0; // -1 (Left) to 1 (Right)
    public health: number = 100;
    public maxHealth: number = 100;
    public normalizedWidth: number = 0.05;

    private stateTimer: number = 0;
    private wipeOutDuration: number = 2000; // ms

    constructor(maxSpeed: number) {
        this.maxSpeed = maxSpeed;
    }

    public update(dt: number, input: Input, currentCurve: number) {
        if (this.state === PlayerState.WipeOut) {
            this.handleWipeOut(dt);
            return;
        }

        this.handleInput(dt, input);
        this.applyPhysics(dt, currentCurve);

        // Timer for actions
        if (this.stateTimer > 0) {
            this.stateTimer -= dt * 1000;
            if (this.stateTimer <= 0) {
                 this.state = PlayerState.Cruising;
            }
        }
    }

    private handleInput(dt: number, input: Input) {
        // Lateral movement and leaning
        const speedPercent = this.speed / this.maxSpeed;
        const dx = dt * 2 * speedPercent;

        if (input.isKeyDown('ArrowLeft')) {
            this.x -= dx;
            this.lean = Math.max(-1, this.lean - dt * 5);
        } else if (input.isKeyDown('ArrowRight')) {
            this.x += dx;
            this.lean = Math.min(1, this.lean + dt * 5);
        } else {
             // Return to 0
             if (this.lean > 0.05) this.lean -= dt * 5;
             else if (this.lean < -0.05) this.lean += dt * 5;
             else this.lean = 0;
        }

        // Action states
        if (this.state === PlayerState.Cruising) {
            if (input.isKeyDown('a') || input.isKeyDown('A')) {
                this.state = PlayerState.Punching;
                this.stateTimer = 300; // 300ms punch
                this.lean = 0; // Reset lean for action? Or keep it? Let's keep it simple.
            } else if (input.isKeyDown('s') || input.isKeyDown('S')) {
                this.state = PlayerState.Kicking;
                this.stateTimer = 300; // 300ms kick
                this.lean = 0;
            }
        }

        // Acceleration / Braking
        if (input.isKeyDown('ArrowUp'))
            this.speed += (dt * 1000); // 0 to max in roughly... depends on maxSpeed
        else if (input.isKeyDown('ArrowDown'))
            this.speed -= (dt * 2000);
        else
            this.speed -= (dt * 500); // Coasting friction

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
    }

    private applyPhysics(dt: number, currentCurve: number) {
        // Centrifugal force
        const speedPercent = this.speed / this.maxSpeed;
        const dx = dt * 2 * speedPercent;

        // If speed is high, curve pulls player
        if (speedPercent > 0.2) {
             this.x -= (dx * speedPercent * currentCurve * 2); // Increased centrifugal force
        }

        // Clamp position to road bounds (or let them go off-road?)
        // If they go off-road, slow down?
        if ((this.x < -1 || this.x > 1)) {
            if (this.speed > this.maxSpeed / 4) {
                 this.speed -= (dt * 2000); // Slow down significantly off-road
            }
            // Shake camera? (Handled in Game.ts or Renderer)
        }

        // Limit x slightly to prevent infinite scrolling off map
        this.x = Math.max(-2, Math.min(2, this.x));
    }

    private handleWipeOut(dt: number) {
        this.speed -= (dt * 1500); // Rapid deceleration
        this.speed = Math.max(0, this.speed);

        this.stateTimer -= dt * 1000;
        if (this.stateTimer <= 0 && this.speed === 0) {
            // Recover
            this.state = PlayerState.Cruising;
            this.health = Math.min(this.health + 20, this.maxHealth); // Recover some health
            this.lean = 0;
        }
    }

    public triggerWipeOut() {
        if (this.state !== PlayerState.WipeOut) {
            this.state = PlayerState.WipeOut;
            this.stateTimer = this.wipeOutDuration;
            this.health -= 20; // Damage on wipe out
            if (this.health < 0) this.health = 0;
        }
    }

    public takeDamage(amount: number) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.triggerWipeOut();
        }
    }
}
