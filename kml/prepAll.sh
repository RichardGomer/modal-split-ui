#!/bin/bash

# Prepare all of the KML files passed as arguments by importing and adding errors

ffile=${BASH_ARGV[0]} # First filename
fdir=`dirname $ffile`
pp="${fdir##*/}"
l="${fdir}/list.html"

echo "+ Path prefix is ${pp}"
echo "+ Writing list to ${l}"

echo "<h1>${pp}</h1><ul>" > $l

for f in ${BASH_ARGV[*]}
do
    echo "Process $f"
    echo " + Import to JSON format"
    ${BASH_SOURCE%/*}/importkml.mjs $f > "$f.json"
    echo " + Add errors"
    ${BASH_SOURCE%/*}/adderrors.mjs "$f.json" > "${f}_errs.json"
    fname=`basename ${f}_errs.json`
    echo "<li><a href=\"http://127.0.0.1:1234?snap=0&lang=en&f=http://127.0.0.1:9090/${pp}/${fname}\" target=\"_blank\">View ${f}</a></li>" >> $l
done

echo "</ul>" >> $l
