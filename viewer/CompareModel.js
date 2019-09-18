import autoBind from 'auto-bind';
import GeoPlus from '../geometry';
import HModel from '../model/HModel';

export default class CompareModel extends HModel {
    constructor(errors, output, original) {

        super({errors: errors, output: output, original: original, focussed: false})

        this.matcher = new Matcher(this.state.original, this.state.errors, this.state.output);

        autoBind(this);
    }

    setFocus(s) {
        this.state.focussed = s;
        this.emit('change-focus');
    }

    getFocus() {
        return this.state.focussed;
    }

    getOriginal() {
        return this.state.original;
    }

    getOutput() {
        return this.state.output;
    }

    getErrorfied() {
        return this.state.errors;
    }

    /**
     * Get the list of errors that were inserted
     */
    getErrorList() {
        return this.state.errors.getErrors();
    }

    /**
     *
     */
    getMatcher() {
        return this.matcher;
    }
}

export class Matcher {
    // Construct with three journeys
    constructor(jin, jerr, jout) {

        autoBind(this);

        this.match({jin: jin, jerr: jerr, jout: jout});
    }

    // (Re-)compute the match table
    match(journeys) {
        // The match matrix
        var matches = [];

        var comps = [['jin','jout'],['jerr','jout']];

        var matches = [];

        for(var c of comps) {
            matches = matches.concat(this.matchPair(c[0], c[1], journeys));
        }

        // Now merge the matches based on jout
        for(var mai in matches) {
            var ma = matches[mai];
            if(ma == null) continue;

            for(var mbi in matches) {

                var mb = matches[mbi];

                console.log(mai, mbi, ma, mb);

                if(mai != mbi && ma != null && mb != null && ma.jout == mb.jout) {
                    var jo = ma.jout;
                    var ji = ma.jin != null ? ma.jin : mb.jin;
                    var je = ma.jerr != null ? ma.jerr : mb.jerr;

                    matches[mai] = {jerr: je, jin: ji, jout: jo};
                    matches[mbi] = null;
                }
            }
        }

        matches = matches.filter(function(o){return o;});

        //console.log(matches);

        function msort(a,b){



                for(var jn of ['jin','jerr','jout']) {

                    if(!a[jn] || !b[jn]) continue;

                    console.log("CMP %s [%i] %s [%i] %s", jn, ap, a[jn].getIdentifier(), bp, b[jn].getIdentifier());

                    var ap = a[jn].getPosition();
                    var bp = b[jn].getPosition();

                    if(ap != bp) {
                        return ap-bp;
                    }
                }

                return 0;
        }

        function sortMatches(arr) {

            var out = [arr[0]];

            for(var i in arr) { // Merge each input..
                if(i == 0) continue; // Skip firsts

                var a = arr[i];
                var added = false;

                for(var j in out) { // into the correct place in the output
                    var b = out[j];

                    console.log(i, j, out);

                    // If b belongs
                    if(msort(a,b) < 0) {
                        console.log("INS at ", j)
                        out.splice(j, 0, a);
                        added  = true;
                        break;
                    }
                }

                if(!added)
                    out.push(a);
            }

            return out;
        }

        //matches.sort(msort)
        matches = sortMatches(matches);

        // Add missing (ie unmatched) segments from each journey
        var last = {jin: 0, jerr: 0, jout: 0}
        for(var m of matches) {
            for(var jn of Object.keys(m)) {
                while(last[jn] < m[jn].getPosition()){
                    var o = {};
                    o[jn] = journeys[jn].getSegments()[last[jn]];
                    matches.push(o);
                    last[jn]++;
                }
                last[jn]++; // Skip the one that's already in the match
            }
        }

        // Add any stragglers
        for(var jn of Object.keys(journeys)) {
            while(last[jn] < journeys[jn].getSegments().length){
                var o = {};
                o[jn] = journeys[jn].getSegments()[last[jn]];
                matches.push(o);
                last[jn]++;
            }
        }

        // TODO: match any singletons, if possible

        // Sort again
        //matches.sort(msort);
        matches = sortMatches(matches);

        console.log(matches);

        this.matches = matches;

    }

    // Match two journeys together; returns an array of match objects
    matchPair(jai, jbi, journeys) {
        var distances = [];

        var ja = journeys[jai];
        var jb = journeys[jbi];



        // 1: Find pairwise distances between all points
        for(var sa of ja.getSegments()) {
            for(var sb of jb.getSegments()){
                distances.push({a: sa, b: sb, dist: this.distance(sa, sb)});
            }
        }

        distances.sort(function(a,b){
            return a.dist - b.dist;
        });

        console.log("Match pair", jai, jbi, distances);

        var self = this;

        function closest(a_start, a_end, b_start, b_end) {

            var best = null;
            for(var d of distances) {
                if(d.a.getPosition() >= a_start && d.b.getPosition() >= b_start &&
                    d.a.getPosition() <= a_end && d.b.getPosition() <= b_end) {
                    if(best === null || d.dist < best.dist) {
                        best = d;
                    }
                }
            }

            return best;
        }

        var matches = [];
        function matchBest(a_start, a_end, b_start, b_end) {

            // IF the ranges are zero length, we can stop
            if((a_end - a_start) <= 0 || (b_end - b_start) <= 0) return;

            console.log("Match in range", a_start, a_end, b_start, b_end);

            // Find the closest points within the bounds
            var best = closest(a_start, a_end, b_start, b_end);

            // If the best match is out of the tolerance, we can stop
            if(!self.samePlace(best.a, best.b)) return;

            // Create the match
            var m = {};
            m[jai] = best.a;
            m[jbi] = best.b;
            matches.push(m);

            // Complete on either side of the new match
            var ai = best.a.getPosition();
            var bi = best.b.getPosition();

            console.log("Matched ", ai, bi)

            matchBest(a_start, ai-1, b_start, bi-1);

            matchBest(ai+1, a_end, bi+1, b_end);
        }

        matchBest(0, ja.getSegments().length - 1, 0, jb.getSegments().length - 1);

        return matches;
    }

    distance(a, b) {
        return GeoPlus.distance(a.getStart(), b.getStart()); // Distance between starts
    }

    // Test if two segments start in the same place
    samePlace(a, b) {
        var tolerance = 150; // tolerance for point matching

        var sdist = this.distance(a, b);

        return sdist <= tolerance;
    }

    // Get computed matches
    getMatches() {
        return this.matches;
    }

    // Return the names being used for journeys in the match matrix
    getJourneyNames() {
        return ['jin', 'jerr', 'jout'];
    }

    // Test if one segment is matched to another
    isMatched(a, b){
        for(var m of this.matches) {
            var segs = Object.values(m);
            if(segs.includes(a) && segs.includes(b)) return true;
            //if(segs.includes(a) || segs.includes(b)) return false;
        }
    }

    // Get segments that are matched to the given segment
    getMatched(s) {
        for(var m of this.matches) {
            var segs = Object.values(m);
            if(segs.includes(s)) {
                return segs;
            }
        }

        return []; // We actually shouldn't get here...
    }
}
