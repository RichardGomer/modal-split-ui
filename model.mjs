/**
 * A model for the modal shift UI
 *
 * It's not quite flux because it's pretty simple, but could be replaced
 * with a full flux model fairly easily.
 */

import GeoPlus from './geometry';

import autoBind from 'auto-bind';

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
     * Convert Luis' JSON into a JourneyModel Object
     */
    static fromJSON(raw) {

        const j = new JourneyModel([]);
        const points = []; // This is the list of points to show as the GPS trace

        function strpoint(pt){
            return pt[1].toString() + ',' + pt[0].toString();
        }

        function iso2unix(date){
            const d = new Date(date);
            return Math.floor(d.valueOf() / 1000);
        }

        //console.debug("Assembling Journey...");

        var segstart = false;
        var segmode = false;

        var info = false;

        var gpspoints = [];

        if(typeof raw["features"] === 'undefined') {
            console.error("Journey JSON does not contain 'features' array");
            return;
        }

        for(var rawseg of raw["features"]) {

            if(typeof rawseg !== 'object' || !rawseg['geometry'] || rawseg['geometry']['type'] !== 'LineString')
                continue;

            // Extract the useful info from the raw segment
            info = {
                start: rawseg['geometry']['coordinates'][0],
                end: rawseg['geometry']['coordinates'][1],
                mode: rawseg['properties']['mode'],
                endtime: iso2unix(rawseg['properties']['timestamp-end']),
                rawendtime: rawseg['properties']['timestamp-end']
            }

            // Add the point to the GPS trace
            gpspoints.push({
                time: info.endtime,
                rawtime: info.rawendtime,
                point: strpoint(info.start)
            });

            // When the mode changes, we add a new journey segment to the model
            //console.debug(" + Mode is " + info.mode);
            if(segmode !== info.mode) {
                if(segstart !== false) {
                    j.addSegment(new JourneyModelSegment({
                        start: strpoint(segstart),
                        mode: segmode
                    }));
                }

                // Data from current segment becomes the start of a new segment
                segstart = info.start;
                segmode = info.mode;
            }
        }

        // Finish the journey by adding the last detected segment...
        if(segstart !== false) {
            j.addSegment(new JourneyModelSegment({
                start: strpoint(segstart),
                mode: segmode
            }));
        }

        // ...and then a final segment containing the end point
        if(info !== false) {
            //console.debug(" + Adding final segment");
            j.addSegment(new JourneyModelSegment({
                start: strpoint(info.end),
                mode: 'end'
            }));

            gpspoints.push({
                time: info.endtime,
                rawtime: info.rawendtime,
                point: strpoint(info.end)
            })
        }

        j.setGPSPath(gpspoints);

        return j;
    }

    /**
     * Import a previously exported Journey
     */
    static import(exported) {
        var jny = new JourneyModel([]);
        jny.setGPSPath(exported.gps);

        for(var i in exported.segments) {
            var seg = exported.segments[i];
            //console.log(" + Add segment", seg);
            jny.addSegment(new JourneyModelSegment({
                start: seg.start,
                mode: seg.mode,
                end: seg.end
            }))
        }

        return jny;
    }

    /**
     * Get the journey as a serializable object
     */
    export() {
        var out = {};

        var segs = this.getSegments();
        var segments = [];
        for(var s of segs) {
            segments.push({
                start: s.getStart(),
                end: s.getEnd(),
                start_time: s.getStartTime(),
                end_time: s.getEndTime(),
                mode: s.getMode()
            });
        }

        out.gps = this.getGPSPath();
        out.segments = segments;

        return out;
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

            if(typeof b.getStart() !== 'undefined') { // Prefer the start from the new segment
                a.setEnd(b.getStart());
            } else if(typeof a.getEnd() !== 'undefined') { // Else try the end of the previous one
                b.setStart(a.getEnd());
            } else { // Otherwise it's a mystery
                console.trace();
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
         //console.log("Insert a new segment with UID", this.segmentcounter, this);

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

         var j = this;
         segment.subscribe('*', function(){
             j.emit('segment-change');
         })

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

    /**
     * Based on known points, work out a rough start time
     * TODO: If two nearest points are reasonably far apart, split the difference to
     * guess an intermediate time
     */
    getStartTime() {
        return this.getTimeAtPoint(this.state.start);
    }

    getEndTime() {

        if(this.state.mode === 'end')
            return this.getStartTime();

        return this.getTimeAtPoint(this.state.end);
    }

    // Get the time at an arbitrary point
    getTimeAtPoint(point) {
        // 1: Find the closest GPS point
        var pointk = GeoPlus.closestPointInArray(GeoPlus.parsePoint(point), GeoPlus.parsePoint(this.getJourney().getGPSPathPoints()));

        if(typeof pointk === 'undefined')
            return "";

        var npoint = this.getJourney().getGPSPath()[pointk];
        return npoint.time;
    }

}
