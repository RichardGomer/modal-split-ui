#!/bin/sh
":" //# http://sambal.org/2014/02/passing-options-node-shebang-line/; exec /usr/bin/env node --harmony --experimental-modules "$0" "$@"


/**
 * Compare journeys, given json input
 */
import fs from 'fs';
import JSON from 'JSON';

import { JourneyModel, JourneyModelSegment } from '../model'

import JourneyDiff from './JourneyDiff'

const [,, ...args] = process.argv;

if(args.length < 2) {
    console.error("USAGE: compare.js journey1.json journey2.json");
    console.log("JSON can either be raw, or processed; format is auto-detected.");
    console.log("All Journeys are loaded as JourneyModel objects");
    process.exit();
}

var fn1 = args[0];
var fn2 = args[1];

if(!fs.existsSync(fn1)) {
    console.error(fn1 + " was not found");
    process.exit();
}

if(!fs.existsSync(fn2)) {
    console.error(fn2 + " was not found");
    process.exit();
}


// Load some JSON, check whether it's raw or processed, and load it into a JourneyModel as appropriate
function loadJny(json) {
    var ob = JSON.parse(json);

    if(ob.segments) {
        return JourneyModel.import(ob);
    } else {
        return JourneyModel.fromJSON(ob);
    }
}

console.log("== Load ", fn1);
var json1 = fs.readFileSync(fn1);
var jny1 = loadJny(json1);
var txt1 = JourneyDiff.JourneyToText(jny1);
console.log(txt1);

console.log("== Load ", fn2);
var json2 = fs.readFileSync(fn2);
var jny2 = loadJny(json2);
var txt2 = JourneyDiff.JourneyToText(jny2);
console.log(txt2);


var diff = JourneyDiff.diff(txt1, txt2);
console.log("=== Diff ===");

diff.forEach(function(part){
    //console.log(part);
})

diff.forEach(function(part){

  // green for additions, red for deletions
  // grey for common parts
    var color = part.added ? "\x1b[32m" : // green
        part.removed ? "\x1b[31m" : "\x1b[37m"; // red / white

    var status = part.added ? " [NEW]" : // green
        part.removed ? " [REMOVED]" : " [MATCH]"; // red / white

    for(var l of part.value.split("\n")) {
        if(l.trim().length > 0)
            process.stdout.write(color + l + "\n");
    }

});

console.log("");
