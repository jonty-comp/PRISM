#!/bin/bash
logdir="/mnt/cctv/"
today=$(date +%Y-%m-%d)

#Camera
for A in $logdir*/
do
        #Date
        for B in ${A}*.mjpg
        do
                if [ $(echo "${B}" | sed 's/mjpg//') != "$today" ]
                then
                        vidstr=$(echo "${B}" | sed 's/mjpg/mp4/')
                        avconv -i ${B} -preset superfast -tune stillimage -crf 30 -c:a none $vidstr
                        if [ -e $vidstr ]
                        then
                                rm ${B};
                                echo Removed ${B}.;
                        else
                                echo Error: Video $vidstr could not be verified.;
                        fi
                fi
        done
done
