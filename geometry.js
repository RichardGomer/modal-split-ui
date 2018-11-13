/**
 * Some extra geometry not included in the Google library
 */

export default class GeoPlus
{
    /**
     * Find the point on line start->end closest to point
     *
     * This uses euclidean geometry, so is close enough over small distances
     * but not technically correct...
     *
     * See: https://stackoverflow.com/questions/3120357/get-closest-point-to-a-line
     */
    static closestPointOnLine(start, end, point) {

        // Convert to simple x/y objects
        var P = {x: point.lat(), y: point.lng()};
        var A = {x: start.lat(), y: start.lng()};
        var B = {x: end.lat(), y: end.lng()};

        var a_to_p = [P.x - A.x, P.y - A.y]     // Storing vector A->P
        var a_to_b = [B.x - A.x, B.y - A.y]     // Storing vector A->B

        var atb2 = a_to_b[0]**2 + a_to_b[1]**2  // **2 means "squared"
                                                //   Basically finding the squared magnitude
                                                //   of a_to_b

        var atp_dot_atb = a_to_p[0]*a_to_b[0] + a_to_p[1]*a_to_b[1]
                                                // The dot product of a_to_p and a_to_b

        var t = atp_dot_atb / atb2              // The normalized "distance" from a to
                                                //   your closest point

        if(t > 1) t = 1; // Clamp to 1, else points can be beyond the bounds of the line
        if(t < 0) t = 0;

        var nearest = { x: A.x + a_to_b[0]*t, y: A.y + a_to_b[1]*t };
                                                // Add the distance to A, moving
                                                //   towards B

        // Convert back to LatLng object
        return new google.maps.LatLng(nearest.x, nearest.y);
    }

    /**
     * Given an array of points, find the one that's closest to the given point
     * Returns the KEY of the point, not the point itself
     */
    static closestPointInArray(point, array) {
        var best_i = 0;
        var mindist = Infinity; // Will hold distance of closest point

        console.log("Get closest point to ", point, array);

        for(var i in array) {
            const p = array[i];

            console.log("Compute distance between ", p, point);

            var dist = google.maps.geometry.spherical.computeDistanceBetween(p, point);

            if(dist < mindist) {
                best_i = i;
                mindist = dist;
            }
        }

        return best_i;
    }
}
