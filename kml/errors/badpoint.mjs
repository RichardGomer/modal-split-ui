/**
 * Wrong mode error generator
 */

 import { JourneyModel, JourneyModelSegment } from '../../model'
 import geometry from '../../geometry'

 export default class BadPointInserter
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

        var original = geometry.parsePoint(s.getStart());
        var opos = geometry.closestPointInArray(original, j.getGPSPathPoints());
        //console.log("Original point %s position %i of %i", original, opos, j.getGPSPathPoints().length)
        var originalnext = geometry.parsePoint(j.getGPSPathPoints()[(opos * 1) + 1]);

        //console.log("Add bad point between %s and %s", original, originalnext);

        // Generate a new point
        var heading = geometry.spherical.computeHeading(original, originalnext);

        // Move the heading through 90degrees to make it perpendicular to current line
        heading = ((heading + 180) + (Math.random() >= 0.5 ? -1 : 1) * 90) % 360 - 180;

        var distance = Math.random() > 0.5 ? 400 : 1000;

        var newpoint = geometry.strPoint(geometry.spherical.computeOffset(original, distance, heading));
        //console.log(" + %s", newpoint);

        // Update the start point of the segment, AND the underlying GPS trace
        var gpspos = geometry.closestPointInArray(original, j.getGPSPathPoints());
        var path = j.getGPSPath();
        path[gpspos].point = newpoint;

        s.setStart(newpoint);

        j.addError('BADPOINT ' + s.getIdentifier() + ' ' + distance + 'm ' + original + '->' + newpoint);
    }

}
