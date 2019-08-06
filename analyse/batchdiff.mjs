#!/bin/sh
":" //# http://sambal.org/2014/02/passing-options-node-shebang-line/; exec /usr/bin/env node --harmony --experimental-modules "$0" "$@"


/**
 * Compare journeys, given json input
 */
import fs from 'file-system';
import JSON from 'JSON';

import { JourneyModel, JourneyModelSegment } from '../model'

import JourneyDiff from './JourneyDiff'
import JourneyComparator from './JourneyComparator'

const [,, ...args] = process.argv;

if(args.length < 3) {
    console.error("USAGE: batchdiff.mjs in_dir out_dir output_dir");
    console.log("JSON can either be raw, or processed; format is auto-detected.");
    process.exit();
}

var fn1 = args[0];
var fn2 = args[1];
var fn3 = args[2];

if(!fs.existsSync(fn1)) {
    console.error(fn1 + " was not found");
    process.exit();
}

if(!fs.existsSync(fn2)) {
    console.error(fn2 + " was not found");
    process.exit();
}

if(!fs.existsSync(fn3)) {
    console.error(fn3 + " was not found");
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

var dir_in = fn1;
var dir_out = fn2;
var dir_output = fn3;

// Make a list of all output files
var outfiles = [];
fs.recurseSync(dir_out, function(filepath, relative, filename){
    if(!filename) return;

    outfiles.push(filepath);
});

console.log("Found output files", outfiles);


// 1: For a file in the input dir, find the output
fs.recurseSync(dir_in, function(filepath, relative, filename) {

    if(!filename) return;

    console.log("In: ", relative);

    var infile = filepath;

    // Find an output file
    var matchpath = relative.replace(/[^a-z0-9]/ig, '_');
    var matched = false;
    for(var outfile of outfiles){
        if(outfile.indexOf(matchpath) >= 0) {
            matched = outfile;
            break;
        }
    }


    var RED = "\x1b[31m";
    var GREEN = "\x1b[32m";
    var WHITE = "\x1b[37m";

    if(!matched) {
        console.error(RED + "Could not match ", infile, " to an output file", matchpath, WHITE);
        return;
    } else {
        console.log(GREEN + "Matched ", matched, outfile, WHITE)
    }

    // 2: Load the files and compare
    console.log("== Load ", infile);
    var json1 = fs.readFileSync(infile);
    var jny1 = loadJny(json1);

    console.log("== Load ", outfile);
    var json2 = fs.readFileSync(outfile);
    var jny2 = loadJny(json2);

    //var jc = new JourneyComparator(jny1, jny2, 100);

    // Simple line-by-line diff comparison
    var txt1 = JourneyDiff.JourneyToText(jny1);
    var txt2 = JourneyDiff.JourneyToText(jny2);
    var diff = JourneyDiff.diff(txt1, txt2);

    // 3: Write comparison file
    var out = "In: " + infile + "\nOut: " + outfile + "\n\n";
    out += "== In ==\n" + txt1;
    out += "\n\n== Out ==\n" + txt2;
    out += "\n\n== Diff ==\n";

    diff.forEach(function(part){

      // green for additions, red for deletions
      // grey for common parts
        var status = part.added ? " + " : // green
            part.removed ? " - " : "   "; // red / white

        for(var l of part.value.split("\n")) {
            if(l.trim().length > 0)
                out += (status + l + "\n");
        }

    });

    fs.writeFileSync(dir_output + matchpath + '.txt', out);

}); // End fs.recurse

console.log("");
