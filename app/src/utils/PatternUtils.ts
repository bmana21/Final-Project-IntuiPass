import {PatternType} from "../models/pattern-type.ts";

export const getPatternTypeDisplay = (type: PatternType) => {
    switch (type) {
        case PatternType.CONNECT_DOTS:
            return { icon: '⚫', name: 'Connect The Dots' };
        case PatternType.PIANO_SEQUENCE:
            return { icon: '🎹', name: 'Piano' };
        default:
            return { icon: '🔐', name: 'Pattern' };
    }
};