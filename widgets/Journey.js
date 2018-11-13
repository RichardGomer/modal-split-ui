import React from 'react';
import {Segment, EndSegment} from './Segment'

export default class Journey extends React.Component {
    constructor(props) {
        super(props);

        // Build the journey from the supplied JSON
        var jny  = props.journey;
        var segs = [];
        for(var i in jny){
            var seg = jny[i];
            if(!seg.end && (!seg.mode || !seg.start)) {
                console.error("Each segment needs either a mode and start point, or an end point", seg);
            } else {
                segs.push(seg);
            }
        }

        // Convert journey to a path for plotting on the map
        var path = [];
        for(var i in props.journey) {
            if(props.journey[i].start)
                path.push(props.journey[i].start);
            else
                path.push(props.journey[i].end);
        }

        this.state = {segments: segs, path: path};
    }

    render() {

        const segs = [];
        for(var i in this.state.segments) {
            var s = this.state.segments[i];
            if(s.start){
                segs.push(<Segment key={i} start={s.start} mode={s.mode} path={this.state.path} onModeChange={() => {}}></Segment>);
            }
        }

        segs.push(<EndSegment key={i+1} start={s.end} path={this.state.path} />)

        return ( <div>
                    {segs}
                </div> );
    }
}
