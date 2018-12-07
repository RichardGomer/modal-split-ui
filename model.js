/**
 * A model for the modal shift UI
 *
 * It's not quite flux because it's pretty simple, but could be replaced
 * with a full flux model fairly easily.
 */

 const autoBind = require('auto-bind');

class HModel {
    constructor(state) {

        this.state = state;
        this.subs = [];

        autoBind(this);
    }


    // Subscribe to changes on this model
    subscribe(type, cb) {

        if(!this.subs[type]) {
            this.subs[type] = [];
        }

        this.subs[type].push(cb);
    }

    // Emit a change of type
    // A change of type '*' is emitted on every other emit event!
    emit(type, data) {

        if(!data) {
            data = {};
        }

        console.log("Emit", type, data);

        // Prevent cycles by refusing to emit more events until this one is over
        if(this.locked) {
            return;
        }

        this.locked = true;

        if(this.subs[type]) {
            for(var cb of this.subs[type]) {
                cb(data, this);
            }
        }

        if(this.subs['*']) {
            for(var cb of this.subs['*']) {
                cb(data, this);
            }
        }

        this.locked = false;
    }
}

/**
 * JourneyModel holds information about the journey itself, and can be subscribed
 * to by components
 */
export class JourneyModel extends HModel {

    constructor(segments, gps) {
        super({gps_path: [], segments: []});

        this.segmentcounter = 0; // Count segments as they're added to assign a unique ID

        for(var seg of segments){
            this.addSegment(seg);
        }

        this.state.gps_path = gps;

    }

    /**
     * Get an array of journey segments
     */
    getSegments() {
        return this.state.segments;
    }


    /**
     * The GPS path lists points that the traveller was detected at. These points
     * do not necessarily correspond to segment start/end points.
     * Each point is of the form {time: <timestamp>, point: <location>}
     */
    getGPSPath() {
        return this.state.gps_path;
    }

    setGPSPath(p) {
        this.state.gps_path = p;
    }

    getGPSPathPoints() {
        var p = [];
        for(var point of this.state.gps_path) {
            p.push(point.point);
        }

        return p;
    }

    /**
    * Get a list of points that the journey covered - based on SEGMENTS
    */
    getPath() {
        var path = [];
        var jny = this.state.segments;
        for(var i in jny) {
            path.push(jny[i].getStart());
        }

        return path;
    }

    /**
     * Segments need to make sense within a journey - i.e. the start and end points need to join up with
     * adjacent segments. This method does that resolution.
     * It takes (up to) three segments; B must always be provided, and always has priority. If A or C does
     * not exist (i.e. B is a start or end) then some non-Object should be passed
     *
     * TODO: Presumably those points should also be on the GPS path
     */
    resolveSegments(a, b, c) {

        // Resolve A with B
        if(typeof a === 'object' && a !== null) {

            if(typeof b.getStart() !== 'undefined') { // Prefer tthe start from the new segment
                a.setEnd(b.getStart());
            } else if(typeof a.getEnd() !== 'undefined') { // Else try the end of the previous one
                b.setStart(a.getEnd());
            } else { // Otherwise it's a mystery
                throw("Cannot add a segment with no start after a segment with no end");
            }

        }

        // B with C
        if(typeof c === 'object' && c !== null) {
            if(typeof b.getEnd() !== 'undefined') { // Prefer the end from the new segment
                c.setStart(b.getEnd());
            } else if(typeof c.getStart() !== 'undefined') { // Else try the start of the next one
                b.setEnd(c.getStart());
            } else { // Otherwise maybe it's an end segment
                throw("Cannot add a segment with no end before a segment with no start");
            }
        }
    }

    /**
     * Add a segment
     */
     insertSegmentAt(position, segment) {

         this.segmentcounter++;
         console.log("Insert a new segment with UID", this.segmentcounter, this);

         segment.setUID(this.segmentcounter);

         // Splice into list and update adjacent segments
         this.state.segments.splice(position, 0, segment);

         // Resolve segments
         this.resolveSegments(this.state.segments[position-1], this.state.segments[position], this.state.segments[1*position+1]);

         // Add/update an explicit position number on each segment and bind to this journey
         var p = 0;
         for(var seg of this.state.segments) {
             seg.setPosition(p);
             seg.setJourney(this);
             p++;
         }

         // Listen for changes on segments so that adjacent ones can be updated
         segment.subscribe('change-start', this.onSegmentChange);
         segment.subscribe('change-end', this.onSegmentChange);

         this.emit('segment-add');
     }

     addSegment(segment) {
         this.insertSegmentAt(this.state.segments.length, segment);
     }


    /**
    * Delete a segment
    */
    deleteSegment(position) {
        this.state.segments.splice(position, 1);
        console.log("Removed segment", position, this.state.segments);

        // Renumber segments
        var p = 0;
        for(var seg of this.state.segments) {
            seg.setPosition(p);
            p++;
        }

        this.resolveSegments(this.state.segments[position-1], this.state.segments[position]);
        this.emit('segment-delete');
    }


    /**
    * Resolve segment changes
    */
    onSegmentChange(data, seg) {
        var p = seg.getPosition();
        this.resolveSegments(this.state.segments[p-1], this.state.segments[p], this.state.segments[1*p+1]);
    }

}


export class JourneyModelSegment extends HModel {

    constructor(state) {
        super(state);
    }

    getUID() {
        return this.state.uid;
    }

    setUID(uid) {
        this.state.uid = uid;
    }

    getStart() {
        return this.state.start;
    }

    getEnd() {
        return this.state.end;
    }

    getMode() {
        return this.state.mode;
    }


    getJourney() {
        return this.journey;
    }

    setJourney(journey) {
        this.journey = journey;
    }

    getPosition() {
        return this.position;
    }

    setPosition(position){
        if(this.state.position === position)
            return;

        this.position = position;
    }

    setMode(mode) {

        if(this.state.mode === mode)
            return;

        this.state.mode = mode;
        this.emit('change-mode');
    }

    setStart(start) {

        if(this.state.start === start)
            return;

        this.state.start = start;
        this.emit('change-start');
    }

    setEnd(end) {

        if(this.state.end === end)
            return;

        this.state.end = end;
        this.emit('change-end');
    }

}
