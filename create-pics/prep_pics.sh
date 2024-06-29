#!/bin/bash

rm -rf ./assets

mkdir assets
cp -r /mnt/c/repos/create-pics/new-pics/ ./assets/.
mv ./assets/new-pics ./assets/media
cp -r ./empty-pic-size-folders/* ./assets/media/.

python3 ./createresponsivemedia.py

cp -r ./assets /mnt/c/repos/create-pics/new-pics-out/.
rm ../assets/media/processed.md
rm -r assets

echo done.
