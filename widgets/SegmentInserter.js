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
        console.log("Insert segment");
        var newseg = new JourneyModelSegment({mode: this.state.segment.getMode(), start: this.state.segment.getEnd()});
        var pos = this.state.segment.getPosition() + 1;
        console.log("Manual segment insertion after", this.state.segment," at position", pos, newseg);
        this.state.segment.getJourney().insertSegmentAt(pos, newseg);
    }


    render() {

        return (
            <div className="SegmentInserter" onClick={this.insert}>
                <span>+ {window.strings.addpoint}</span>
            </div>
        );
    }
}
