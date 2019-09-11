import React from 'react';
import {JourneyModelSegment} from '../model';
const autoBind = require('auto-bind');

export class SegmentInserter extends React.Component {
    constructor(props) {
        super(props);
        autoBind(this);

        this.state = {segment: props.after};
    }



    insert() {
        var j = this.state.segment.getJourney();

        // Normally we use the end of the previous segment; unless it doesn;t have one!
        var s = this.state.segment.getEnd();

        if(typeof s == 'undefined')
            s = this.state.segment.getStart();

        var m = this.state.segment.getMode();
        if(m == 'end')
            m = 'walk'; // Doesn't make sense to add with a mode of 'end'!

        var newseg = new JourneyModelSegment({mode: m, start: s});
        var pos = this.state.segment.getPosition() + 1;
        console.log("Manual segment insertion after", this.state.segment," at position", pos, newseg);
        j.insertSegmentAt(pos, newseg);
    }


    render() {

        return (
            <div className="SegmentInserter" onClick={this.insert}>
                <span>+ {window.strings.addpoint}</span>
            </div>
        );
    }
}
