---
layout: post
title: How Do Gulp Typescript Without Module Loaders
modified:
categories: technical
excerpt: Using gulp to transpile typescript and use in the browser without module loaders
tags: [vue, gulp, typescript, module loader, js, ts, gulp-typescript, systemjs]
image:
  feature:
comments: true
date: 2020-10-20T18:10:00+05:30
---

Call me old school but I still use gulp, because it's easy to comprehend over the monster webpack is. I can write
a `gulpfile.js` from scratch and modify it using streams but I wouldn't remember how to start a webpack project
without `create-app-starter`.<br/><br/>
Also, I lied, you can't do this without module loaders, but you can **almost** do it without them. Confused? So was I,
the idea is to use the module loader to do the minimum amount of work and not disrupt your workflow by a lot!<br/><br/>
My current predicament has been my own doing, and this is probably the universe sending me a signal<br/><br/>
My project consisted of a single `js/booking.js` file which I wanted to port over to *typescript* which I love.
I was foolish to think that this would take me an hour or two, I was not ready for the Pandora's box that I was about to
open.<br/><br/>
Prima Facie, my assumption was that `npm i -D typescript gulp-typescript` and a simple recipe to transform should do the
job. It wasn't that simple and boiled down to multiple reasons:

1. You cannot use *typescript* **without** a module loader. Battered and bruised, I finally resorted to using `SystemJS`
   because `amd` does not support `top-level await`. You have to add **module: "system"** in `tsconfig` for this to
   work.
2. You need to use the `outFile` option in `tsconfig.json` for it to generate a standalone file.
3. Only `SystemJS` does not cut it and you need to import `/extras/named-register.min.js` because `gulp-typescript`
   creates a named module.
4. You have to import the created module in your `index.html` using `System.import('booking.js')`.
5. Do not use `import Vue from 'vue'` syntax, instead use `import type Vue from 'vue'`. This will save you a whole lot
   of pain in trying to resolve dependencies in your files. After this, you can use a bare script tag to import Vue as a
   global in the browser.

I'm listing down the main components of all the files for your reference.

### gulpfile.js
```js
const ts = require('gulp-typescript');
const tsconfig = require('./tsconfig.json');

function js() {
  return gulp
    .src(['ts/booking.ts'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(ts({
      ...tsconfig.compilerOptions,
      outFile: 'booking.js',
    }))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browsersync.stream());
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "target": "es2017",

    "sourceMap": true,
    "module": "system",
    "removeComments": true,
    "esModuleInterop": true,

    "strict": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,

    "typeRoots": [
        "ts/declaration.d.ts",
        "node_modules/@types"
    ]
  },
}
```

### index.html
```html
<script src="path-to-vue"></script>
<script src="path-to-systemjs"></script>
<script src="path-to-systemjs-named-register"></script>
<script src="path-to-generated-booking.js"></script>
<script>
      System.import('booking');
</script>
```

Hope this helps saves a few hours of desperate *wuts*.
