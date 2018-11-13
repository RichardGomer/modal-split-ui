import React from 'react';
import ModeRibbon from './ModeRibbon'
import VertMap from './VertMap.js'

export class Segment extends React.Component {
    constructor(props) {
        super(props);

        this.state = {start: props.start, mode: props.mode, path: props.path};

        this.setMode = (mode) => {
            this.setState({mode: mode});
            props.onModeChange(mode);
        }
    }

    render() {

        return (
            <div className="Segment">
                <ModeRibbon onModeChange={this.setMode} mode={this.state.mode} />
                <div className="MapOuter"><VertMap point={this.state.start} path={this.state.path} /></div>
            </div>
        );
    }
}

export class EndSegment extends React.Component
{
    constructor(props) {
        super(props);

        this.state = {start: props.start, path: props.path};
    }

    render() {

        return (
            <div className="EndSegment">
                <div className="MapOuter"><VertMap point={this.state.start} path={this.state.path} /></div>
            </div>
            );
    }
}
