import React from 'react';
import autoBind from 'auto-bind';
import GeoPlus from '../geometry';

export default class CompareTable extends React.Component {
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


    render() {

        var matcher = this.state.cmodel.getMatcher();
        var matches = matcher.getMatches();

        // Work out column numbers for each journey
        var jnames = matcher.getJourneyNames();
        //console.log("Journey Names", jnames);

        var tds = [];
        for(var i in jnames) {
            var k = "header_" + i;
            tds.push(<td key={k}>{jnames[i]}</td>);
        }

        var header = <tr>{tds}</tr>;

        var rows = [];
        for(var m of matches) {
            var tds = [];
            for(var c of jnames) {
                if(typeof m[c] === 'undefined')
                    tds.push(<td />);
                else {
                    tds.push(<SegmentCell cmodel={this.state.cmodel} segment={m[c]} />);
                }
            }
            rows.push(<tr>{tds}</tr>);
        }

        var table =  <table><thead>{header}</thead><tbody>{rows}</tbody></table>;



        return table;

    }
}



class SegmentCell extends React.Component {

    constructor(props) {
        super(props);

        this.state = {seg: props.segment, cmodel: props.cmodel, focus: false};

        this.compare = props.compare == true;

        var self = this;
        this.state.cmodel.subscribe('change-focus', function(){

            var focus = self.state.cmodel.getFocus();

            //console.log("Focus", focus);

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

        return <td className={classes} onClick={this.focus}>
            <strong className="position">{count}</strong> <strong className="id">{k}</strong>
            <span className="mode">{mode}</span>
        </td>
    }

    focus() {
        this.state.cmodel.setFocus(this.state.seg);
    }
}
