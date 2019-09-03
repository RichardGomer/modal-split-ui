import React from 'react';
import ModeRibbon from './ModeRibbon'
import VertMap from './VertMap'
import SegmentControls from './SegmentControls'

const autoBind = require('auto-bind');

export class Segment extends React.Component {
    constructor(props) {
        super(props);

        autoBind(this);

        var s = props.segment;

        if(typeof this.props.snapping == 'undefined') {
            this.snapping = true;
        } else {
            this.snapping = props.snapping == true;
        }

        var final = s.isDestination();

        this.state = {segment: s, point: s.getStart(), startTime: s.getStartTime(), path: s.getJourney().getGPSPathPoints(), mode: s.getMode(), final: final};
        s.subscribe("change-start", this.update);
        s.subscribe("change-path", this.update);
        s.subscribe("change-destination", this.update);
        s.subscribe("change-time", this.update);
    }



    // Copy state from segment
    update() {
        var s = this.state.segment;
        var final = s.isDestination();
        console.log("Start time is ", s.getStartTime());
        this.setState({point: s.getStart(), startTime: s.getStartTime(), path: s.getJourney().getGPSPathPoints(), mode: s.getMode(), final: final});
    }

    // Wait for the point to change
    setPoint(point) {
        console.log("Point moved", point);
        this.state.segment.setStart(point.lat() + "," + point.lng());
    }

    setMode(mode) {
        this.state.segment.setMode(mode);
    }

    timestr(timestamp) {
        if(timestamp === false) {
            return "";
        }

        var d = new Date(Math.round(timestamp / 60) * 60 * 1000);
        return d.getHours().toString().padStart(2,0) + ":" + d.getMinutes().toString().padStart(2,0);
    }


    render() {

        if(this.state.segment.isOrigin()) {
            return (
                // Origin points have controls at the top
                <div className="Segment">
                    <ModeRibbon onModeChange={this.setMode} mode={this.state.mode} />
                    <div className="stopinfo">
                        <span className="timestamp">{this.timestr(this.state.startTime)}</span>
                        <p>{window.strings.started}</p>
                        <SegmentControls segment={this.state.segment} />
                        <div className="MapOuter"><VertMap onMove={e => this.setPoint(e)} point={this.state.point} path={this.state.path} snapping={this.snapping} /></div>
                    </div>
                </div>
            );
        }
        // Destinations need a destination segment but no mode ribbon
        else if(this.state.final) {
            return (
                <div className="EndSegment">
                    <div className="stopinfo">
                        <span className="timestamp">{this.timestr(this.state.startTime)}</span>
                        <div className="MapOuter"><VertMap onMove={this.setPoint} point={this.state.point} path={this.state.path} snapping={this.snapping} /></div>
                        <p>{window.strings.arrived}</p>
                        <SegmentControls segment={this.state.segment} />
                    </div>
                </div>
                );
        } else {
            return (
                <div className="Segment">
                    <ModeRibbon onModeChange={this.setMode} mode={this.state.mode} />
                    <div className="stopinfo">
                        <span className="timestamp">{this.timestr(this.state.startTime)}</span>
                        <div className="MapOuter"><VertMap onMove={e => this.setPoint(e)} point={this.state.point} path={this.state.path} snapping={this.snapping} /></div>
                        <SegmentControls segment={this.state.segment} />
                    </div>
                </div>
            );
        }
    }
}
