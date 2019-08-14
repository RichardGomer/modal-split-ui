/**
 * Wrong mode error generator
 */

 import { JourneyModel, JourneyModelSegment } from '../../model'

 export default class BadModeInserter
 {
     constructor() {

     }

     /**
      * Apply an error to the provided JourneyModel
      */
     apply(j) {

        // 1: Pick a segment
        // But not an end segment
        var segments = j.getSegments();

        do {
         var n = Math.floor(Math.random() * (segments.length - 1));
        } while(segments[n].isDestination());

        var s = segments[n];

        var original = s.getMode();

        var modes = ['car', 'walk', 'bike', 'bus', 'train'];
        modes.splice(modes.indexOf(original), 1);
        var newmode = modes[Math.floor(Math.random() * modes.length)];

        s.setMode(newmode);

        j.addError('BADMODE ' + s.getIdentifier() + ' ' + original + '->' + newmode);
    }

}
