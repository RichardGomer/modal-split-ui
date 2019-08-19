Modal Split Interface

A UI for describing multi-modal journeys, written in React.


Build
-----

Built with ParcelJS

`npm install -g parcel-bundler`

`parcel index.html`

Note: Most of the javascript files rely on Node's experimental ESM module loader, hence the `.mjs` extension. Enabling the ESM loader currently requires command line flags (`--harmony --experimental-modules`), but parcel seems to cope with them OK. Those arguments are included in the shebang lines of executable scripts, so Linux users shouldn't need to worry.


Format
------

Journeys are stored as JSON in a non-standard format that matches their internal
representation in the UI. See the "Command Line Tools" section for commands that can
import KML into our JSON format.

The UI - and SOME of the other tools - will also auto-detect and import the JSON
format that's exported from the modal-split detection software; but use of the native
JSON format is recommended where possible.


UI Usage
--------

Once parcel'ed, URL parameters control how the UI loads, displays and stores journeys:

* `f=` : The URL of a JSON file containing a journey
* `blank=1` : Don't load the file specified in f, start with a minimal ('blank') journey instead; f will be still be used as a key to save the journey
* `snap=(1|0)` : Enable/Disable GPS path snapping (enabled by default)

Storage is via POST'ing to an external web service (not included in this repository).


Command Line Tools
-------------------

A suite of others tools for working with journeys is included in this repository.

* `kml/importkml.mjs`: A tool that takes a KML filename as an argument and writes the journey in our JSON format to stdout. Designed to work with KML files from Google Timeline; but does not support
all of the transport modes that Google does (converts them to walking).
* `kml/adderrors.mjs`: A tool that takes a JSON file name as an argument, inserts random errors into journey, and writes the new JSON to stdout (we used this for testing how people correct errors using the UI)
* `analyse/diff.mjs`: Does a simple line-by-line diff of two journeys; but considers points to be
equal if they are within 100m of one another (to overcome rounding errors introduced by the UI).
Useful for doing a quick-and-dirty comparison of the before- and after-correction journeys.
* `analyse/batchdiff.mjs`: As above, but processes a whole directory full of journeys, attempting to match input/output files based on filename (using semantics peculiar to our file-naming scheme, you'll probably need to tweak for other applications!)


Incomplete Tools
----------------


* `analyse/compare.mjs`: A tool that loads two journeys into a graph structure and
compares them to one another. Loading into the graph is implemented, but specific
comparisons are not.
* `viewer`: A react interface for comparing two journeys side-by-side; not finished...
