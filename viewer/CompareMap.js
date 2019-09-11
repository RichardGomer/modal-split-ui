import React from 'react';
import {withLeaflet, FeatureGroup, LayersControl, Map, CircleMarker, Marker, Polyline, TileLayer, Tooltip, Popup} from 'react-leaflet';
import autoBind from 'auto-bind';
import GeoPlus from '../geometry';

export default class CompareMap extends React.Component {
    constructor(props) {
        super(props);

        /**
        a: Error-fied journey
        b: corrected journey
        o: Original (pre-error) journey
        */
        this.state = {cmodel: props.model, focus: props.model.getFocus()};

        // Sub to focus change...
        var self = (this);
        this.state.cmodel.subscribe('change-focus', function(){
            self.setState({focus: self.state.cmodel.getFocus()})
        })

        autoBind(this);
    }



    // Render a journey as a series of markers and PolyLines
    renderJourney(m, color, size, name, extended) {
        var points = [];
        var markers = [];
        var lines = [];

        extended = extended == true;

        var count = 0;
        for(var s of m.getSegments()){
            count++;
            var k = name + '_' + s.getIdentifier();
            points.push(s.getStart().split(/,/));

            var classification = this.state.cmodel.classify(s);
            var mode = s.getMode();

            // If requestyed, render detailed segment information as a popup
            if(extended) {
                var p = <Popup>{count} <strong>{k}</strong><br />
                {classification}<br />
                {mode}<br />
                </Popup>;
            } else {
                var p = null;
            }

            if(this.state.focus == s) {
                var scolor = "yellow";
                var ssize = 20;
            } else {
                var scolor = color;
                var ssize = size;
            }

            var cmodel = this.state.cmodel;
            var focus = (function(s){
                return function(){
                    cmodel.setFocus(s);
                }
            })(s);

            markers.push(
                <CircleMarker key={k} center={s.getStart().split(/,/)} opacity="0.5" color={scolor} radius={ssize} draggable="false" onClick={focus}>
                    <Tooltip>[{name} {count}] {s.getIdentifier()}</Tooltip>
                    {p}
                </CircleMarker>
            );

            if(s.isDestination()){
                lines.push(<Polyline opacity="0.8" positions={points} />);
                points = [];
            }
        }

        return (
            <FeatureGroup color={color}>
                {lines}
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
        var tracepoints = toPoints(this.state.cmodel.getOriginal().getGPSPathPoints());

        var journeys = [this.renderJourney(this.state.cmodel.getOriginal(), "green", 16, "ORIG"), this.renderJourney(this.state.cmodel.getErrorfied(), "red", 13, "SHOWN"), this.renderJourney(this.state.cmodel.getOutput(), "blue", 10, "CORRECTED", true)];

        var c = tracepoints[Math.floor(tracepoints.length / 2)];
        //console.log(c, tracepoints);

        var map = (
            <Map zoom="12" center={c}>
                <TileLayer
                  attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FeatureGroup color="magenta" opacity="0.5">
                    <Polyline positions={tracepoints} />
                </FeatureGroup>

                {journeys}

            </Map>
        );

        return map;
    }
}
