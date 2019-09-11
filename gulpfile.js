const   { src, dest }   = require('gulp'),
        sass            = require('gulp-sass'),
        rename          = require('gulp-rename'),
        postcss         = require('gulp-postcss'),
        fs              = require('fs-extra'),
        git             = require('gulp-git'),
        readline        = require('readline-promise').default,
        exit            = require('gulp-exit');

sass.compiler = require('sass'); //use dart-sass?

/**************** utility functions **********************/

//attempts to retrieve either a module name passed as arg or the name of the last module created
function getFileName() {
    const argName = process.argv[3].slice(2);
    //console.log(argName);
    const lastMod = ['last-mod', 'last-mod-name', 'last-module'];
    let fileName;
    if (lastMod.includes(argName)) {
        try {
            const readImports = fs.readFileSync('./ui-mod-base/ui-mod-base.scss', 'utf8');
            fileName = readImports.substring(
                readImports.lastIndexOf('import') + 16,
                readImports.trimEnd().length - 2
            );
        } catch (err) {
            console.error(err);
        }
    } else {
        fileName = argName;
    }
    return fileName;
}

// console log test function
const logTest = function(testMessage, callback) {
    console.log(testMessage);
    callback();
};

// tests call stack
const gitMergeTest = function (fileName, callback) {
    logTest(fileName + ' 1', function() {
        logTest(fileName + ' 2', function() {
            logTest(fileName + ' 3', callback);
        });
    });
};*/


/********************************** git functions *******************************************/

const branch = function (modName) {
    git.checkout(modName, {args:'-b'}, function (err) {
        if (err) throw err;
        console.log('Git branch ' + modName + ' checked out.');
    });
};

const gitCommit = function(callback) {
    git.commit('pre-merge', {args: '-a'}, function (err) {
        if (err) {
            console.log('commit fail');
            throw err;
        } else {
            console.log('branch committed');
        }
    });
    callback();
};

const gitCheckout = function(callback) {
    git.checkout('master', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('switched back to master');
        }
    });
    callback();
};

const gitMerge = function(name, callback) {
    git.merge(name, function (err) {
        if (err) {
            throw err;
        } else {
            console.log('branch successfully merged.');
        }
    });
    callback();
};

const gitMergeFlow = function (fileName, callback) {
    gitCommit (function() {
        gitCheckout (function() {
            gitMerge (fileName, callback);
        });
    });
};


// runs a series of git commands for the mergemod task
const gitMergeNode = function(fileName, callback) {
    require('simple-git')()
        .add('./*')
        .commit('pre-merge')
        .checkout('master')
        .mergeFromTo(fileName, 'master');

    callback();
};



/*****************************************  branchmod  ******************************************/

// Git branch from master and check it out
function branchMod(cb) {
    let fileName = process.argv[3].slice(2);

    let userAnswer = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });


    let askQuestion = function() {
        userAnswer.question('Hold on --- Are you sure the repo is in a clean state and ok to branch? Enter y for "yes" or n for "no"\n', (key) => {
            if (key === '\u0079') {
                console.log('Git branch ' + fileName + ' created and checked out.');
                //if yes call git function
                branch(fileName);
                return userAnswer.close();
            } else if (key === '\u006E') {
                console.log('You entered no.');
                return userAnswer.close();
            } else {
                console.log('Wrong character entry. Please enter y or n.');
                askQuestion();
            }
            //userAnswer.close();
        });
    };

    cb();

    askQuestion();
}



/*****************************************  deletebranch  ******************************************/

// Remove (undo) git branch by switching back to master and deleting refs
function undoBranch(cb) {
    let branchName = process.argv[3].slice(2);
    git.checkout('master', function (err) {
        if (err) throw err;
    });
    git.branch(branchName, {args:'-D'}, function (err) {
        if (err) throw err;
    });
    cb();
}



/*****************************************  newmod  *********************************************/

