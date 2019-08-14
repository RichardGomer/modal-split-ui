/**
 * Over-segmentation error generator
 */

import { JourneyModel, JourneyModelSegment } from '../../model'
import geometry  from '../../geometry'

export default class OverSegmentationInserter
{
    constructor() {

    }

    /**
     * Apply an error to the provided JourneyModel
     */
    apply(j) {

        // 1: Pick a segment
        // But not an end segment
        var segments = j.getSegments();

        do {
            var n = Math.floor(Math.random() * (segments.length - 1));
        } while(segments[n].isDestination());

        var s = segments[n];

        // Find the GPS point that segment begins on
        var pn = j.getClosestGPSPointPosition(s.getStart());

        // Find the GPS point that the NEXT segment begins on
        var p2n = j.getClosestGPSPointPosition(segments[n+1].getStart(), pn);

        var points = j.getGPSPathPoints();


        // If there are free points in between, pick one
        if(p2n - pn > 1){
            var p3n = pn + (Math.floor(Math.random()  * (p2n - pn)));
            var p3 = points[p3n];
        } else { // Otherwise interpolate
            var p3 = geometry.strPoint(geometry.midpoint(points[pn], points[p2n]));
        }

        var ns = new JourneyModelSegment({
            start: p3,
            mode: s.getMode()
        });

        j.insertSegmentAt(n+1, ns);

        j.addError('OVERSEGMENT BY ADDING ' + ns.getIdentifier());
    }

}
