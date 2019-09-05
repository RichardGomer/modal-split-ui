import React from 'react';
import {withLeaflet, FeatureGroup, LayersControl, Map, Marker, Polyline, TileLayer, Tooltip, Popup} from 'react-leaflet';
import autoBind from 'auto-bind';
import geometry from '../geometry';

export default class CompareMap extends React.Component {
    constructor(props) {
        super(props);

        this.state = {a: props.a, b: props.b};

        autoBind(this);
    }

    // Rander a journey as a series of markers and PolyLines
    renderJourney(m, color) {
        var points = [];
        var markers = [];

        var count = 0;
        for(var s of m.getSegments()){
            count++;
            points.push(s.getStart().split(/,/));
            markers.push(
                <Marker position={s.getStart().split(/,/)} opacity="0.5" draggable="false">
                    <Tooltip>{count}</Tooltip>
                </Marker>
            );
        }

        console.log("Journey points", points);

        return (
            <FeatureGroup color={color}>
                <Polyline positions={points} />
                {markers}
            </FeatureGroup>
        )
    }


    render() {

        function toPoints(arr){
            return arr.map(function(i){
                return i.split(/,/);
            });
        }

        // In theory the GPS traces from the journeys in our comparison case should be the same, so just render the first
        var tracepoints = toPoints(this.state.a.getGPSPathPoints());

        var journeys = [this.renderJourney(this.state.a, "red"), this.renderJourney(this.state.b, "green")];

        var c = tracepoints[Math.floor(tracepoints.length / 2)];
        console.log(c, tracepoints);

        var map = (
            <Map zoom="9" center={c}>
                <TileLayer
                  attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FeatureGroup color="blue">
                    <Polyline positions={tracepoints} />
                </FeatureGroup>

                {journeys}

            </Map>
        );

        return map;
    }
}
