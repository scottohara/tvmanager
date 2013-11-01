Creating icons & splash images
==============================
The app icons (as referenced by the `apple-touch-icon` links in index.html) are generated from `tv-icon.svg`.

To create a new icon size:
1. Edit `tv-icon.svg` and set the width and height attributes of the `<svg>` element to the desired size.
2. Use an [SVG to PNG converter](http://www.fileformat.info/convert/image/svg2raster.htm) to generate a PNG file of the same dimensions
3. Save the generated PNG file as `public/tv-icon-{height}x{width}.png`
4. Add the appropriate `<link rel="apple-touch-icon" href="tv-icon-{height}x{width}.png" sizes="{height}x{width}"/>` tag to `index.html`

To create a new splash image:
1. Edit `tv-splash.html` and set the appropriate layout/styles
2. To generate a version for retina devices specify `class="retina"` on the #container div
3. To generate a version for non-retina devices, remove the above class
4. Use whatever tool is appropriate to save as a PNG (eg. this could be loading the page in a browser and using a screen capture tool)
5. Save the PNG file as `public/images/splash[_retina].png`
