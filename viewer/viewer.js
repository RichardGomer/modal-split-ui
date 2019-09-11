import React from 'react';
import ReactDOM from 'react-dom';
import CompareModel from './CompareModel';
import CompareMap from './CompareMap';
import CompareList from './CompareList';
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
        var fO = $.urlParam('o');

        ReactDOM.unmountComponentAtNode(domContainer);

        console.log("Fetch", fA, fB, fO);

        if(fA == null || fB == null || fO == null) {
            document.write("Specify a= and b= and o=");
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

        $.when(get(fA), get(fB), get(fO)).then(function(ja, jb, jo){
            console.log(ja, jb, jo);
            var cm = new CompareModel(ja, jb, jo);
            ReactDOM.render(<div>
                    <div className="map"><CompareMap model={cm} /></div>
                    <div className="list"><CompareList model={cm}/></div>
                </div>, domContainer);
        });

    }

    update(); // Run on load

});
