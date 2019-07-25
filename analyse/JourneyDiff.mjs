/**
 * Custom diff'er for journey output
 * Like a normal diff, but considers distances within a given tolerance of one another as being equal
 */

import diff from 'diff';
import GeoPlus from '../geometry';

const JourneyDiff = new diff.Diff();

export default JourneyDiff;


// Tokenize into words
JourneyDiff.tokenize = function(value) {

  var words = value.split(/(?=[\n])/g); // This regex doesn't remove the matching chars

  // Remove times; we don't care about them
  for(var wi in words) {
      var w = words[wi];

      if(w.match(/^GPSTime/)){
          words.splice(wi, 1);
      }
  }

  return words;
};

JourneyDiff.equals = function(a, b){

    var tolerance = 100; // 100m tolerance

    // Check if we're comparing points; handle specially if so
    var am, bm;
    am = a.trim().match(/Point\[([0-9\.\,\-]+)\]/i);
    bm = b.trim().match(/Point\[([0-9\.\,\-]+)\]/i);

    if( am != null && bm != null ) {
        var pa= am[1];
        var pb = bm[1];

        var dist = GeoPlus.distance(pa, pb);

        return dist <= tolerance;
    }

    else {
        //console.log("Not points", a.trim(), b.trim());
        return diff.Diff.prototype.equals.call(JourneyDiff, a, b);
    }

}


/**
 * Get the journey in a simple text format; designed for easy comparison of journeys
 */
JourneyDiff.JourneyToText = function(jny) {
    var out = [];

    var segs = jny.getSegments();
    var segments = [];
    for(var s of segs) {
        var time = s.getTimeAtPoint(s.getStart());

        if(time == false) {
            time = "Off-Trace";
        }

        out.push(
            "Point[" + s.getStart() + "] GPSTime[" + time + "] Mode[" + s.getMode() + "]"
        );
    }

    return out.join("\n");
}
