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
        return Math.floor(d.valueOf() / 1000);
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
            mode: rawseg['properties']['mode'],
            endtime: iso2unix(rawseg['properties']['timestamp-end']),
            rawendtime: rawseg['properties']['timestamp-end']
        }

        gpspoints.push({
            time: info.endtime,
            rawtime: info.rawendtime,
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
            time: info.endtime,
            rawtime: info.rawendtime,
            point: strpoint(info.end)
        })
    }

    console.log("GPS Path for Journey", gpspoints);

    j.setGPSPath(gpspoints);

    return j;
}

$().ready(function(){

    $.urlParam = function(name){
    	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);

        if(results == null)
            return null;

    	return results[1] || null;
    }

    function update() {
        var file = $.urlParam('f');

        ReactDOM.unmountComponentAtNode(domContainer);

        if(file == null) {

            document.getElementById('journeyui').innerHTML = "<strong>Specify journey file in f</strong>";
            return;
        }

        // Fetch the JSON and render it
        $.get(file, {}, function(json){


            console.log("Fetched journey", json);

            var journey = JourneyFromJSON(json);


            var saveAnswer = function(jny) {
                //console.log("Journey was updated", jny);
                var json = JSON.stringify(jny);
                console.log("Journey was updated", json);

                // Post journey to quickstore
                $.post('http://qrowdlab.websci.net/quickstore/', {k: file, v: json});
            }

            ReactDOM.render(<Journey journey={journey} onAnswerUpdated={saveAnswer} />, domContainer);
        }, 'json');
    }

    update(); // Run on load

});
