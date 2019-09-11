
import HModel from './HModel';
import JourneyModel from './JourneyModel'
import GeoPlus from '../geometry';
import autoBind from 'auto-bind';
import hri from 'human-readable-ids';


export default class JourneyModelSegment extends HModel {

    constructor(state) {
        super(state);

        this.state.destination = typeof state.destination == 'undefined' ? this.state.mode === 'end' : state.destination;

        if(typeof this.state.identifier == 'undefined')
            this.state.identifier = hri.hri.random();

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

        //console.log("Set position", position);

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

        // Sometimes end segments can be converted to journey segments,
        // and we need to set a valid mode!
        if(!this.state.destination && this.state.mode == 'end')
            this.setMode('walk');

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

    // Get the identifier
    getIdentifier() {
        return this.state.identifier;
    }

    // Mark this segment as containing a deliberate error
    setError(desc) {
        this.state.error = true;
        this.state.errorDesc = desc;
        this.journey.addError(desc); // Also record error on journey; segments can go missing!
    }

    isError() {
        return this.state.error;
    }

    getError() {
        return this.state.errorDesc;
    }

}
