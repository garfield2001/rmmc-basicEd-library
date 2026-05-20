import { publicScrollDeltaPerStep } from './constants';

export function wheelScrollSteps(event: WheelEvent) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        return Math.abs(event.deltaY) / 3;
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        return Math.abs(event.deltaY) * 2;
    }

    return Math.abs(event.deltaY) / publicScrollDeltaPerStep;
}
