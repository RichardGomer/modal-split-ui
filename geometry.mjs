/**
 * Some extra geometry not included in the Google library
 */

import nodegeometry from 'spherical-geometry-js';

var LatLng;
var geometry;

// If we're using the real google library (e.g. in browser) we need to use the "real" LatLng implementation or maps break :/
// otherwise, we need to fall back to the ported implementation from spherical-geometry-js
if(typeof google !== 'undefined') {
    LatLng = google.maps.LatLng;
    geometry = google.maps.geometry.spherical;
    //console.log("Using google.maps.LatLng", LatLng);
} else {
    LatLng = nodegeometry.LatLng;
    geometry = nodegeometry;
    //console.log("Using ported LatLng", LatLng);
}


export default class GeoPlus
{
    // Make underlying spherical geometry library available, since we bothered to resolve it
    // 'get' means we don't need to use brackets to call it...
    static get spherical() {
        return geometry;
    }

    static parsePoint(p) {

        // Array of strings
        if(Array.isArray(p)) {
            return p.map(GeoPlus.parsePoint);
        }

        if(typeof p != 'string') {
            return p;
        }

        var sp = p.replace(/\(|\)/, '').split(/,/);

        // We need to use the LatLng provided by the external maps API, not the local implementation
        try {
            return new LatLng(parseFloat(sp[0]), parseFloat(sp[1]));
        } catch (e) {
            console.error("Could not parse %s %s", typeof p, p);
        }
    }

    static strPoint(p) {
        if(typeof p == "array")
            return p.join(',');
        else if(p instanceof LatLng)
            return p.lat().toString() + "," + p.lng().toString();
    }

    static distance(a, b) {
        return geometry.computeDistanceBetween(GeoPlus.parsePoint(a), GeoPlus.parsePoint(b));
    }

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
        return new LatLng(nearest.x, nearest.y);
    }

    static midpoint(a, b){
        a = GeoPlus.parsePoint(a);
        b = GeoPlus.parsePoint(b);

        var lat = a.lat() + (b.lat() - a.lat())/2;
        var lng = a.lng() + (b.lng() - a.lng())/2;

        console.log("Midpoint %s %s %s,%s", a, b, lat, lng)

        return new LatLng(lat, lng);
    }

    /**
     * Given an array of points, find the one that's closest to the given point
     * Returns the KEY of the point, not the point itself
     */
    static closestPointInArray(point, array, start) {

        if(typeof start == 'undefined')
            start = 0;

        point = GeoPlus.parsePoint(point);
        array = GeoPlus.parsePoint(array);

        if(typeof point == 'undefined') {
            console.error("Point is undefined", point, array);
        }

        //console.log("Point:\n", point, "\n\nList:\n", array);

        var best_i = 0;
        var mindist = Infinity; // Will hold distance of closest point

        //console.log("Find point closest to %s", point);
        for(var i = start; i < array.length; i++) {
            const p = array[i];

            var dist = geometry.computeDistanceBetween(p, point);

            if(dist < mindist) {
                best_i = i;
                mindist = dist;
                //console.log(":  %s = %im **", p, dist)
            } else {
                //console.log(":  %s = %im", p, dist)
            }
        }

        //console.error("Closest point to %s is %i %im away", array[best_i], best_i, mindist);


        return best_i;
    }
}
