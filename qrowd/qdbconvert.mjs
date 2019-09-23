#!/bin/sh
":" //# http://sambal.org/2014/02/passing-options-node-shebang-line/; exec /usr/bin/env node --harmony --experimental-modules "$0" "$@"


/**
 * Load journey, add deliberate errors
 */
import fs from 'fs';
import JSON from 'JSON';

import { JourneyModel, JourneyModelSegment } from '../model'

const [,, ...args] = process.argv;

if(args.length < 1) {
    console.error("USAGE: qdbconvert.mjs journey.json");
    process.exit();
}

var fn1 = args[0];

if(!fs.existsSync(fn1)) {
    console.error(fn1 + " was not found");
    process.exit();
}

// Load some JSON; must be in our native format
function loadJny(json) {
    var ob = JSON.parse(json);

    return JourneyModel.import(ob);
}

console.error("Loaded %s", fn1);
var json1 = fs.readFileSync(fn1);
var jny1 = loadJny(json1);

console.error("Loaded OK");

var records = [];
// Convert each segment; origin segments also create a meta/"multi" record
var segs = jny1.getSegments();
var meta = {};
for(var i in segs) {
    var s = segs[i];
    console.error("Process segment %i", i);

     // We can mostly skip destinations because the end point already exists in the prior segment
    if(s.isDestination()) {

        // The arrival time is useful, though; update the end time of the prior segment
        console.log("+ is a destination")
        var last = records[records.length - 1];
        last.endTime = s.getStartTime();
        meta.endTime = s.getStartTime();

        // And add the final point to the meta path
        meta.path.push(s.getStart());

        continue;
    }


    // Origins create a new meta record
    if(s.isOrigin()) {
        console.log("+ is an origin");
        meta = {
            path: [],
            multi: true,
            mode: 'multi',
            startTime: s.getStartTime()
        };

        records.push(meta);
    }

    var r = {
        path: [s.getStart(), s.getEnd()],
        mode: s.getMode(),
        multi: false,
        startTime: s.getStartTime(),
        endTime: s.getEndTime()
    };

    meta.path.push(s.getStart());

    records.push(r);
}

process.stdout.write(JSON.stringify(records, null, 2));
