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

        ReactDOM.unmountComponentAtNode(domContainer);

        if(file == null) {

            document.getElementById('journeyui').innerHTML = "<strong>Specify journey file in f</strong>";
            return;
        }

        // Fetch the JSON and render it
        $.get(file, {}, function(json){


            console.log("Fetched journey", json);

            var journey = JourneyModel.fromJSON(json);


            var saveAnswer = function(jny) {
                //console.log("Journey was updated", jny);
                var json = JSON.stringify(jny);
                console.log("Journey was updated", json);

                // Post journey to quickstore
                $.post('http://qrowdlab.websci.net/quickstore/', {k: file, v: json});
            }

            var snap = $.urlParam('snap');
            var snapping = snap == null || snap == true;


            ReactDOM.render(<Journey journey={journey} onAnswerUpdated={saveAnswer} snapping={snapping} />, domContainer);
        }, 'json');
    }

    update(); // Run on load

});
