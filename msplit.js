import React from 'react';
import ReactDOM from 'react-dom';
import Journey from './widgets/Journey'
import VertMap from './widgets/VertMap'
import {JourneyModel, JourneyModelSegment} from './model'

console.log("Begin");

const domContainer = document.querySelector('#journeyui');

$().ready(function(){

    $.urlParam = function(name){
    	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);

        if(results == null)
            return null;

    	return results[1] || null;
    }

    function update() {
        var file = $.urlParam('f');
        var blank = $.urlParam('blank');

        ReactDOM.unmountComponentAtNode(domContainer);

        function render(journey) {

            // Save answer to quickstore once completed
            var saveAnswer = function(jny) {
                var json = JSON.stringify(jny);
                $.post('https://qrowdlab.websci.net/quickstore/', {k: file, v: json});
            }

            var snap = $.urlParam('snap');
            var snapping = snap == null || snap == true;

            console.log("Render", journey, "in", domContainer);

            ReactDOM.render(<Journey journey={journey} onAnswerUpdated={saveAnswer} snapping={snapping} />, domContainer);
        }

        console.log(file, blank);

        if(file == null) {
            document.getElementById('journeyui').innerHTML = "<strong>Specify journey file in f</strong>";
            return;
        } else if(blank != null) {
            // In blank/overrride/"fuck it" mode, we still save using the file name, but
            // begin with a blank journey
            JourneyModel.getBlank(render);
        } else {
            // Fetch the JSON and render it
            $.get(file, {}, function(json){

                console.log("Fetched journey", json);

                // JSON could be our native format...
                if(typeof json["segments"] !== 'undefined') {
                    var journey = JourneyModel.import(json);
                } else { // ...or what we get from InfAI
                    var journey = JourneyModel.fromJSON(json);
                }

                render(journey);

            }, 'json');
        }


    }

    update(); // Run on load

});
