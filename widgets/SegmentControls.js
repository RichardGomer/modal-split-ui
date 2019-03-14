import React from 'react';
import {JourneyModelSegment} from '../model';
const autoBind = require('auto-bind');

export default class SegmentControls extends React.Component {
    constructor(props) {
        super(props);
        autoBind(this);

        this.state = {segment: props.segment};
    }



    delete() {
        this.state.segment.getJourney().deleteSegment(this.state.segment.getPosition());
    }


    render() {

        return (
            <div className="SegmentControls">
                <button onClick={this.delete} className="delete">
                    <span className="fas fa-trash"></span>
                </button>
            </div>
        );
    }
}
