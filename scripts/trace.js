const fs = require('fs');
const ImageTracer = require('imagetracerjs');
const path = require('path');

const inputFile = path.resolve(__dirname, 'src/assets/logo.jpeg');
const outputFile = path.resolve(__dirname, 'src/assets/logo.svg');

// Options for tracing
const options = {
    // Basic color reduction
    colorquantcycles: 3,
    numberofcolors: 16,
    mincolorratio: 0.02,

    // Smoothness and detail
    ltres: 1,
    qtres: 1,
    pathomit: 8,
    rightangleenhance: true,

    // Blur before tracing
    blurradius: 0,
    blurdelta: 20
};

console.log('Tracing image...');
ImageTracer.imageToSVG(
    inputFile,
    function (svgstr) {
        fs.writeFileSync(outputFile, svgstr);
        console.log('SVG saved to ' + outputFile);
    },
    options
);
