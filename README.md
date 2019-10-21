- [About](#about)
- [Installation & requirements](#installation-and-requirements)
- [Examples](#examples)
- [Documentation](#documentation)

# About
Cool stuff that speed up your work with Cloud Firestore Database.

If you want to contribute just create pull rquest.

# Installation and requirements
Currently web sdk only (not yet for Node.js. Expect separate package).

Tested with `"firebase": "7.2.0"` (firebase skd should be also installed with `npm i -S firebase`)

Compiled with TypeScript 3.6.3

```sh
$ npm i -S firebase-firestore-extra
```

Active augmentations in TypeScript app (when using plain JavaScript it is enough to `require('firebase-firestore-extra')` ):
```js
// Mandatory line, even if you are importing something using 'from' syntax
// In case of Angular app put it in main.ts
import 'firebase-firestore-extra';

// Then import required types, even in the same file as above import...
import { DocRef } from 'firebase-firestore-extra';

```

# Examples

## Some examples (you should be able to figure out everything on your own using typings and firestore documentation)
```js
import { Doc, DocRef, ColRef, Query } from 'firebase-firestore-extra';
import * as firebase from 'firebase';

interface IData = {
    name: string, age: number
}

// configure firebase...
let db = fireStoreDb;

// Of course await inside async function only
let colRef: ColRef<IData> = db.collection('col') as ColRef<IData>;
let docRef: DocRef<IData> = colRef.doc('docId');

let typedList: IData[] = await colRef.xGet();
let typedObj:  IData   = await docRef.xGet();

let myObject: IData = {} as any;
let unsubscribe = docRef.xWatch(myObject, {otherOptions});
// You can deduce other options from typings
// Variable myObject will be synced with database document until stop() called
unsubscribe();

let myArray: IData = {} as any;
let stop = colRef.xWatch(myArray, {otherOptions});
// You can deduce other options from typings
// Array myObject will be synced with database documents list until stop() called
unsubscribe();

// You can also query with typings
colRef.where('name', '==', 'Nejm').limit(10).xWatch(myArray, {otherOptions});

// Compilation error (you can use 'as any' to skip validation)
colRef.where('notExists_will_not_compile', ..);

// Firebase native options objects:
//
// onError handler
// firebase.firestore.GetOptions
// firebase.firestore.SnapshotOptions
// firebase.firestore.SnapshotListenOptions

// The only additional options provided by firestore-extra are hooks:
colRef.xWatch(myArray, {
    hooks: {
        afterAdded: handlerFunc // You can sound alarm if you received new document created later than Date.now()
        afterMofified: handlerFunction
        afterRemoved: handlerFunction
    }
});

// !!
// If handlerFunction will be method of some class remember to use bind

```


# Documentation

Just check examples and typings.

For more advanced use cases please check firebase/firestore documentaion and find corresponding options when usign `xGet` and `xWatch` methods
