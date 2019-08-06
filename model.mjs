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
     * Create a blank journey (passed to callback)
     */
    static getBlank(then) {


        var start = '';
        var end = '46.067194,11.121457'; // Trento centre

        // Try to get the start from GPS
        if("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                start = position.coords.latitude.toString() + ',' + position.coords.longitude.toString();
                setup();
            });
        } else { // Or use a predefined location
            start = "46.064900,11.142689"; // Povo-Mesiano, Railway station near Trento
            setup();
        }

        // Creates the journey with start/stop points
        function setup(){
            // Midnight yesterday
            var mny = new Date(Date.now() - 3600 * 24 * 1000);
            mny.setHours(0,0,0,0);

            var j = new JourneyModel([]);
            j.addSegment(new JourneyModelSegment({
                start: start,
                mode: 'walk',
                startTime: mny.getTime() / 1000 + 3600 * 8 // 0800
            }));

            j.addSegment(new JourneyModelSegment({
                start: end,
                mode: 'end',
                startTime: mny.getTime() / 1000 + 3600 * 9 // 0900
            }));

            j.setGPSPath([]);

            then(j);
        }
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
                mode: s.getMode(),
                destination: s.isDestination(),
                origin: s.isOrigin()
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
     *
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
         segment.subscribe('change-destination', this.onSegmentChange);

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

        // In most cases we need to match up the newly adjacent segments
        if(typeof this.state.segments[position]  !== 'undefined')
            this.resolveSegments(this.state.segments[position-1], this.state.segments[position]);

        this.emit('segment-delete');
    }


    /**
     * Resolve segment changes
     */
    onSegmentChange(data, seg) {
        var p = seg.getPosition();
        this.resolveSegments(this.state.segments[p-1], this.state.segments[p], this.state.segments[1*p+1]);

        var n = this.state.segments[p+1];
        if(typeof n != 'undefined')
            n.emit("change-destination");
    }


    // Get the time at an arbitrary point
    getTimeAtPoint(point, tolerance) {

        if(typeof tolerance == 'undefined') {
            tolerance = 1000;
        }

        // 1: Find the closest GPS point
        var npoint = this.getClosestGPSPoint(point);

        if(npoint == "")
            return false;

        if(GeoPlus.distance(point, npoint.point) > tolerance)
            return false;

        return npoint.time;
    }

    getClosestGPSPoint(point) {

        if(this.getGPSPathPoints().length < 1)
            return "";

        var pointk = GeoPlus.closestPointInArray(GeoPlus.parsePoint(point), GeoPlus.parsePoint(this.getGPSPathPoints()));

        if(typeof pointk === 'undefined')
            return "";

        var npoint = this.getGPSPath()[pointk];
        return npoint;
    }

    getStartTime() {
        return this.state.segments[0].getStartTime();
    }

    getEndTime() {
        return this.state.segments[this.state.segments.length - 1].getStartTime();
    }

}

JourneyModel.count = 0; // For giving IDs to journeys


export class JourneyModelSegment extends HModel {

    constructor(state) {
        super(state);

        this.state.destination = this.state.mode === 'end';

        if(typeof this.state.startTime == 'undefined')
            this.state.startTime = false;
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

        if(this.state.mode === 'end') {
            this.state.destination = true;
        }

        this.emit('change-mode');
    }

    setDestination(dest) {
        this.state.destination = dest == true;
        this.emit('change-destination');
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

    // Check if this segment is an "end" point (or destination)
    isDestination() {
        var segs = this.getJourney().getSegments();
        if(this.state.destination || this == segs[segs.length - 1])
            return true;
        else
            return false;
    }

    // Check if this segment is an origin point (i.e. is the first segment, or occurs
    // after an end segment)
    isOrigin() {

        // Rarely, there might be two destinations next to one another; but that doesn't
        // make the second one an origin! i.e. a destination can never be an origin
        if(this.isDestination())
            return false;

        // Normally we need to consult the overall journey
        var segs = this.getJourney().getSegments();
        for(var i in segs) {
            var s = segs[i];
            if(s === this) { // We have to find ourselves, and check the segment before
                if(i == 0) { // First segment
                    return true;
                } else { // Subsequent segments
                    return segs[i-1].isDestination();
                }
            }
        }
    }


    // By default, start time is obtained from the GPS trace; but can be set
    // manually
    setStartTime(time) {
        this.state.startTime = time;
        this.emit('change-time');
    }

    /**
     * Based on known points, work out a rough start time
     */
    getStartTime() {

        if(this.state.startTime !== false)
            return this.state.startTime;

        return this.getTimeAtPoint(this.state.start);
    }

    getEndTime() {

        if(this.isDestination()) // Destinations only have an arrival time
            return this.getStartTime();

        return this.getTimeAtPoint(this.state.end);
    }

    // Get the time at an arbitrary point
    getTimeAtPoint(point, tolerance) {
        return this.getJourney().getTimeAtPoint(point);
    }

    getClosestGPSPoint(point) {
        return this.getJourney().getClosestGPSPoint(point);
    }

}
