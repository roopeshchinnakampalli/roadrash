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
    public static opponentGreenIdle: HTMLCanvasElement;
    public static opponentGreenLeft: HTMLCanvasElement;
    public static opponentGreenRight: HTMLCanvasElement;
    public static opponentYellowIdle: HTMLCanvasElement;
    public static opponentYellowLeft: HTMLCanvasElement;
    public static opponentYellowRight: HTMLCanvasElement;
    public static roadPatternLight: HTMLCanvasElement;
    public static roadPatternDark: HTMLCanvasElement;
    public static pole: HTMLCanvasElement;
    public static bush: HTMLCanvasElement;

    public static init() {
        this.backgroundSky = this.generateSky();
        this.backgroundHills = this.generateHills();
        this.backgroundTrees = this.generateDistantTrees();
        this.tree = this.generateTree();
        this.sign = this.generateSign();
        this.pole = this.generatePole();
        this.bush = this.generateBush();
        this.roadPatternLight = this.generateRoadPattern('#707070', '#757575');
        this.roadPatternDark = this.generateRoadPattern('#696969', '#646464');

        // Player sprites (Red)
        this.playerIdle = this.generateRider('#ff0000', 0);
        this.playerLeft = this.generateRider('#ff0000', -1);
        this.playerRight = this.generateRider('#ff0000', 1);
        this.playerPunch = this.generateRiderAction('#ff0000', 'punch');
        this.playerKick = this.generateRiderAction('#ff0000', 'kick');
        this.playerWipeout = this.generateWipeout('#ff0000');

        // Opponent sprites (Blue)
        this.opponentIdle = this.generateRider('#0000ff', 0);
        this.opponentLeft = this.generateRider('#0000ff', -1);
        this.opponentRight = this.generateRider('#0000ff', 1);
        this.opponentPunch = this.generateRiderAction('#0000ff', 'punch');
        this.opponentKick = this.generateRiderAction('#0000ff', 'kick');
        this.opponentWipeout = this.generateWipeout('#0000ff');

        // Opponent variants (for variety)
        this.opponentGreenIdle = this.generateRider('#008800', 0);
        this.opponentGreenLeft = this.generateRider('#008800', -1);
        this.opponentGreenRight = this.generateRider('#008800', 1);

        this.opponentYellowIdle = this.generateRider('#CCCC00', 0);
        this.opponentYellowLeft = this.generateRider('#CCCC00', -1);
        this.opponentYellowRight = this.generateRider('#CCCC00', 1);
    }

    private static createContext(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        return { canvas, ctx };
    }

    private static generateRoadPattern(baseColor: string, noiseColor: string): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(64, 64);

        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 64, 64);

        // Noise
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 2 + 1;
            ctx.fillStyle = noiseColor;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1.0;

        return canvas;
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

    private static generatePole(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(32, 256); // Tall

        // Pole
        ctx.fillStyle = '#8d6e63'; // Wood color
        ctx.fillRect(12, 0, 8, 256);

        // Crossbar
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(2, 20, 28, 6);

        // Insulators
        ctx.fillStyle = '#eee';
        ctx.beginPath(); ctx.arc(6, 18, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(26, 18, 3, 0, Math.PI*2); ctx.fill();

        return canvas;
    }

    private static generateBush(): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(64, 64);

        // Leaves
        ctx.fillStyle = '#33691e';
        ctx.beginPath();
        ctx.arc(32, 48, 16, 0, Math.PI*2);
        ctx.arc(20, 48, 12, 0, Math.PI*2);
        ctx.arc(44, 48, 12, 0, Math.PI*2);
        ctx.arc(32, 32, 14, 0, Math.PI*2);
        ctx.fill();

        // Berries/Detail
        ctx.fillStyle = '#7cb342';
        ctx.beginPath(); ctx.arc(32, 40, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, 50, 3, 0, Math.PI*2); ctx.fill();

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
        // Back View with Aggressive Posture
        const { canvas, ctx } = this.createContext(128, 128);
        const cx = 64;
        const cy = 110;

        // Bike Wheels (Rear tire) - Slightly flatter
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 14 + lean * 12, cy - 15, 28, 15); // Wide tire

        // Bike Body (Rear fender/exhaust) - Compact
        ctx.fillStyle = '#222';
        ctx.fillRect(cx - 18 + lean * 12, cy - 45, 36, 30);

        // Exhaust pipes - Dual
        ctx.fillStyle = '#AAA';
        ctx.fillRect(cx + 18 + lean * 12, cy - 25, 6, 15); // Right pipe
        ctx.fillRect(cx - 24 + lean * 12, cy - 25, 6, 15); // Left pipe

        // Rider Legs - Tucked in
        ctx.fillStyle = '#1a237e'; // Jeans
        ctx.beginPath();
        ctx.moveTo(cx - 12 + lean * 8, cy - 45);
        ctx.lineTo(cx - 22 + lean * 18, cy - 25); // Left leg angled out slightly
        ctx.lineTo(cx - 8 + lean * 8, cy - 45);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 12 + lean * 8, cy - 45);
        ctx.lineTo(cx + 22 + lean * 18, cy - 25); // Right leg angled out slightly
        ctx.lineTo(cx + 8 + lean * 8, cy - 45);
        ctx.fill();

        // Rider Back (Jacket) - Leaning Forward (Lower profile)
        ctx.fillStyle = color; // Shirt
        // Shoulders are lower, creating "hunch"
        ctx.beginPath();
        ctx.moveTo(cx - 20 + lean * 12, cy - 75); // Left shoulder
        ctx.lineTo(cx + 20 + lean * 12, cy - 75); // Right shoulder
        ctx.lineTo(cx + 10 + lean * 8, cy - 45); // Waist right
        ctx.lineTo(cx - 10 + lean * 8, cy - 45); // Waist left
        ctx.fill();

        // Arms - Tucked In (Elbows closer to body)
        ctx.lineWidth = 7;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 18 + lean * 12, cy - 70); // Left shoulder
        ctx.lineTo(cx - 28 + lean * 15, cy - 55); // Left elbow tucked
        ctx.lineTo(cx - 22 + lean * 12, cy - 40); // Hand (hidden near handle)
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 18 + lean * 12, cy - 70); // Right shoulder
        ctx.lineTo(cx + 28 + lean * 15, cy - 55); // Right elbow tucked
        ctx.lineTo(cx + 22 + lean * 12, cy - 40); // Hand
        ctx.stroke();

        // Head (Helmet Back) - Tucked Low
        ctx.fillStyle = '#222';
        // Position head lower to simulate forward lean
        ctx.beginPath();
        ctx.arc(cx + lean * 15, cy - 80, 11, 0, Math.PI*2);
        ctx.fill();

        // Helmet Detail (Neck protector / back of helmet)
        ctx.fillStyle = '#444';
        ctx.fillRect(cx + lean * 15 - 6, cy - 80, 12, 4);

        return canvas;
    }

    private static generateRiderAction(color: string, action: 'punch' | 'kick'): HTMLCanvasElement {
        // Similar back view but with action
        const { canvas, ctx } = this.createContext(128, 128);
        const cx = 64;
        const cy = 110;
        const lean = 0;

        // Bike
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 12, cy - 20, 24, 20);
        ctx.fillStyle = '#333';
        ctx.fillRect(cx - 15, cy - 50, 30, 30);
        ctx.fillStyle = '#999';
        ctx.fillRect(cx + 15, cy - 30, 8, 20);

        // Legs
        ctx.fillStyle = '#1a237e';
        if (action === 'kick') {
            // Kick Right
             ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 50);
            ctx.lineTo(cx + 50, cy - 40); // Kick out
            ctx.lineTo(cx + 15, cy - 50);
            ctx.fill();

            // Other leg
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 50);
            ctx.lineTo(cx - 20, cy - 20);
            ctx.lineTo(cx - 5, cy - 50);
            ctx.fill();
        } else {
            // Normal legs
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 50);
            ctx.lineTo(cx - 20, cy - 20);
            ctx.lineTo(cx - 5, cy - 50);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 50);
            ctx.lineTo(cx + 20, cy - 20);
            ctx.lineTo(cx + 5, cy - 50);
            ctx.fill();
        }

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(cx - 15, cy - 90, 30, 40);

        // Arms
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        if (action === 'punch') {
            // Punch Right
            ctx.beginPath();
            ctx.moveTo(cx + 15, cy - 85);
            ctx.lineTo(cx + 50, cy - 80); // Punch out
            ctx.stroke();

            // Other arm
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy - 85);
            ctx.lineTo(cx - 35, cy - 65);
            ctx.stroke();
        } else {
            // Normal arms
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy - 85);
            ctx.lineTo(cx - 35, cy - 65);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 15, cy - 85);
            ctx.lineTo(cx + 35, cy - 65);
            ctx.stroke();
        }

        // Head
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx, cy - 100, 12, 0, Math.PI*2);
        ctx.fill();

        return canvas;
    }

    private static generateWipeout(color: string): HTMLCanvasElement {
        const { canvas, ctx } = this.createContext(128, 128);
        const cx = 64;
        const cy = 100;

        // Bike on side (Rear view twisted)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(-15, -15, 30, 60); // Bike body
        ctx.fillStyle = '#111';
        ctx.fillRect(-12, 40, 24, 20); // Tire
        ctx.restore();

        // Rider flying
        ctx.fillStyle = color;
        ctx.fillRect(cx - 40, cy - 40, 30, 20); // Body
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(cx - 60, cy - 30, 20, 10); // Legs

        ctx.fillStyle = '#333'; // Helmet
        ctx.beginPath();
        ctx.arc(cx - 20, cy - 50, 10, 0, Math.PI*2);
        ctx.fill();

        // Dust clouds
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI*2);
        ctx.fill();

        return canvas;
    }
}
