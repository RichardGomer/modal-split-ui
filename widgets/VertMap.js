import React from 'react';
import { withGoogleMap, GoogleMap, Marker,Polyline } from "react-google-maps";
import GeoPlus from '../geometry';

/**

Shows:
- a path (array of points)
- a point of interest (on the path)
the point of interest can be moved along the path

**/

export default class VertMap extends React.Component {
    constructor(props) {
        super(props);

        console.log("Render VertMap", props.path, props.point);

        this.state = {path: GeoPlus.parsePoint(props.path), point: GeoPlus.parsePoint(props.point)};

        if(typeof this.props.snapping == 'undefined') {
            this.snapping = true;
        } else {
            this.snapping = props.snapping == true;
        }

        // FFS Javascript :/
        this.onPan = this.onIdle.bind(this);
        this.debugPlot = this.debugPlot.bind(this);

        this.onMove = props.onMove;
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
        console.log("(Re-)rendering VertMap");

        // What a hideous pattern; anyway, this creates a new component...
        const Map = withGoogleMap( props =>
            <GoogleMap
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
              <Polyline path={props.path} geodesic={true} options={{strokeColor: "#0000ff", strokeOpacity: 0.75, strokeWeight: 3}} />
            </GoogleMap>
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

    /**
     * When panned, always snap back to a point on the path
     */
    onIdle() {

        // Allow snapping to be disabled
        if(!this.snapping) {
            return;
        }

        // Only snap if centre has moved >10metres
        const distm = google.maps.geometry.spherical.computeDistanceBetween(this.gmap.getCenter(), this.state.point);

        if(distm < 10) {
            return;
        }

        console.log("Map has moved ", distm, this.gmap.getCenter());

        if(this.state.path.length < 2) {
            console.error("No path was supplied to the VertMap; cannot snap!");
            return;
        }

        // 1: Get center point of map
        const center = this.gmap.getCenter();

        // 2: If snapping, Find the closest point on each segment
        var cur, last;
        var best_dist = Infinity;
        var best_point;
        for(var i in this.state.path) {
            last = cur;
            cur = this.state.path[i];

            if(i == 0)
                continue;

            // 3: And use the best one
            var spoint = GeoPlus.closestPointOnLine(last, cur, center);
            var sdist = google.maps.geometry.spherical.computeDistanceBetween(spoint, center);

            if(sdist < best_dist) {
                //console.log("Best segment", sdist, last, cur);
                best_dist = sdist;
                best_point = spoint;
            }
        }


        // 4: And set the map to that location :)
        this.state.point = best_point;
        this.gmap.setCenter(best_point);
        this.onMove(best_point);
    }

    debugPlot(point, label) {
        var marker = new google.maps.Marker({
          position: point,
          map: this.gmap,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5
          },
          title: 'Debug: ' + label,
          opacity: 0.5
        });
    }

}
