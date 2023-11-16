# Application icon

The app icon (as referenced by the `icons` property in app.webmanifest) is generated from `tv-icon.svg`.

To create a new icon size:

1. Edit `tv-icon.svg` and set the width and height attributes of the `<svg>` element to the desired size.
2. Use an [SVG to PNG converter](http://www.fileformat.info/convert/image/svg2raster.htm) to generate a PNG file of the same dimensions
3. Save the generated PNG file as `src/images/tv-icon-{height}x{width}.png`
4. Add an entry to the `icons` array in `src/app.webmanifest`

Sizes ([reference](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)):

- iPhone (3x scale factor) : 180x180
- iPhone (2x scale factor) : 120x120
- iPad Pro : 167x167
- iPad, iPad mini : 152x152

# Application startup image

The startup images (as referenced by the `apple-touch-startup-image` links in index.html) are generated using `pwa-asset-generator` from `tv-splash.svg`.

To create new startup images:

1. Run `npm run generate:splash`
2. From the output, copy the `<link rel="apple-touch-startup-image" .../>` links
3. Paste the links into `src/index.ejs`, replacing the existing ones
4. For each link, append `')%>` to the `href` to correct the template

The text in the source `tv-splash.svg` image uses a webfont, which has to be embedded into the SVG using base64 encoding. To reduce the size, the font has been subsetted to only include the characters ("TV manager").

To regenerate the base64 encoding for the font:

1. Browse to https://fonts.googleapis.com/css2?family=Chau+Philomene+One:ital@1&text=TV%20manager (replace the `&text=` query if necessary)
2. Browse to the location in `src: url()` (https://fonts.gstatic.com/1/font?kit=...)
3. Save the file as `build/chauphilomeneone.woff2`
4. Use a [Font to Base64 converter](https://hellogreg.github.io/woff2base) to generate the base64 encoding
5. Copy the base64 from the `src: url()` and paste into the `@font-face` declaration in `tv-splash.svg`
