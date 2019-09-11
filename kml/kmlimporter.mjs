import autoBind from 'auto-bind';

import {JourneyModel,JourneyModelSegment} from '../model'

import xpath from 'xpath'
import XMLDOM from 'xmldom'

const { DOMParser, XMLSerializer } = XMLDOM;

export default class KMLImporter {
    static import(xml){

        var parser = new DOMParser()
        var doc = parser.parseFromString(xml);
        //console.err("Document:\n", (new XMLSerializer()).serializeToString(doc));

        var places = [];

        // Create a namespace-aware xpath selector function
        var nxps = xpath.useNamespaces({"kml": "http://www.opengis.net/kml/2.2"});

        var pms = nxps("//kml:Placemark", doc);
        //console.err("Placemarks:\n", pms);
        for(var p of pms) {
            places.push(new PlaceMark(p, nxps));
        }

        var j = new JourneyModel([]);
        var trace = [];

        if(!places[places.length - 1].isPoint()) {
            console.error("Last Placemark is not a point!");
        }

        // Process each place to create the GPS trace, and segments
        //console.err("Process", places.length, "places");
        var lastSegment, lastLastSegment;

        for(var i in places) {
            var place = places[i];

            i = i*1;
            console.error("[%s] %s %s->%s", i, place.isPoint() ? "STOP   " : "SEGMENT", new Date(place.getStartTime()*1000).toISOString().substr(11,8), new Date(place.getEndTime()*1000).toISOString().substr(11,8));
            console

            // Last point creates the end segment
            // We assume that the last placemark is always a point; is that ok?
            if(places.length == i+1) {
                //console.err(" + End segment");

                var s = new JourneyModelSegment({
                    start: place.getCoOrds()[0],
                    mode: 'end',
                    startTime: place.getStartTime()
                });
                j.addSegment(s);

                var t = place.getStartTime();

                trace.push({
                    point: place.getCoOrds()[0],
                    time: t, // Unix
                    rawtime: new Date(t*1000).toISOString() // ISO
                });
            }
            // Points add information to segments; e.g. making the end of the previous one into a destination
            else if(place.isPoint())
            {
                // Not much we can do with the first place...
                if(typeof lastSegment == 'undefined') {
                    continue;
                }

                // If this point can reasonably be considered a destination...
                if(place.getDuration() > 1800) // More than 30m stay
                {
                    var points = place.getCoOrds();
                    var mode = lastSegment.getMode();
                    var time = place.getStartTime(); // Next segment starts when we leave this point

                    var s = new JourneyModelSegment({
                        start: points[0],
                        mode: mode,
                        destination: true
                    });

                    s.setStartTime(time);

                    lastSegment = s;

                    j.addSegment(s);
                }


            }
            // But segments are what we mostly care about
            else
            {
                var points = place.getCoOrds();
                var mode = place.getMode();
                var time = place.getStartTime();
                var isot = (new Date(time*1000)).toISOString();

                //console.error(isot, mode, points[0]);

                var s = new JourneyModelSegment({
                    start: points[0],
                    mode: mode,
                });

                s.setStartTime(time);

                lastLastSegment = lastSegment;
                lastSegment = s;

                j.addSegment(s);

                for(var point of points) {
                    // TODO: Make a better guess at time
                    trace.push({
                        point: point,
                        time: time, // Unix
                        rawtime: isot // ISO
                    });
                }
            }
        }

        var tidytrace = [];
        for(var i in trace){

        }

        j.setGPSPath(trace);

        return j;
    }


}

/** Wrapper for placemark elements in the KML
    nxps should be a namespace-aware xpath select function, as created by xpath.useNamespaces()
 */
class PlaceMark {
    constructor(el, nxps) {

        this.nxps = nxps;
        this.el = el;

        autoBind(this);
    }

    // Check if this element is a segment
    isSegment() {
        var lstrs = this.nxps('./kml:LineString', this.el);
        //console.err("There are", lstrs.length,"line strings in this segment");
        return lstrs.length > 0;
    }

    // ... or a point
    isPoint() {
        var points = this.nxps('./kml:Point', this.el);
        return points.length > 0;
    }

    // Get the duration of the segment (or length of time at point)
    // in seconds
    getDuration() {
        var s = this.nxps('string(.//kml:TimeSpan//kml:begin)', this.el).trim();
        var e = this.nxps('string(.//kml:TimeSpan//kml:end)', this.el).trim();
        //console.log("Duration:", s, "->", e);
        return Math.round(Date.parse(e) - Date.parse(s)) / 1000;
    }

    getStartTime() {
        var str = this.nxps('string(./kml:TimeSpan/kml:begin)', this.el);
        var ut = Math.round(Date.parse(str)/1000);

        return ut;
    }

    getEndTime() {
        return this.getStartTime() + this.getDuration();
    }

    // Get an array of all co-ordinates
    getCoOrds() {

        if(this.isPoint()) {
            //console.err(" ++ Point co-ordinates");
            var all = this.nxps('string(./kml:Point/kml:coordinates)', this.el);
            var cos = all.match(/-?[0-9\.]+,-?[0-9\.]+/g);
        }

        else if(this.isSegment()) {
            //console.err(" ++ Path co-ordinates");
            var all = this.nxps('string(./kml:LineString/kml:coordinates)', this.el);
            var cos = all.match(/-?[0-9\.]+,-?[0-9\.]+/g);
        }
        else {
            throw "Each PlaceMark should be a point or a segment, but this doesn't seem to be either :-/";
        }

        // They're the wrong way round?!
        for(var i in cos) {
            var c = cos[i].split(/,/);
            cos[i] = c[1] + ',' + c[0];
        }

        return cos;
    }

    // Get mode
    getMode() {
        // <Data name="Category">
        //    <value>On a train</value>
        // </Data>

        var mstr = this.nxps('string(.//kml:Data[@name="Category"]//kml:value//text())', this.el);

        switch(true){
            case /walk/i.test(mstr): return "walk";
            case /bus/i.test(mstr): return "bus";
            case /driving/i.test(mstr): return "car";
            case /cycling/i.test(mstr): return "bike";
            case /train/i.test(mstr): return "train";
        }

        console.error("Can't determine mode from", "'" + mstr + "'", "assume walking");

        return "walk";
    }


}
