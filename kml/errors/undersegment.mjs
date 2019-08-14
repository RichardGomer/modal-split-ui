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
        var n = 1 + Math.floor(Math.random() * (segments.length - 2));

        //console.log("Undersegment by removing segment %i", n);

        j.deleteSegment(n);

        j.addError('UNDERSEGMENT BY REMOVING BETWEEN ' + segments[n-1].getIdentifier() + " " + segments[n].getIdentifier());
    }

}
