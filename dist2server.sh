#!/bin/bash
parcel build index.html
cp test dist -R
ssh login.ecs.soton.ac.uk -l rcg1e15 -L 2222:waisvm-rcg1v07:22 -fN
touch dist/THIS_CAME_VIA_SCP_NOT_GIT
sleep 3
scp -rP 2222 dist/* user@127.0.0.1:/home/web/modalsplit/
