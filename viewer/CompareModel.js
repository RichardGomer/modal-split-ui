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

        console.log("Match");

        // Two loops to iterate through all journey combinations
        for(var j1id in journeys) {
            for(var j2id in journeys) {

                if(j1id == j2id)
                    break; // Only do half of the pairs

                console.log(j1id, j2id);

                var j1 = journeys[j1id];
                var j2 = journeys[j2id];

                var segs1 = j1.getSegments();
                var segs2 = j2.getSegments();

                // Persistent counters mark progress through each journey
                var progress = {};
                for(var i in journeys) {
                    progress[i] = 0;
                }

                // One iterator through j1
                for(var s1id = progress[j1id]; s1id < segs1.length; s1id++) {
                    var s1 = segs1[s1id];

                    // And one iterator through j2
                    for(var s2id = progress[j2id]; s2id < segs2.length; s2id++) {
                        var s2 = segs2[s2id];

                        // IF the segments are comparable
                        if(this.isBestMatch(s1, s2, segs1, segs2, progress[j1id], progress[j2id])) {

                            // Advance the progress markers
                            // Any unmatched points can be added as singletons
                            while(progress[j1id] <= s1id) {
                                var m = {};
                                m[j1id] = segs1[progress[j1id]];
                                matches.push(m);
                                progress[j1id]++;
                            }

                            while(progress[j2id] <= s2id) {
                                var m = {};
                                m[j2id] = segs2[progress[j2id]];
                                matches.push(m);
                                progress[j2id]++;
                            }

                            // record the match
                            var m = {};
                            m[j1id] = s1;
                            m[j2id] = s2;
                            matches.push(m);
                            console.log("paired", j1id + "-" + s1.getIdentifier(), j2id + "-" + s2.getIdentifier())
                            break;
                        }
                    }
                }

                while(progress[j1id] < segs1.length) {
                    var m = {};
                    m[j1id] = segs1[progress[j1id]];
                    matches.push(m);
                    progress[j1id]++;
                }

                while(progress[j2id] < segs2.length) {
                    var m = {};
                    m[j2id] = segs2[progress[j2id]];
                    matches.push(m);
                    progress[j2id]++;
                }
            }
        }

        // See if two objects contain the same value anywhere
        function samePoints(a, b) {
            var aks = Object.keys(a);
            var bks = Object.keys(b);
            for(var ak of aks) {
                for(var bk of bks) {
                    if(a[ak] == b[bk]) {
                        return true;
                    }
                }
            }

            return false;
        }

        // Now we have a list of comparable pairs; combine pairs where the same point appears in both
        for(var aid in matches) {
            var a = matches[aid];
            if(a == null)
                continue;

            for(var bid in matches) {
                var b = matches[bid];

                if(b == null || a == b)
                    continue;

                if(samePoints(a, b)) {
                    // Combine a and b
                    Object.assign(a, b);
                    matches[bid] = null;
                }
            }
        }

        console.log(matches);

        // Only retain the non-null items from the match matrix
        this.matches = [];
        for(var i in matches) {
            if(matches[i] != null) {
                this.matches.push(matches[i]);
            }
        }

        // Sort the matrix by distance from the start of th journeys
        var maxPos = function(ob){
            var pos = [];
            for(var j of Object.values(ob)){
                pos.push(j.getPosition());
            }

            return Math.max.apply(null, pos);
        }
        this.matches.sort(function(a,b){
            return maxPos(a) - maxPos(b);
        });
    }

    // Check if a is the best (remaining) match for b
    // We also check the reverse comparison, so it should be stable I guess
    isBestMatch(a, b, asegs, bsegs, afrom, bfrom, reverse) {
        if(!this.samePlace(a, b)) {
            return false;
        }

        var reverse = reverse ? false : true;

        var same = [];
        for(var bi = bfrom; bi < bsegs.length; bi++) {
            var bcand = bsegs[bi];
            if(this.samePlace(bcand, a)) {

                var dist = this.distance(a, bcand);
                same.push({cand: bcand, dist: dist});
            }
        }

        // Sort candidates by Distance
        same.sort(function(x,y){
            return x.dist - y.dist;
        })

        // Check if B came out on top
        return b == same[0].cand && (reverse ? this.isBestMatch(b, a, bsegs, asegs, bfrom, afrom, true) : true);

        // TODO: Prefer to match destinations with other destinations; vice-versa
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
        var names = {};
        for(var m of this.matches) {
            for(var n in m) {
                names[n] = true;
            }
        }

        return Object.keys(names);
    }

    // Test if one segment is matched to another
    isMatched(a, b){
        for(var m of this.matches) {
            var segs = Object.values(m);
            if(segs.includes(a) && segs.includes(b)) return true;
            if(segs.includes(a) || segs.includes(b)) return false;
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
