Application icon
================
The app icon (as referenced by the `apple-touch-icon` links in index.html) is generated from `tv-icon.svg`.

To create a new icon size:
1. Edit `tv-icon.svg` and set the width and height attributes of the `<svg>` element to the desired size.
2. Use an [SVG to PNG converter](http://www.fileformat.info/convert/image/svg2raster.htm) to generate a PNG file of the same dimensions
3. Save the generated PNG file as `public/tv-icon-{height}x{width}.png`
4. Add the appropriate `<link rel="apple-touch-icon" href="tv-icon-{height}x{width}.png" sizes="{height}x{width}"/>` tag to `index.html`

Application startup image
=========================
The startup image (as referenced by the `apple-touch-startup-image` links in index.html) is generated from `tv-splash.html`

To create a new startup image:
1. Open `build/tv-splash.html` in a browser (see note below regarding the file:// protocol)
2. Move your mouse pointer to the top right-hand corner of the page to show the hidden editing controls
3. The `Show Guides` checkbox enables alignment guides that show the center point (turn these off before saving the image though)
4. Choose the device type/size/orientation from the dropdown list
5. Use a [screen capture utility](https://chrome.google.com/webstore/detail/awesome-screenshot-captur/alelhddbbhepgpmgidjdcjakblofbmce?hl=en) to save the `#container` element as a PNG (see note below)
6. Save the PNG file as `public/images/startup-{width}x{height}.png`
7. Add the appropriate `<link rel="apple-touch-startup-image" href="images/startup-{width}x{height}.png" media="{media query}"/>` tag to `index.html`

Note: Many browser plugins/extensions such as the screen capture extension above are disabled when the file:// protocol is used. This means you will need to open `tv-splash.html` using http. The simplest way to do this is to run `python -m SimpleHTTPServer {port}` from the `/build` directory, then browse to `http://localhost:{port}/tv-splash.html`

Note: For saving small startup images as PNG files, [Element Capture](https://chrome.google.com/webstore/detail/element-capture/kabgnkphidokfocflfangphgdjhkknjg?hl=en) is a Chrome extension that allows you to simply click on the element and it will create a PNG for it. Unfortunately, if the element is bigger than the current browser viewport, any off-screen content will be transparent in the generated PNG. For larger images, [Awesome Screenshot](https://chrome.google.com/webstore/detail/awesome-screenshot-captur/alelhddbbhepgpmgidjdcjakblofbmce?hl=en) allows you to select a region that is larger than the current viewport (by scrolling).

To add a new device option to the devices dropdown list:
1. Add a new CSS selector to the stylesheet, using the following convention: `#container.{device type}[.{pixel density}][.{screen height}][.{orientation}]`
2. Configure the dimensions & background position for the new CSS selector
3. Add an option to the `#device` dropdown, with it's value being the list of CSS classes that match the above CSS selector (eg. `<option value="{device type}[ {pixel density}][ {screen height}][ {orientation}">`)
