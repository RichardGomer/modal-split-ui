import React from 'react';
import ReactDOM from 'react-dom';
import Journey from './widgets/Journey'
import VertMap from './widgets/VertMap'

console.log("Begin");

const domContainer = document.querySelector('#journeyui');

var points = {
    'rgdesk': '50.936626,-1.395870',
    'jubilee': '50.933989,-1.396256',
    'church': '50.929729,-1.394840',
    'sainsburys': '50.926881,-1.390515'
}

var journey = [
    {mode: 'walk', start: points.rgdesk},
    {mode: 'bus', start: points.jubilee},
    {end: points.sainsburys}
];


ReactDOM.render(<Journey journey={journey} />, domContainer);



console.log("Done");
