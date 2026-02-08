export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 480;
export const FPS = 60;
export const STEP = 1 / FPS;
export const ROAD_WIDTH = 2000;
export const SEGMENT_LENGTH = 200;
export const RUMBLE_LENGTH = 3;
export const DRAW_DISTANCE = 300;
export const FIELD_OF_VIEW = 100;
export const CAMERA_HEIGHT = 800; // Lower camera for more intense feel
export const CAMERA_DEPTH = 1 / Math.tan((FIELD_OF_VIEW / 2) * Math.PI / 180);
export const PLAYER_Z = CAMERA_HEIGHT * CAMERA_DEPTH;

export const COLORS = {
    SKY: '#87CEEB',
    TREE: '#005108',
    FOG: '#005108',
    LIGHT: { road: '#787878', grass: '#4CAF50', rumble: '#B71C1C', lane: '#CCCCCC' }, // Slightly lighter road, nice grass, red rumble
    DARK: { road: '#686868', grass: '#388E3C', rumble: '#F4F4F4' }, // Darker road, darker grass, white rumble (alternating)
    START: { road: 'white', grass: 'white', rumble: 'white' },
    FINISH: { road: 'black', grass: 'black', rumble: 'black' }
};
