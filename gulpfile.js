const { src, dest } = require('gulp');
const fs = require('fs');
const path = require('path');


function newMod(cb) {

    let fileName = process.argv[3].slice(2);

    fs.mkdirSync('ui-local-build/modules/' + fileName, (err) => {
        if (err) throw err;
        console.log('A directory for the new module has been created in ui-local-build.');
    });

    let buildDir = './ui-local-build/modules/' + fileName + '/';

    fs.writeFile(buildDir + '_' + fileName + '.scss','/** ' + fileName + ' local build **/ ', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.scss has been saved in ui-local-build.');
    });

    fs.writeFile(buildDir + fileName + '.html', '<!-- ' + fileName + ' module -->', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.html has been saved in ui-local-build.');
    });

    fs.writeFile('./ui-mod-base/modules/_' + fileName + '.scss', '/** ' + fileName + ' module **/', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.scss has been saved in ui-mod-base.');
    });

    fs.appendFile('./ui-mod-base/ui-mod-base.scss', '\n@import \'modules/' + fileName + '\';', (err) => {
        if (err) throw err;
        console.log('The master ui-mod-base.scss import file was updated.');
    });

    cb();
}

exports.newmod = newMod;