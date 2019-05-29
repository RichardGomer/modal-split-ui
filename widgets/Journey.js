import React from 'react';
import {Segment} from './Segment';
import {SegmentInserter} from './SegmentInserter';

export default class Journey extends React.Component {
    constructor(props) {
        super(props);

        this.update = this.update.bind(this);

        if(typeof this.props.snapping == 'undefined') {
            this.snapping = true;
        } else {
            this.snapping = props.snapping == true;
        }


        this.state = {journey: props.journey, updates: 0};
        props.journey.subscribe('segment-add', this.update);
        props.journey.subscribe('segment-delete', this.update);

        props.journey.subscribe('*', function(data, jny){
            props.onAnswerUpdated(jny.export())
        });

    }

    update() {
        this.setState({updates: this.state.updates+1});
    }

    render() {

        const segs = this.state.journey.getSegments();
        console.log(segs);
        const els = [];

        console.log("Rendering journey with ", segs.length, "segments");

        for(var i in segs) {
            var s = segs[i];
            if(i < segs.length - 1){
                console.log("Render segment",i,  s);
                els.push(<Segment key={"seg" + s.getUID().toString()} segment={s} onModeChange={() => {}} snapping={this.snapping}></Segment>);
                els.push(<SegmentInserter key={"ins" + s.getUID().toString()} after={s}></SegmentInserter>);
            }
        }

        console.log("Render end segment", i, s);
        els.push(<Segment key={"seg" + s.getUID().toString()} segment={s}  snapping={this.snapping}></Segment>)

        return ( <div>
                    {els}
                </div> );
    }
}
