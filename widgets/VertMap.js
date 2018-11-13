import React from 'react';
import { withGoogleMap, GoogleMap, Marker,Polyline } from "react-google-maps";
import GeoPlus from '../geometry';

/**

Shows:
- a path (set of points)
- a point of interest (on the path)
the point of interest can be moved along the path

the orientation of the map will change so that the path is always oriented vertically.


**/

export default class VertMap extends React.Component {
    constructor(props) {
        super(props);

        this.parsePoint.bind(this);

        this.state = {path: this.parsePoint(props.path), point: this.parsePoint(props.point)};

        // FFS Javascript :/
        this.onPan = this.onIdle.bind(this);
        this.debugPlot = this.debugPlot.bind(this);

    }

    parsePoint(p) {

        if(Array.isArray(p)) {
            return p.map(this.parsePoint)
        }

        if(typeof p !=' string') {
            console.error(p, "is not a string");
        }

        p = p.split(',');
        return new google.maps.LatLng(parseFloat(p[0]), parseFloat(p[1]));
    }

    render() {


        // What a hideous pattern; anyway, this creates a new component...
        const Map = withGoogleMap( props =>
            <GoogleMap
              defaultZoom={16}
              defaultCenter={props.point}
              defaultOptions={{
                  streetViewControl: false,
                  scaleControl: false,
                  mapTypeControl: false,
                  panControl: false,
                  zoomControl: false,
                  rotateControl: false,
                  fullscreenControl: false
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

        // 2: Find the closest point on each segment
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
                console.log("Best segment", sdist, last, cur);
                best_dist = sdist;
                best_point = spoint;
            }
        }

        //this.debugPlot(best_point, 'Snap Point');

        // 4: And set the map to that location :)
        this.state.point = best_point;
        this.gmap.setCenter(best_point);
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
