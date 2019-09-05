import React from 'react';
import ReactDOM from 'react-dom';
import CompareMap from './CompareMap';
import {JourneyModel, JourneyModelSegment} from '../model'

const domContainer = document.querySelector('#viewerui');

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);

    if(results == null)
        return null;

	return results[1] || null;
}

$().ready(function(){

    function update() {
        var fA = $.urlParam('a');
        var fB = $.urlParam('b');

        ReactDOM.unmountComponentAtNode(domContainer);

        console.log("Fetch", fA, fB);

        if(fA == null || fB == null) {
            document.write("Specify a= and b=");
        }

        // Fetch the JSON and render it
        function get(url) {
            var def = $.Deferred();

            $.get(url, {}, function(json){

                console.log("Fetched journey", json);

                // JSON could be our native format...
                if(typeof json["segments"] !== 'undefined') {
                    var journey = JourneyModel.import(json);
                } else { // ...or what we get from InfAI
                    var journey = JourneyModel.fromJSON(json);
                }

                def.resolve(journey);

            }, 'json');

            return def;
        }

        $.when(get(fA), get(fB)).then(function(ja, jb){
            console.log(ja, jb);
            ReactDOM.render(<CompareMap a={ja} b={jb} />, domContainer);
        });

    }

    update(); // Run on load

});
