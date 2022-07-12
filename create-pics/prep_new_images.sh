#!/bin/bash

rm -rf ./assets

mkdir assets
cp -r ./new-pics/ ./assets/.
mv ./assets/new-pics ./assets/media
cp -r ./empty-pic-size-folders/* ./assets/media/.

python3 ./createresponsiveimages.py

cp -r ./assets ../stevenelson35.github.io/.
rm ../stevenelson35.github.io/assets/media/processed.md
rm -r create-pics/assets

echo done.
