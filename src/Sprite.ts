export enum SpriteType {
    TREE = 'TREE',
    SIGN = 'SIGN'
}

export interface Sprite {
    type: SpriteType;
    offset: number; // Normalized offset from center (-1 to 1)
}
