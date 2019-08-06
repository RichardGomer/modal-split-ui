Modal Split Interface

A UI for describing multi-modal journeys, written in React.


Build
-----

Built with ParcelJS

`npm install -g parcel-bundler`

`parcel index.html`


Usage
-----

* `f=` : The URL of a JSON file containing a journey
* `blank=1` : Don't load the file specified in f, start with a minimal ('blank') journey instead; f will be still be used as a key to save the journey
* `snap=(1|0)` : Enable/Disable GPS path snapping (enabled by default)
