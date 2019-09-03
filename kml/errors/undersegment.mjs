/**
 * Under-segmentation error generator
 */

import { JourneyModel, JourneyModelSegment } from '../../model'

export default class UnderSegmentationInserter
{
    constructor() {

    }

    /**
     * Apply an error to the provided JourneyModel
     */
    apply(j) {

        // 1: Pick a segment
        // But not the first one (0) or the last one (length-1)
        var segments = j.getSegments();

        do {
            var n = 1 + Math.floor(Math.random() * (segments.length - 2));
        } while(segments[n].isError()); // Don't remove segs with other errors

        j.addError('UNDERSEGMENT BY REMOVING ' + n + ' ' + segments[n].getIdentifier() + ' BETWEEN ' + segments[n-1].getIdentifier() + " " + segments[n+1].getIdentifier());

        j.deleteSegment(n);
    }

}
