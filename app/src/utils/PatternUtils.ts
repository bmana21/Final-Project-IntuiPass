import {PatternType} from "../models/pattern-type.ts";

export const getPatternTypeDisplay = (type: PatternType) => {
    switch (type) {
        case PatternType.CONNECT_DOTS:
            return { icon: '⚫', name: 'Connect The Dots' };
        case PatternType.PIANO_SEQUENCE:
            return { icon: '🎹', name: 'Piano'};
        case PatternType.CHESS_BOARD:
            return { icon: '♔', name: 'Chess Board'};
        case PatternType.MATHEMATICAL_FORMULA:
            return {icon: '∫', name: 'Mathematical Formula'}
        case PatternType.PIXEL_ART:
            return { icon: '🎨', name: 'Pixel Art'};
        default:
            return { icon: '🔐', name: 'Pattern' };
    }
};