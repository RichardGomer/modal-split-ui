import React from 'react';
import autoBind from 'auto-bind';
import GeoPlus from '../geometry';

export default class CompareList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {cmodel: props.model, focus: props.model.getFocus()};

        // Sub to focus change...
        var self = this;
        this.state.cmodel.subscribe('change-focus', function(){
            self.setState({focus: self.state.cmodel.getFocus()})
        })

        autoBind(this);
    }



    // Render a journey as a series of markers and PolyLines
    renderJourney(j, extended) {
        var items = [];
        var count = 0;
        for(var s of j.getSegments()){
            count++;
            var k = s.getIdentifier();

            items.push(<SegmentInfo cmodel={this.state.cmodel} segment={s} compare={extended ? true : false} />);
        }

        return <ul>{items}</ul>;

    }


    render() {

        console.log(this.state.cmodel.getMatcher().getMatches());

        function toPoints(arr){
            return arr.map(function(i){
                return i.split(/,/);
            });
        }

        var original = this.renderJourney(this.state.cmodel.getOriginal());
        var errors = this.renderJourney(this.state.cmodel.getErrorfied());
        var output = this.renderJourney(this.state.cmodel.getOutput(), true);

        var self = this; // need a static ref for an event handler, below

        return <div>
            <ul>{original}</ul>
            <ul>{errors}</ul>
            <ul>{output}</ul>
        </div>

    }
}

export class ErrList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {cmodel: props.model};

        autoBind(this);
    }

    render() {

        var  errs = [];
        var errList = this.state.cmodel.getErrorList();
        var self = this;
        for(var e of errList) {

            (function(e){ // Trap an event handler in a closure

                // Extract the segment identifier from the error description
                var esid = e.match(/[a-z]+\-[a-z]+\-[0-9]+/i)[0]

                var eseg = false;

                for(var s of self.state.cmodel.getErrorfied().getSegments()){
                    if(s.getIdentifier() == esid) {
                        eseg = s;
                    }
                }

                var find = function(){
                    if(!eseg)
                        return;

                    self.state.cmodel.setFocus(eseg);
                }

                errs.push(
                    <li onClick={find}>{e}</li>
                );

            })(e);
        }

        return <ul className="errors">
        {errs}
        </ul>
    }
}

class SegmentInfo extends React.Component {

    constructor(props) {
        super(props);

        this.state = {seg: props.segment, cmodel: props.cmodel, focus: false};

        this.compare = props.compare == true;

        var self = this;
        this.state.cmodel.subscribe('change-focus', function(){

            var focus = self.state.cmodel.getFocus();

            // See if this segment is comparable to the selected one (ie gets a soft focus)
            var demifocus = false;
            if(self.state.cmodel.getMatcher().isMatched(focus, self.state.seg)) {
                demifocus = true;
            }

            self.setState({focus: self.state.seg == focus, demifocus: demifocus});
        });

        autoBind(this);
    }

    render() {

        var classes = "seg" + (this.state.focus ? " focus" : "") + (this.state.demifocus ? " demifocus" : "");

        var mode = this.state.seg.isDestination() ? "" : this.state.seg.getMode();

        var k = this.state.seg.getIdentifier();

        var count = this.state.seg.getPosition();

        return <li className={classes} onClick={this.focus}>
            <strong className="position">{count}</strong> <strong className="id">{k}</strong>
            <span className="mode">{mode}</span>
        </li>
    }

    focus() {
        this.state.cmodel.setFocus(this.state.seg);
    }
}
