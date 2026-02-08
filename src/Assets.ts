export class Assets {
    public static backgroundSky: HTMLCanvasElement;
    public static backgroundHills: HTMLCanvasElement;
    public static backgroundTrees: HTMLCanvasElement;
    public static tree: HTMLCanvasElement;
    public static sign: HTMLCanvasElement;
    public static playerIdle: HTMLCanvasElement;
    public static playerLeft: HTMLCanvasElement;
    public static playerRight: HTMLCanvasElement;
    public static playerPunch: HTMLCanvasElement;
    public static playerKick: HTMLCanvasElement;
    public static playerWipeout: HTMLCanvasElement;
    public static opponentIdle: HTMLCanvasElement;
    public static opponentLeft: HTMLCanvasElement;
    public static opponentRight: HTMLCanvasElement;
    public static opponentPunch: HTMLCanvasElement;
    public static opponentKick: HTMLCanvasElement;
    public static opponentWipeout: HTMLCanvasElement;

    public static init() {
        this.backgroundSky = this.generateSky();
        this.backgroundHills = this.generateHills();
        this.backgroundTrees = this.generateDistantTrees();
        this.tree = this.generateTree();
        this.sign = this.generateSign();

        // Player sprites (Red)
        this.playerIdle = this.generateRider('#ff0000', 0);
        this.playerLeft = this.generateRider('#ff0000', -1);
        this.playerRight = this.generateRider('#ff0000', 1);
        this.playerPunch = this.generateRiderAction('#ff0000', 'punch');
        this.playerKick = this.generateRiderAction('#ff0000', 'kick');
        this.playerWipeout = this.generateWipeout('#ff0000');

        // Opponent sprites (Blue - can be tinted later or just generate one color for now)
        this.opponentIdle = this.generateRider('#0000ff', 0);
        this.opponentLeft = this.generateRider('#0000ff', -1);
        this.opponentRight = this.generateRider('#0000ff', 1);
        this.opponentPunch = this.generateRiderAction('#0000ff', 'punch');
        this.opponentKick = this.generateRiderAction('#0000ff', 'kick');
        this.opponentWipeout = this.generateWipeout('#0000ff');
    }

    private static createContext(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        return { canvas, ctx };
    }

    private static generateSky(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(1024, 480);
        const width = canvas.width;
        const height = canvas.height;

        // Sky Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB'); // Sky Blue
        gradient.addColorStop(1, '#E0F7FA'); // Light Cyan
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        return canvas;
    }

    private static generateHills(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(1024, 480);
        const width = canvas.width;
        const height = canvas.height;

        // Distant Mountains
        ctx.fillStyle = '#5C6BC0'; // Indigo
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= width; i += 50) {
            ctx.lineTo(i, height - 150 - Math.random() * 100);
        }
        ctx.lineTo(width, height);
        ctx.fill();

        return canvas;
    }

    private static generateDistantTrees(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(1024, 480);
        const width = canvas.width;
        const height = canvas.height;

        // Closer Hills/Trees
        ctx.fillStyle = '#2E7D32'; // Green
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= width; i += 30) {
            ctx.lineTo(i, height - 50 - Math.random() * 50);
        }
        ctx.lineTo(width, height);
        ctx.fill();

        return canvas;
    }

    private static generateTree(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(128, 128);

        // Trunk
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(56, 80, 16, 48);

        // Leaves (Pine style)
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.moveTo(64, 10);
        ctx.lineTo(20, 90);
        ctx.lineTo(108, 90);
        ctx.fill();

        // Detail
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.moveTo(64, 10);
        ctx.lineTo(30, 80);
        ctx.lineTo(98, 80);
        ctx.fill();

        return canvas;
    }

    private static generateSign(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(64, 64);

        // Post
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(30, 32, 4, 32);

        // Sign Board
        ctx.fillStyle = '#fdd835';
        ctx.fillRect(16, 16, 32, 32);

        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, 32, 32);

        // Content
        ctx.fillStyle = '#000';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 32, 32);

        return canvas;
    }

    private static generateRider(color: string, lean: number): HTMLCanvasElement {
        // lean: -1 (left), 0 (straight), 1 (right)
        const { canvas, ctx } = this.createContext(128, 128);
        const cx = 64;
        const cy = 110;

        // Bike Wheels
        ctx.fillStyle = '#212121';
        ctx.fillRect(cx - 10 + lean * 5, cy, 20, 10);

        // Bike Body
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.lineTo(cx + 10 + lean * 10, cy - 40); // Top of seat
        ctx.lineTo(cx - 10 + lean * 10, cy - 40);
        ctx.fill();

        // Rider Legs
        ctx.fillStyle = '#1a237e'; // Jeans
        ctx.beginPath();
        ctx.moveTo(cx - 8 + lean * 5, cy - 35);
        ctx.lineTo(cx - 15 + lean * 15, cy - 10); // Left foot
        ctx.lineTo(cx - 5 + lean * 5, cy - 35);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 8 + lean * 5, cy - 35);
        ctx.lineTo(cx + 15 + lean * 15, cy - 10); // Right foot
        ctx.lineTo(cx + 5 + lean * 5, cy - 35);
        ctx.fill();


        // Rider Body
        ctx.fillStyle = color; // Shirt
        ctx.fillRect(cx - 12 + lean * 8, cy - 70, 24, 35);

        // Arms
        ctx.fillStyle = color;
        // Left arm
        ctx.beginPath();
        ctx.moveTo(cx - 12 + lean * 8, cy - 65);
        ctx.lineTo(cx - 25 + lean * 15, cy - 45); // Hand on handle
        ctx.lineWidth = 5;
        ctx.strokeStyle = color;
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(cx + 12 + lean * 8, cy - 65);
        ctx.lineTo(cx + 25 + lean * 15, cy - 45); // Hand on handle
        ctx.stroke();

        // Head
        ctx.fillStyle = '#ffecb3'; // Skin
        ctx.beginPath();
        ctx.arc(cx + lean * 10, cy - 80, 10, 0, Math.PI*2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx + lean * 10, cy - 82, 11, Math.PI, Math.PI*2);
        ctx.fill();

        return canvas;
    }

    private static generateRiderAction(color: string, action: 'punch' | 'kick'): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(128, 128);
        const cx = 64;
        const cy = 110;

        // Assume slight lean right for action for simplicity or straight
        const lean = 0;

        // Bike (Same as straight)
        ctx.fillStyle = '#212121';
        ctx.fillRect(cx - 10, cy, 20, 10);
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.lineTo(cx + 10, cy - 40);
        ctx.lineTo(cx - 10, cy - 40);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#1a237e';
        if (action === 'kick') {
            // Kicking leg (Right)
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy - 35);
            ctx.lineTo(cx + 40, cy - 35); // Kicking out
            ctx.lineTo(cx + 5, cy - 35);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#1a237e';
            ctx.stroke();

            // Other leg
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy - 35);
            ctx.lineTo(cx - 15, cy - 10);
            ctx.fill();
        } else {
             // Normal legs
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy - 35);
            ctx.lineTo(cx - 15, cy - 10);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy - 35);
            ctx.lineTo(cx + 15, cy - 10);
            ctx.fill();
        }

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(cx - 12, cy - 70, 24, 35);

        // Arms
        ctx.lineWidth = 5;
        ctx.strokeStyle = color;

        if (action === 'punch') {
            // Punching arm (Right)
             ctx.beginPath();
            ctx.moveTo(cx + 12, cy - 65);
            ctx.lineTo(cx + 40, cy - 65); // Punching out
            ctx.stroke();

            // Other arm
            ctx.beginPath();
            ctx.moveTo(cx - 12, cy - 65);
            ctx.lineTo(cx - 25, cy - 45);
            ctx.stroke();
        } else {
            // Normal arms
            ctx.beginPath();
            ctx.moveTo(cx - 12, cy - 65);
            ctx.lineTo(cx - 25, cy - 45);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 12, cy - 65);
            ctx.lineTo(cx + 25, cy - 45);
            ctx.stroke();
        }

        // Head
        ctx.fillStyle = '#ffecb3';
        ctx.beginPath();
        ctx.arc(cx, cy - 80, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx, cy - 82, 11, Math.PI, Math.PI*2);
        ctx.fill();

        return canvas;
    }

    private static generateWipeout(color: string): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(128, 128);
        const cx = 64;
        const cy = 100;

        // Bike on side
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#424242';
        ctx.fillRect(-20, -10, 40, 20); // Bike body
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(-25, 0, 10, 0, Math.PI*2); // Wheel
        ctx.arc(25, 0, 10, 0, Math.PI*2); // Wheel
        ctx.fill();
        ctx.restore();

        // Rider flying
        ctx.fillStyle = color;
        ctx.fillRect(cx - 10, cy - 40, 20, 10); // Body horizontal
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(cx + 10, cy - 40, 20, 10); // Legs

        ctx.fillStyle = '#ffecb3';
        ctx.beginPath();
        ctx.arc(cx - 15, cy - 35, 8, 0, Math.PI*2); // Head
        ctx.fill();

        // Dust clouds
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI*2);
        ctx.arc(cx+20, cy-10, 15, 0, Math.PI*2);
        ctx.fill();

        return canvas;
    }
}
