export enum SpriteType {
    TREE = 'TREE',
    SIGN = 'SIGN',
    POLE = 'POLE',
    BUSH = 'BUSH'
}

export interface Sprite {
    type: SpriteType;
    offset: number; // Normalized offset from center (-1 to 1)
}
