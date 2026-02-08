export class Input {
    public keys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    public isKeyDown(key: string): boolean {
        return !!this.keys[key];
    }
}