// Create file and folder dependencies for a new module module
function newMod(cb) {

    let fileName = process.argv[3].slice(2),
        buildDir = './ui-local-build/modules/' + fileName + '/';

    // create mod directory in build
    fs.mkdirSync('ui-local-build/modules/' + fileName, (err) => {
        if (err) throw err;
        console.log('A directory for the new module has been created in ui-local-build.');
    });
    // create mod scss in build
/*    fs.writeFile(buildDir + '_' + fileName + '.scss','/!** ' + fileName + ' local build **!/ ', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.scss has been saved in ui-local-build.');
    });*/
    fs.writeFile(buildDir + '_' + fileName + '_local.scss','/** ' + fileName + ' local build **/ ', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.scss has been saved in ui-local-build.');
    });
    // create mod html in build
    fs.writeFile(buildDir + fileName + '.html', '<!-- ' + fileName + ' module -->', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.html has been saved in ui-local-build.');
    });
    // create mod scss for the ui-mod-base stylesheet
    fs.writeFile('./ui-mod-base/modules/_' + fileName + '.scss', '/** ' + fileName + ' module **/', (err) => {
        if (err) throw err;
        console.log('The file ' + fileName + '.scss has been saved in ui-mod-base.');
    });
    // add import for mod scss to the master ui-mod-base stylesheet
    fs.appendFile('./ui-mod-base/ui-mod-base.scss', '\r@import \'modules/' + fileName + '\';', (err) => {
        if (err) throw err;
        console.log('The master ui-mod-base.scss import file was updated.');
    });

    cb();
}



/********************************************  deletemod  *******************************************/

// Remove all of the files and folders in dev for a module
function deleteMod(cb) {
    const   fileName         = process.argv[3].slice(2),
            uiModBasePath    = './ui-mod-base/modules/_' + fileName + '.scss',
            uiLocalBuildPath = './ui-local-build/modules/' + fileName;

     try {
        fs.unlinkSync(uiModBasePath);
        console.log('The file ' + uiModBasePath + ' was deleted.');
     } catch (err) {
         console.error(err);
     }
     try {
         fs.unlinkSync((uiLocalBuildPath + '/_' + fileName + '.scss'));
         console.log('The file ' + uiLocalBuildPath + '/' + fileName + '.scss was deleted.');
     } catch (err) {
         console.error(err);
     }
     try {
         fs.unlinkSync((uiLocalBuildPath + '/' + fileName + '.html'));
         console.log('The file ' + uiLocalBuildPath + '/' + fileName + '.html was deleted.');
     } catch (err) {
         console.error(err);
     }
     try {
         fs.rmdirSync(uiLocalBuildPath);
         console.log('The directory ' + uiLocalBuildPath + ' was removed.');
     } catch (err) {
         console.error(err);
     }
    // remove mod scss import text from last line of ui-mod-base master scss
     try {
         const  modDelete       = '@import \'modules/' + fileName + '\';',
                data            = fs.readFileSync('ui-mod-base/ui-mod-base.scss', 'utf8'),
                removeModImport = data.replace(new RegExp(modDelete), '');
         fs.writeFileSync('ui-mod-base/ui-mod-base.scss', removeModImport, 'utf8');
     } catch(err) {
         console.log(err);
     }

    cb();
}



/*****************************************  buildtest  ******************************************/

//package new module for test-build and testing in Site Manager test environment
function buildTest(cb) {
    let fileName = getFileName();

    //create css-test to upload to site manager
    src('./ui-mod-base/ui-mod-base.scss')
        .pipe(sass()).on('error', sass.logError)
        .pipe(rename('ui-mod-base-' + fileName + '.css'))
        //.pipe(dest('./ui-mod-base/css-test'));
        .pipe(dest('../build-test-pages/css-test'));
    // create new module html file in test environment
    src('./ui-local-build/modules/' + fileName + '/' + fileName + '.html')
        .pipe(dest('../build-test-pages/modules/' + fileName));
    // create new module scss in test environment
    src('./ui-local-build/modules/' + fileName + '/scss/_' + fileName + '_local.scss')
        .pipe(dest('../build-test-pages/modules/' + fileName));
    src('./ui-utilities-master/*')
        .pipe(dest('../build-test-pages/ui-utilities-master'));
    cb();
}



/******************************************  mergemod  *******************************************/

