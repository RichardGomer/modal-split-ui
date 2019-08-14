#!/bin/bash

# Prepare all of the KML files passed as arguments by importing and adding errors
for f in ${BASH_ARGV[*]}
do
    echo "Process $f"
    echo " + Import to JSON format"
    ${BASH_SOURCE%/*}/importkml.mjs $f > "$f.json"
    echo " + Add errors"
    ${BASH_SOURCE%/*}/adderrors.mjs "$f.json" > "${f}_errs.json"
done
