#!/bin/sh
":" //# http://sambal.org/2014/02/passing-options-node-shebang-line/; exec /usr/bin/env node --harmony --experimental-modules "$0" "$@"


/**
 * Load journey, add deliberate errors
 */
import fs from 'fs';
import JSON from 'JSON';

import { JourneyModel, JourneyModelSegment } from '../model'

import BadPointInserter from './errors/badpoint';
import OverSegmentationInserter from './errors/oversegment';
import UnderSegmentationInserter from './errors/undersegment';
import BadModeInserter from './errors/badmode';

const [,, ...args] = process.argv;

if(args.length < 1) {
    console.error("USAGE: adderrors.mjs journey.json");
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

// Decide how many errors
var jlen = jny1.getSegments().length;
var numerrs = 0.3 * jlen;
console.error("Journey length is %i, adding %i errors", jlen, numerrs);

// Pick the types, at random
function pickRand(array){
    var k = floor(Math.random() * array.length);
    return array[k];
}

// Bad point / bad mode errors are inserted
var errclasses = {'badpoint': 0, 'badmode': 0}
var types = Object.keys(errclasses);
for(var i = 0; i < numerrs; i++) {
    var type = types[Math.floor(Math.random() * types.length)];
    errclasses[type]++;
}

// Then we either undersegment OR oversegment; not both!
// Rationale: We wish to understand which is preferable, so prefer to keep the cases distinct
if(Math.random() > 0.5) {
    errclasses['overseg'] = numerrs;
} else {
    errclasses['underseg'] = numerrs;
}

// Insert errors on chosen segments

// Bad points need to be on real changes if possible!
for(var i = 0; i < errclasses['badpoint']; i++){
    new BadPointInserter().apply(jny1);
}

for(var i = 0; i < errclasses['overseg']; i++){
    new OverSegmentationInserter().apply(jny1);
}

for(var i = 0; i < errclasses['underseg']; i++){
    new UnderSegmentationInserter().apply(jny1);
}

// Bad modes can go anywhere
for(var i = 0; i < errclasses['badmode']; i++){
    new BadModeInserter().apply(jny1);
}

process.stdout.write(JSON.stringify(jny1.export()));
