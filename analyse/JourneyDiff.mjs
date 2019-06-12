/**
 * Custom diff'er for journey output
 * Like a normal diff, but considers distances within a given tolerance of one another as being equal
 */

import diff from 'diff';

const JourneyDiff = new diff.Diff();

export default JourneyDiff;

console.log(diff);

// Borrowed from the lineDiff (which is not exported for re-use :-/)
JourneyDiff.tokenize = function(value) {

  var words = value.split(" ");

  for(var i in words) {
      words[i] = words[i] + " ";
  }

  return words;
};

JourneyDiff.newequal = function(a, b){

    // Check if we're comparing positions; handle specially if so
    if(a.match(/(From|To)\[([0-9\.\,]+)\]/)) {

    } else {
        return Diff.prototype.equals.call(JourneyDiff, a, b);
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
        out.push(
            "From[" + s.getStart() + "] To[" + s.getEnd() + "] Mode[" + s.getMode() + "]"
        );
    }

    return out.join("\n");
}
