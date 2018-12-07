import React from 'react';

export default class ModeRibbon extends React.Component {

    constructor(props) {
        super(props);

        this.state = {mode: props.mode};

        this.setMode = (mode) => {
            this.setState({mode: mode});
            props.onModeChange(mode);
        }

    }

    render() {

        return ( <div className={this.state.mode + " ModeRibbon"}> <ModeMenu mode={this.state.mode} onModeChange={this.setMode} /> </div> );
    }


}

export class ModeMenu extends React.Component {

    constructor(props) {
        super(props);

        this.state = {mode: props.mode, open: false};

        this.setMode = (mode) => {
            this.setState({mode: mode});
            props.onModeChange(mode);
        }

        this.icons = {
                'walk': <span className="fas fa-walking"></span>,
                'bike': <span className="fas fa-bicycle"></span>,
                'bus': <span className="fas fa-bus"></span>,
                'car': <span className="fas fa-car"></span>,
                'train': <span className="fas fa-train"></span>
        };
    }

    render() {

        var icon = this.icons[this.state.mode];

        if(!this.state.open) { // Closed menu mode
            return ( <div className="ModeMenu" onClick={(e) => this.setState({open: true})}>{icon}</div> );
        } else {
            var self = this;
            var options = Object.keys(this.icons).map( (key) => <li key={key} onClick={function(){ self.setMode(key); }}>{this.icons[key]}</li> );
            var menu = <ul className="ModeMenuOptions">{options}</ul>;
            return ( <div className="ModeMenu" onClick={(e) => this.setState({open: false})}>{icon}{menu}</div> );
        }
    }

}
