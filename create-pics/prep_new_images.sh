#!/bin/bash

rm -rf ./assets

mkdir assets
cp -r /mnt/c/repos/create-pics/new-pics/ ./assets/.
mv ./assets/new-pics ./assets/images
cp -r ./empty-pic-size-folders/* ./assets/images/.

python3 ./createresponsiveimages.py

cp -r ./assets ../.
rm ../assets/images/processed.md
rm -r assets

echo done.