// merge mod branch back to master
function mergeMod(cb) {

    let fileName = getFileName();

    // compile scss to css
    src('./ui-mod-base/ui-mod-base.scss')
        .pipe(sass()).on('error', sass.logError)
        .pipe(dest('./ui-mod-base/css'));
    // compile global css changes
    src('./ui-global-styles/ui-global-styles.scss')
        .pipe(sass()).on('error', sass.logError)
        .pipe(dest('./ui-global-styles/css'));
    // compile minified
   src('./ui-mod-base/ui-mod-base.scss')
        .pipe(sass()).on('error', sass.logError)
        .pipe( postcss([require('autoprefixer'), require('cssnano')]) )
        .pipe(rename('ui-mod-base-min.css'))
        .pipe(dest('./ui-mod-base/css/min'));

    src('./ui-global-styles/ui-global-styles.scss')
        .pipe(sass()).on('error', sass.logError)
        .pipe( postcss([require('autoprefixer'), require('cssnano')]) )
        .pipe(rename('ui-global-styles-min.css'))
        .pipe(dest('./ui-global-styles/css/min'));

    //run add, commit and merge git
    gitMergeNode(fileName, logTest("finished"));

    cb();
}



/*******************************************  deletetest  *********************************************/

function deleteTest(cb) {
    let userAnswer = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    //delete the test css file and directory
    let deleteTestCss = function() {
        userAnswer.question('Are you sure you want to delete the css-test directory and all its contents? Enter y for "yes" or n for "no"\n', (key) => {
            if (key === '\u0079') {
                try {
                    fs.removeSync('./ui-mod-base/css-test');
                    fs.removeSync('../build-test-pages/');
                    console.log('The directory css/test was removed.');
                } catch (err) {
                    console.error(err);
                }
                userAnswer.close();
            } else if (key === '\u006E') {
                console.log('You entered no.');
                return userAnswer.close();
            } else {
                console.log('Wrong character entry. Please enter y or n.');
                deleteTestCss();
            }
        });
    };
    cb();
    deleteTestCss();
}



/********************************************  pushmod  *********************************************/

function finalModPush(cb) {

    let fileName;

    if (process.argv[3]) {
        return fileName = getFileName();
    }
    let versionNum = process.argv[4];
    let userAnswer = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    //push to prod pipes
    function pushPipes() {
        src('./ui-js/wsu-ui.js')
            .pipe(dest('../wsu-body-ui-prod/js')); //works
        src('./ui-global-styles/css/*.css')
            .pipe(dest('../wsu-body-ui-prod/css')); // works
        src('./ui-global-styles/css/min/*.css')
            .pipe(dest('../wsu-body-ui-prod/css')); //works
        src('./ui-mod-base/css/*.css')
            .pipe(dest('../wsu-body-ui-prod/css')); //works
        src('./ui-mod-base/css/min/*.css')
            .pipe(dest('../wsu-body-ui-prod/css')); //works
        src('./ui-utilities-master/*')
            .pipe(dest('../wsu-body-ui-prod/ui-utilities-master')); //works
        if (fileName) {
            src('./ui-local-build/modules/' + fileName + '/*')
                .pipe(dest('../wsu-body-ui-prod/modules/' + fileName)); // works
        }
    }

    //push necessary files from dev to prod and prompt user
    function pushToProd() {
        userAnswer.question('You are about to overwrite production files. Are you sure? Enter y for "yes" or n for "no"\n', (key) => {
            if (key === '\u0079') {
                pushPipes();
                userAnswer.close();
            } else if (key === '\u006E') {
                console.log('You entered no.');
                return exit();
            } else {
                console.log('Wrong character entry. Please enter y or n.');
                pushToProd();
            }

        });
    }
    cb();

    pushToProd();
}


/************************************* exports *************************************************/

exports.branchmod = branchMod; //takes arg for branch name = module name
exports.newmod = newMod; //takes arg for module name
exports.deletebranch = undoBranch; //takes arg for branch name
exports.deletemod = deleteMod; //takes arg for module name
exports.buildtest = buildTest; //takes arg of "--last-mod" or any module name
exports.deletetest = deleteTest; //Deletes css-test folder and all contents
exports.mergemod = mergeMod; // takes arg for module name. Switch and merger back to master, compile and minify ui-mod-base.scss => ui-mod-base.css
exports.pushmod = finalModPush; //takes mod-name and commit version args in that order
