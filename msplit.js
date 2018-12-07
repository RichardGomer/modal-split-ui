import React from 'react';
import ReactDOM from 'react-dom';
import Journey from './widgets/Journey'
import VertMap from './widgets/VertMap'
import {JourneyModel, JourneyModelSegment} from './model.js'

console.log("Begin");

const domContainer = document.querySelector('#journeyui');

/*
 * Hardcoded journey
 */

/*
var points = {
    'rgdesk': '50.936626,-1.395870',
    'jubilee': '50.933989,-1.396256',
    'church': '50.929729,-1.394840',
    'sainsburys': '50.926881,-1.390515'
}

var time = 1544030850;

var journey = new JourneyModel([
    new JourneyModelSegment({mode: 'walk', start: points.rgdesk}),
    new JourneyModelSegment({mode: 'bus', start: points.jubilee}),
    new JourneyModelSegment({start: points.sainsburys})
], [
    {time: time, point: points.rgdesk},
    {time: time + 312, point: points.jubilee},
    {time: time + 520, point: points.church},
    {time: time + 732, point: points.sainsburys}
]);

ReactDOM.render(<Journey journey={journey} />, domContainer);
*/

/**
 * Journey from JSON
 */
var jnys = {};
jnys['good-trip-bad-mode'] = require("./test/journeys/GoodTripBadModeTag/inferred_trip.json");
jnys['over-seg-1'] = require("./test/journeys/OverSegmentation-1/inferred_trip.json");
jnys['over-seg-2'] = require("./test/journeys/OverSegmentation-2/inferred_trip.json");
jnys['under-seg-1'] = require("./test/journeys/UnderSegmentation-1/inferred_trip.json");
jnys['under-seg-2'] = require("./test/journeys/UnderSegmentation-2/inferred_trip.json");
jnys['wrong-mode-change-point'] = require("./test/journeys/WrongModeChangePoint/inferred_trip.json");
jnys['wrong-start-stop'] = require("./test/journeys/WrongStartStopPoints/inferred_trip.json");

/**
 * Convert Luis' JSON into a Journey Object
 */
function JourneyFromJSON(raw) {
    const j = new JourneyModel([]);
    const points = []; // This is the list of points to show as the GPS trace

    function strpoint(pt){
        return pt[1].toString() + ',' + pt[0].toString();
    }

    function iso2unix(date){
        const d = new Date(date);
        return d.value / 1000;
    }

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

        info = {
            start: rawseg['geometry']['coordinates'][0],
            end: rawseg['geometry']['coordinates'][1],
            mode: rawseg['properties']['mode']
        }

        gpspoints.push({
            time: iso2unix(rawseg['properties']['timestamp-end']),
            point: strpoint(info.start)
        });

        // When mode changes, add the previous the segment
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

    // Add a final segment containing the end point
    if(info !== false) {
        j.addSegment(new JourneyModelSegment({
            start: strpoint(info.end),
            mode: 'end'
        }));

        gpspoints.push({
            time: iso2unix(rawseg['properties']['timestamp-start']),
            point: strpoint(info.end)
        })
    }

    j.setGPSPath(gpspoints);

    return j;
}

function update() {
    var hash = document.location.hash.replace('#', '');
    if(hash.length < 1) {
        document.getElementById('journeyui').innerHTML = "<strong>Specify test case in hash</strong>";
        return;
    }

    console.log("Display journey", hash, jnys[hash]);

    var journey = JourneyFromJSON(jnys[hash]);

    ReactDOM.render(<Journey journey={journey} />, domContainer);
}

window.onhashchange = update;

update(); // Run on load
