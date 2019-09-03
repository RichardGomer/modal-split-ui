
import autoBind from 'auto-bind';

export default class HModel {
    constructor(state) {

        this.state = state;
        this.subs = [];

        autoBind(this);
    }


    // Subscribe to changes on this model
    subscribe(type, cb) {

        if(!this.subs[type]) {
            this.subs[type] = [];
        }

        this.subs[type].push(cb);
    }

    // Emit a change of type
    // A change of type '*' is emitted on every other emit event!
    emit(type, data) {

        if(!data) {
            data = {};
        }

        // Prevent cycles by refusing to emit more events until this one is over
        if(this.locked) {
            return;
        }

        this.locked = true;

        if(this.subs[type]) {
            for(var cb of this.subs[type]) {
                cb(data, this);
            }
        }

        if(this.subs['*']) {
            for(var cb of this.subs['*']) {
                cb(data, this);
            }
        }

        this.locked = false;
    }
}
