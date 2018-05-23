Application icon
================
The app icon (as referenced by the `apple-touch-icon` links in index.html) is generated from `tv-icon.svg`.

To create a new icon size:
1. Edit `tv-icon.svg` and set the width and height attributes of the `<svg>` element to the desired size.
2. Use an [SVG to PNG converter](http://www.fileformat.info/convert/image/svg2raster.htm) to generate a PNG file of the same dimensions
3. Save the generated PNG file as `src/images/tv-icon-{height}x{width}.png`
4. Add the appropriate `<link rel="apple-touch-icon" href="${require('images/tv-icon-{height}x{width}.png')}" sizes="{height}x{width}"/>` tag to `src/index.html`

Sizes:
* iPhone non-retina <= iOS6 : 57x57
* iPhone retina <= iOS6 : 114x114
* iPhone retina iOS7+ : 144x144
* iPad non-retina <= iOS6 : 72x72
* iPad non-retina iOS7+ : 76x76
* iPad retina <= iOS6 : 120x120
* iPad retina iOS7+ : 152x152

Application startup image
=========================
The startup image (as referenced by the `apple-touch-startup-image` links in index.html) is generated from `tv-splash.html`

To create a new startup image:
1. Open `build/tv-splash.html` in a browser
2. Move your mouse pointer to the top right-hand corner of the page to show the hidden editing controls
3. The `Show Guides` checkbox enables alignment guides that show the center point (turn these off before saving the image though)
4. Choose the device type/size/orientation from the dropdown list
5. Open DevTools, and with the `#container` element selected, press CMD+Shift+P and type `screenshot`.
6. Choose `Capture node screenshot`
7. Save the PNG file as `src/images/startup-{width}x{height}.png`
8. Add the appropriate `<link rel="apple-touch-startup-image" href="${require('images/startup-{width}x{height}.png')}" media="{media query}"/>` tag to `src/index.html`

To add a new device option to the devices dropdown list:
1. Add a new CSS selector to the stylesheet, using the following convention: `#container.{device type}.{orientation}.{screen height}[.{pixel density}]`
2. Configure the dimensions & background position for the new CSS selector
3. Add an option to the `#device` dropdown, with it's value being the list of CSS classes that match the above CSS selector (eg. `<option value="{device type} {orientation} {screen height}">`)
