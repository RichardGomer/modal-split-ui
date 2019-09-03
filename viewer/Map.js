import React from 'react';
import { withGoogleMap, GoogleMap, Marker,Polyline } from "react-google-maps";
import GeoPlus from '../geometry';

/**

Shows:
- a path (array of points)
- a point of interest (on the path)
the point of interest can be moved along the path

**/

export default class CfMap extends React.Component {
    constructor(props) {
        super(props);

        this.state = {path: GeoPlus.parsePoint(props.path), point: GeoPlus.parsePoint(props.point)};


    }

    /**
    VERY IMPORTANT:
        Rendering GMaps is expensive in time and money terms;
        there is no good use-case for updating the state of a vertmap from outside, though
        so a vertmap NEVER allows a re-render. If the point on a vertmap changes, it needs
        to be destroyed and inserted again
    **/
    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    render() {

        // Generate the polylines
        // input
        <Polyline path={props.path} geodesic={true} options={{strokeColor: "#ff0000", strokeOpacity: 0.75, strokeWeight: 3}} />

        // output
        <Polyline path={props.path} geodesic={true} options={{strokeColor: "#00ff00", strokeOpacity: 0.75, strokeWeight: 3}} />

        // original
        <Polyline path={props.path} geodesic={true} options={{strokeColor: "#0000ff", strokeOpacity: 0.75, strokeWeight: 3}} />

        // Add change points and destinations
        // Points that match

        // What a hideous pattern; anyway, this creates a new component...
        const Map = withGoogleMap( props => {
            console.log("Creating GoogleMap with center", props.point);
            return <GoogleMap
              defaultZoom={14}
              defaultCenter={props.point}
              defaultOptions={{
                  streetViewControl: false,
                  scaleControl: false,
                  mapTypeControl: false,
                  panControl: false,
                  zoomControl: false,
                  rotateControl: false,
                  fullscreenControl: false,
                  gestureHandling: 'greedy'
              }}
              onIdle={() => { this.onIdle(); }} // A layer of indeirection is required to prevent $this being broken
              ref={props.onMapMounted}
            >


            </GoogleMap>
        }
        );

        // ... that we instantiate here
        return  <Map
                    point={this.state.point}
                    path={this.state.path}
                    containerElement={<div className="Map" />}
                    mapElement={<div style={{ height: '110%' }} />} // Making it bigger hides the Google stuff ;)
                    onMapMounted={(map) => {
                        if(map == null) return;
                        var gmap = map.context['__SECRET_MAP_DO_NOT_USE_OR_YOU_WILL_BE_FIRED']; // Yeah actually we need it *eyeroll*
                        //console.log("Map was mounted, saving native ref", gmap);
                        this.gmap = gmap;
                    }}
                />;
    }
