const fs = require('fs');
const potrace = require('potrace');

const params = {
    color: '#2b579a', // Uses Word's blue to give the logo the right theme
    background: 'transparent',
    optTolerance: 0.2, // path vector optimization tolerance
    alphamax: 1, // corner threshold
    opticurve: 1, // optimization of curves
};

console.log('Starting potrace...');
potrace.trace('src/assets/logo.jpeg', params, function (err, svg) {
    if (err) {
        console.error('Potrace error: ', err);
        process.exit(1);
    }
    fs.writeFileSync('src/assets/logo.svg', svg);
    console.log('SVG created successfully.');
});
