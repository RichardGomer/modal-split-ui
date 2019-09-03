/**

Compare journeys

Uses a network model to compare two journeys.

**/

import autoBind from 'auto-bind';
import { JourneyModel, JourneyModelSegment } from '../model'

import GeoPlus from '../geometry';

// Cytoscape is a network analysis library
import cytoscape from 'cytoscape';

/**
    tolerance_m : tolerance for point matching, in metres
    j_in: input journey
    j_out: output journey



    Assumptions. (these are not checked!)
    1. GPS trace is the same for both journeys
*/
export default class JourneyComparator {
    constructor(j_in, j_out, tolerance_m) {
        this.tolerance = tolerance_m;

        this.j_in = j_in;
        this.j_out = j_out;

        autoBind(this);
    }

    /**
     * Add a point; or find another within the tolerance
     */

    getGPS() {
        return this.j_in.getGPS();
    }

    /**
     * Composite points is the union of segment change points; it gives the set
     * of segments that need to be compared.
     */
    getCompositePoints() {

        function getPoints(j){

            var points = [];
            var segs = j.getSegments();
            for(var s of segs) {
                points.push(s.getStart());
                points.push(s.getEnd());
            }

            return points;
        }

        var p1 = getPoints(this.j_in);
        var p2 = getPoints(this.j_out);

        var points = p1.concat(p2);

        // Now remove duplicates
        var uniques = [];
        for(var pi in points) { // For each point, check if it maps to an existing one, else add it to the final list
            var found = 0;

            if(typeof points[pi] == 'undefined')
                continue;

            for(var ui in uniques) {
                if(this.pointsEqual(points[pi], uniques[ui])){
                    found++;
                    break;
                }
            }

            if(found == 0) {
                uniques.push(points[pi]);
            }

            // Potentially, one point could be within tolerance of multiple others
            // that's hard to handle, but we can print a warning!
            if(found > 1) {
                console.error("WARNING point matching was ambiguous, point ", points[pi], " is within tolerance of multiple points");
            }
        }

        //console.log("Composite points", points, uniques);

        return uniques;
    }

    /**
     * Check if two points are equal, i.e. within tolerance of one another
     */
    pointsEqual(p1, p2) {
        return GeoPlus.distance(p1, p2) <= this.tolerance;
    }

    /**
     * Get a blank cytoscape graph, but monkeypatch some useful additions into it
     */
    getNewGraph() {
        var g = cytoscape();

        // Find the node that represents the given point;
        // this point needs to exist in the graph, tolerances are NOT applied
        g.findPointNode = function(point) {
            var ps = point;
            var nodes = g.nodes('[point="' + ps + '"]');
            return nodes[Object.keys(nodes)[0]];
        }

        return g;
    }

    /**
     * Get a graph that contains the two journeys
     */
    getComparisonGraph() {

        console.log("Creating comparison graph")
        var graph = this.getNewGraph();

        // Add all the composite points
        var points = this.getCompositePoints();

        //console.log("+ Composite Points", points);

        //console.log(this.j_in);

        for(var pi in points) {
            var p = points[pi];
            graph.add({
                group: 'nodes',
                data: {
                        id: 'point-' + pi,
                        point: p, // lat,lon string
                        time: this.j_in.getTimeAtPoint(p, this.tolerance) // This will be false if no GPS points are within our tolerance
                    }
                })
        }

        // Add each journey as edges between the points
        function addJourney(jid, jny) {

            var segs = jny.getSegments();
            for(var si in segs) {
                var s = segs[si];

                // We need to find the closest points on the graph, because they might
                // have been smushed within the tolerance
                var start = s.getStart();
                var sk = GeoPlus.closestPointInArray(start, points);
                start = points[sk];

                var end = s.getEnd();

                console.log(" + segment ", start, " -> ", end);

                if(typeof end !== 'undefined') { // Can't add an edge for end segments!
                    var ek = GeoPlus.closestPointInArray(end, points);
                    end = points[ek];

                    // Now find the nodes that correspond and create an edge between them
                    graph.add({ data: {
                        source: graph.findPointNode(start).data.id,
                        target: graph.findPointNode(end).data.id,
                        journey: jid,
                        segment: s,
                        id: 'segment-' + jid + '-' + si
                    } })
                }
            }
        }

        addJourney("IN", this.j_in);
        addJourney("OUT", this.j_out);

        //console.log("Graph", graph.$('node'));

        return graph;
    }

    /**
     * Print a comparison graph
     */
     printComparison() {
         var g = this.getComparisonGraph();

         var printJourney = function(jid) {
             var edges = g.$('edge');
             edges.map(function(e){
                 console.log("Edge: ", e.data());
             })

             g.$('node').map(function(n){
                 console.log('Node: ', n.data());
             })
         }

         console.log("IN:");
         printJourney('IN');
     }

     // TODO: Implement some comparisons; need at least:
     // point-by-point comparison
     // mode comparison
     //
}
