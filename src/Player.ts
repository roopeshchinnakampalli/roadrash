import { Input } from './Input';
import { SEGMENT_LENGTH, STEP } from './Constants';

export enum PlayerState {
    Cruising = 'Cruising',
    Leaning = 'Leaning',
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
    public health: number = 100;
    public maxHealth: number = 100;
    public width: number = 0.5; // Normalized width relative to road? No, relative to segment width?
                               // Actually, let's keep it simple. Road width is 2000. Player is maybe 80?
                               // 80 / 2000 = 0.04 normalized width.
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
    }

    private handleInput(dt: number, input: Input) {
        // Lateral movement and leaning
        const speedPercent = this.speed / this.maxSpeed;
        const dx = dt * 2 * speedPercent;

        if (input.isKeyDown('ArrowLeft')) {
            this.x -= dx;
            this.state = PlayerState.Leaning;
        } else if (input.isKeyDown('ArrowRight')) {
            this.x += dx;
            this.state = PlayerState.Leaning;
        } else {
            this.state = PlayerState.Cruising;
        }

        // Action states
        // Use a simple timer or check if key is just pressed for punch/kick?
        // Since Input only has isKeyDown, we need to handle "just pressed" logic or cooldowns if we want strict animation.
        // For now, let's just set the state if key is held, but reset quickly.
        // Better: use a cooldown.

        if (this.stateTimer > 0) {
            this.stateTimer -= dt * 1000;
            if (this.stateTimer <= 0) {
                 this.state = PlayerState.Cruising; // Return to cruising after action
            }
        } else {
            if (input.isKeyDown('a') || input.isKeyDown('A')) {
                this.state = PlayerState.Punching;
                this.stateTimer = 300; // 300ms punch
            } else if (input.isKeyDown('s') || input.isKeyDown('S')) {
                this.state = PlayerState.Kicking;
                this.stateTimer = 300; // 300ms kick
            }
        }

        // Acceleration / Braking
        if (input.isKeyDown('ArrowUp'))
            this.speed += (dt * 1000);
        else if (input.isKeyDown('ArrowDown'))
            this.speed -= (dt * 2000);
        else
            this.speed -= (dt * 500);

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
    }

    private applyPhysics(dt: number, currentCurve: number) {
        // Centrifugal force
        const speedPercent = this.speed / this.maxSpeed;
        const dx = dt * 2 * speedPercent;
        this.x -= (dx * speedPercent * currentCurve);

        // Clamp position to road bounds (or let them go off-road?)
        // If they go off-road, slow down?
        if ((this.x < -1 || this.x > 1) && (this.speed > this.maxSpeed / 4)) {
            this.speed -= (dt * 2000); // Slow down significantly off-road
        }
    }

    private handleWipeOut(dt: number) {
        this.speed -= (dt * 3000); // Rapid deceleration
        this.speed = Math.max(0, this.speed);

        this.stateTimer -= dt * 1000;
        if (this.stateTimer <= 0 && this.speed === 0) {
            // Recover
            this.state = PlayerState.Cruising;
            this.health = Math.min(this.health + 20, this.maxHealth); // Recover some health?
            // Reset position to center? Or leave where wiped out? Leave is better.
             this.x = 0; // Reset to center to avoid getting stuck in a loop of off-road wipeouts immediately?
             // Or better, just make sure they are stopped.
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
