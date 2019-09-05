import React from 'react';
import {JourneyModelSegment} from '../model';
const autoBind = require('auto-bind');

import TimePicker from 'react-times';
import 'react-times/css/material/default.css';

export default class SegmentControls extends React.Component {
    constructor(props) {
        super(props);
        autoBind(this);

        var sd = new Date(props.segment.getStartTime() * 1000);

        this.state = {segment: props.segment, hour: sd.getHours(), minute: sd.getMinutes()};

        props.segment.subscribe('change-time', this.updateTime);
    }

    // TODO: Likely need to bind state more granularly to respond to changes
    // that don't trigger a re-render of the whole segment

    delete() {
        this.state.segment.getJourney().deleteSegment(this.state.segment.getPosition());
    }

    toggleDest(e) {
        this.state.segment.setDestination(e.target.checked);
    }

    setTime(options) {
        console.log("Set time", options, "starting with", this.state.segment.getStartTime());

        // We take date from the original timestamp
        var current = this.state.segment.getStartTime() ? Math.round(this.state.segment.getStartTime() / 60) * 60 * 1000 : 0;
        var od = new Date(current);
        od.setHours(options.hour,options.minute,0);
        console.log("Date", od);

        var ts = Math.round(od.getTime() / 1000);

        this.state.segment.setStartTime(ts);
    }

    updateTime() {
        var sd = new Date(this.state.segment.getStartTime() * 1000);
        this.setState({hour: sd.getHours(), minute: sd.getMinutes()});
    }

    timestr(timestamp) {
        var d = new Date(Math.round(timestamp / 60) * 60 * 1000);
        return d.getHours().toString().padStart(2,0) + ":" + d.getMinutes().toString().padStart(2,0);
    }

    render() {

        // Pick an icon to indicate the type of segment
        var ic = this.state.segment.isOrigin() ? 'origin' : (this.state.segment.isDestination() ? 'destination' : 'change');

        // Most segments get a delete button
        // TODO: Maybe first and last segs shouldn't be deletable?
        var del = <button onClick={this.delete} className="delete">
            <span className="fas fa-trash"></span>
        </button>

        // Origin segments don't get a toggle, because they're just implied by
        // the previous segment
        var toggle = this.state.segment.isOrigin() ? null :
        <div className="destToggle">
            <span className="loption">{window.strings.change}</span>
            <div className="inner" onClick={function(e){if(e.target != e.currentTarget) return; e.target.childNodes[0].click()}}>
                <input type="checkbox" defaultChecked={this.state.segment.isDestination()} onChange={this.toggleDest} />
                <span className="toggle"></span>
            </div>
            <span className="roption">{window.strings.destination}</span>
        </div>

        // Origins and destinations have the option to set time manually
        var s_time = this.state.hour + ":" + this.state.minute;
        var time = this.state.segment.isOrigin() || this.state.segment.isDestination() ? <div className="time">
            <TimePicker
                colorPalette="light" // main color, default "light"
                time={s_time}
                theme="material"
                timeMode="24" // use 24 or 12 hours mode, default 24
                onTimeChange={this.setTime}
              />
        </div> : null;

        return (
            <div className="SegmentControls">
                <span className={"icon icon-" + ic}></span>
                {time}
                {toggle}

                {del}
            </div>
        );
    }
}
