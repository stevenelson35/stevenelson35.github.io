#!/bin/bash

for i in "$@"
do 
  echo converting "$i"
  convert ./assets/media/640/$i-640.jpg -rotate 90 ./assets/media/640/$i-640.jpg
  convert ./assets/media/768/$i-768.jpg -rotate 90 ./assets/media/768/$i-768.jpg
  convert ./assets/media/1024/$i-1024.jpg -rotate 90 ./assets/media/1024/$i-1024.jpg
  convert ./assets/media/1366/$i-1366.jpg -rotate 90 ./assets/media/1366/$i-1366.jpg
  convert ./assets/media/1600/$i-1600.jpg -rotate 90 ./assets/media/1600/$i-1600.jpg
  convert ./assets/media/1920/$i-1920.jpg -rotate 90 ./assets/media/1920/$i-1920.jpg
  convert ./assets/media/2048/$i-2048.jpg -rotate 90 ./assets/media/2048/$i-2048.jpg
done


