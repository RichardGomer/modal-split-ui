import autoBind from 'auto-bind';
import GeoPlus from '../geometry';
import HModel from '../model/HModel';

export default class CompareModel extends HModel {
    constructor(errors, output, original) {

        super({errors: errors, output: output, original: original, focussed: false})

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
     * Check if the given segment, from the corrected journey (b), matches any segment
     * in the original journey
     *
     * by matches, we mean has the same start and end points; i.e. covers a comparable
     * segment
     */
    matchesOriginal(s) {
        return this.matches(s, this.state.original);
    }

    matchesErrorfied(s) {
        return this.matches(s, this.state.errors);
    }

    comparable(a, b) {
        var tolerance = 150; // tolerance for point matching

        if(a.isDestination() || b.isDestination()) {
            return false;
        }

        var sdist = GeoPlus.distance(a.getStart(), b.getStart()); // Distance between starts
        var edist = GeoPlus.distance(a.getEnd(), b.getEnd()); // Distance between ends

        return sdist <= tolerance && edist <= tolerance;
    }

    matches(s, j) {

        var matches = [];

        for(var js of j.getSegments()){

            if(this.comparable(js, s)) {
                matches.push({seg: js});
            }
        }

        if(matches.length < 1) {
            return false;
        }
        else {
            if(matches.length == 1) return matches[0].seg;
            else {
                // We want to find the best; so check if we can use segment IDs to disambiguate
                for(var m of matches) {
                    if(m.seg.getIdentifier() == s.getIdentifier()) {
                        return m.seg;
                    }
                }

                throw "Matches multiple and cannot be disambiguated by ID";
            }
        }
    }

    /**
     * Classify a given output segment into one of the error-correction classes
     */
    classify(bs) {

        if(bs.isDestination()){
            return "END SEGMENT";
        }

        try {
            var matchOrig = this.matchesOriginal(bs);
            var matchErr = this.matchesErrorfied(bs);
        } catch (e) {
            return e;
        }

        if(matchOrig !== false && matchErr !== false) {
            if(bs.getIdentifier() == matchOrig.getIdentifier())
            {
                return "COMPARABLE-PERSISTENT";
            }
            else {
                return "COMPARABLE-RECREATED";
            }
        } else if(matchOrig !== false) {
            return "COMPARABLE-FIXED"
        } else if(matchErr !== false) {
            return "COMPARABLE-UNRESOLVED";
        } else {
            return "NOT COMPARABLE";
        }
    }
}
