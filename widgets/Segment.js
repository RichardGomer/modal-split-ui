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

        var final = s.getPosition() === (s.getJourney().getSegments().length - 1);

        this.state = {segment: s, point: s.getStart(), startTime: s.getStartTime(), path: s.getJourney().getGPSPathPoints(), mode: s.getMode(), final: final};
        s.subscribe("change-start", this.update);
        s.subscribe("change-path", this.update);
    }



    // Copy state from segment
    update() {
        var s = this.state.segment;
        var final = s.getPosition() === (s.getJourney().getSegments().length - 1);
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
        var d = new Date(Math.round(timestamp / 60) * 60 * 1000);
        return d.getHours().toString().padStart(2,0) + ":" + d.getMinutes().toString().padStart(2,0);
    }


    render() {

        if(this.state.segment.getPosition() == 0) {
            return (
                <div className="Segment">
                    <span className="timestamp">{this.timestr(this.state.startTime)}</span>
                    <ModeRibbon onModeChange={this.setMode} mode={this.state.mode} />
                    <div className="MapOuter"><VertMap onMove={e => this.setPoint(e)} point={this.state.point} path={this.state.path} /></div>
                </div>
            );
        }
        else if(this.state.final) {
            return (
                <div className="EndSegment">
                    <span className="timestamp">{this.timestr(this.state.startTime)}</span>
                    <div className="MapOuter"><VertMap onMove={this.setPoint} point={this.state.point} path={this.state.path} /></div>
                </div>
                );
        } else {
            return (
                <div className="Segment">
                    <span className="timestamp">{this.timestr(this.state.startTime)}</span>
                    <ModeRibbon onModeChange={this.setMode} mode={this.state.mode} />
                    <div className="MapOuter">
                        <VertMap onMove={e => this.setPoint(e)} point={this.state.point} path={this.state.path} />
                        <SegmentControls segment={this.state.segment} />
                    </div>
                </div>
            );
        }
    }
}
