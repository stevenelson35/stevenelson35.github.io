import yaml
import os
import subprocess

YAML_FILE = "processed.md"
FOLDERS = {
    "assets/media/":[2048,1920,1600,1366,1024,768,640],
    "assets/images/":[2048,1920,1600,1366,1024,768,640]
    }

#Directory of this file
dir = os.path.dirname(os.path.abspath(__file__))

#For each directory, find all files and build the yaml.
for folder in FOLDERS.keys():

    #generate the path to the yaml file Jekyll will use
    folderpath = os.path.join(dir, folder)
    yamlfile = os.path.join(folderpath, YAML_FILE)

    #Generate a list of images the yaml file knows about
    #These images won't need compressing and resizing as they already are.
    knownimages = []
    if os.path.exists(yamlfile):
        stream = open(yamlfile, 'r')
        data = yaml.load_all(stream)
        knownimages = next(data)['images'] or []
        stream.close()

    #Generate a list of images that are there right now
    realimages = []
    for file in os.listdir(folderpath):
        if file.endswith(".jpg") or file.endswith(".jpeg"):
            realimages.append(file)
        elif file.endswith(".png"):
            realimages.append(file)

    #Some images may have been removed since the yaml was last updated
    #Let's remove those entries
    images = [img for img in knownimages if img in realimages]

    #Now get the images that need compressing and adding to the yaml
    newimages = [img for img in realimages if img not in knownimages]

    #Compress the image and remember it
    for image in realimages:
        imagepath = os.path.join(folder, image)
        imagenoext = os.path.splitext(image)[0]

        #Compress and remember the images
        #We also want to create the smaller and larger sized resolutions
        #Get the width of the image
        width = int(subprocess.check_output("identify -format \"%[w]\" " + imagepath, shell=True))

        if image.endswith(".jpg") or image.endswith(".jpeg"):
            #Generate all of the resized versions
            for size in FOLDERS[folder]:
                newsizeimage = imagenoext + "-" + str(size) + ".jpg"
                sizefolderpath = os.path.join(folder, str(size))
                if not os.path.exists(sizefolderpath):
                    os.mkdir(sizefolderpath)
                newsizeimagepath = os.path.join(sizefolderpath, newsizeimage)

                #If our image is say 800px wide, but we're asked to make it 1000px,
                #obviously we're upsizing which is bad for storage space.
                #If DONOTUPSIZE is set, we don't do that, simply using the original image
                #Otherwise we upsize.
                if size > width:
                    #Just save the new file as an optimisation of the original
                    os.system("convert " + imagepath + " -sampling-factor 4:2:0 -strip -quality 85 -interlace JPEG -colorspace RGB " + newsizeimagepath)
                else:
                    os.system("convert " + imagepath + " -sampling-factor 4:2:0 -strip -resize " + str(size) + "x -quality 85 -interlace JPEG -colorspace RGB " + newsizeimagepath)
                #Add the resized image
                images.append(newsizeimage);
        elif image.endswith(".png"):
            #Generate all of the resized versions
            for size in FOLDERS[folder]:
                newsizeimage = imagenoext + "-" + str(size) + ".png"
                sizefolderpath = os.path.join(folder, str(size))
                if not os.path.exists(sizefolderpath):
                    os.mkdir(sizefolderpath)
                newsizeimagepath = os.path.join(sizefolderpath, newsizeimage)
                #Convert the image
                if size > width:
                    #Just save the new file as an copy of the original
                    os.system("cp " + imagepath + " " + newsizeimagepath)
                else:
                    #Make it smaller
                    os.system("convert " + imagepath + " -strip -resize " + str(size) + "x " + newsizeimagepath)
                    #Also optimise it
                    os.system("optipng -quiet -o1 -strip all " + newsizeimagepath)
                #Add the resized image
                images.append(newsizeimage);
            #Remember the images
            images.append(image)

    #Write the new yaml
    with open(yamlfile, 'w+') as outfile:
        outfile.write("---\n")
        yaml.dump({'images':images}, outfile, default_flow_style=False)
        outfile.write("---")