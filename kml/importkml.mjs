#!/bin/sh
":" //# http://sambal.org/2014/02/passing-options-node-shebang-line/; exec /usr/bin/env node --harmony --experimental-modules "$0" "$@"


/**
 * Compare journeys, given json input
 */
import fs from 'fs';
import JSON from 'JSON';

import { JourneyModel, JourneyModelSegment } from '../model'

import KMLImporter from './kmlimporter'

const [,, ...args] = process.argv;

if(args.length < 1) {
    console.error("USAGE: importkml.js journey.kml");
    process.exit();
}

var fn1 = args[0];

if(!fs.existsSync(fn1)) {
    console.error(fn1 + " was not found");
    process.exit();
}

var xml = fs.readFileSync(fn1, {encoding: 'utf8'});
//console.log(xml);
var j = KMLImporter.import(xml);

process.stdout.write(JSON.stringify(j.export()));

console.log("");
