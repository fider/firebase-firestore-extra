import * as firebase from 'firebase';
// const deepCopy = require('deepcopy');



export interface Doc<T> {
    id: string;
    data: T;
    exists?: boolean;
}


export type Off = firebase.Unsubscribe;


interface XWatchOptions<T> {
    onError?: (error: Error) => void;
    snapListenOpts?: firebase.firestore.SnapshotListenOptions;
    snapOpts?: firebase.firestore.SnapshotOptions;
    hooks?: {
        afterAdded?: (doc: Doc<T>, index?: number) => void,
        afterMofified?: (newDoc: Doc<T>, oldIndex?: number, newIndex?: number) => void, // old/new index olny in arrays
        afterRemoved?: (removedDoc: Doc<T>) => void,
    };
}

interface XGetOptions {
    getOpts?: firebase.firestore.GetOptions;
    snapOpts?: firebase.firestore.SnapshotOptions;
}


// ==============================================================
//    Firestore type Augmentation  (type definition only)
//    To get full usage of <T> support use DocRef<T>, ColRef<T>, Query<T>:
//        let colRef: ColRef<YourType> = db.collection('colName') as ColRef<YourType>;
// ==============================================================
declare module 'firebase' {
    export namespace firestore {
        export interface DocumentReference {
            xGet: (xOpts?: XGetOptions) => Promise< Doc<any> >;
            xWatch: (data: Doc<any>, xOpts?: XWatchOptions<any>) => firebase.Unsubscribe;
        }
        export interface CollectionReference {
            xGet: (xOpts?: XGetOptions) => Promise<Array< Doc<any> >>;
            xWatch: (data: Array<Doc<any>>, xOpts?: XWatchOptions<any>) => firebase.Unsubscribe;
        }
        export interface Query {
            xGet: (xOpts?: XGetOptions) => Promise<Array< Doc<any> >>;
            xWatch: (data: Array<Doc<any>>, xOpts?: XWatchOptions<any>) => firebase.Unsubscribe;
        }
    }
}


// =====================================================================================
//    Stronger typings for firestore  (they allow you to use <T>)
//        let colRef: ColRef<YourType> = db.collection('colName') as ColRef<YourType>;
// =====================================================================================

// -----------------------------------------
//    Most often used types
// -----------------------------------------
export interface DocRef<T> extends Omit<firebase.firestore.DocumentReference,  'parent' | 'xGet' | 'xWatch' | 'set' | 'update' > {
    readonly parent: ColRef<T>;
    xGet(xOpts?: XGetOptions): Promise< Doc<T> >;
    xWatch(data: Doc<T>, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;
    set(data: T, options?: firebase.firestore.SetOptions): Promise<void>;
    update(data: Partial<T>): Promise<void>;
    update(field: keyof T | firebase.firestore.FieldPath, value: any, ...moreFieldsAndValues: any[]): Promise<void>;
}

export interface ColRef<T> extends Omit<firebase.firestore.CollectionReference, 'xGet' | 'xWatch' | 'add' | 'doc' | 'get' | 'isEqual' | 'endAt' | 'endBefore' | 'limit' | 'orderBy' | 'startAfter' | 'startAt' | 'where'> {
    xGet(xOpts?: XGetOptions): Promise< Array<Doc<T>> >;
    xWatch(data: Array< Doc<T> >, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;
    add(data: T): Promise< DocRef<T> >;
    doc(documentPath?: string): DocRef<T>;
    get(options?: firebase.firestore.GetOptions): Promise< QuerySnap<T> >;
    isEqual(other: ColRef<any>): boolean;


    // Typed queries
    endAt(snapshot: DocSnap<T>): TQuery<T>;
    endAt(...fieldValues: any[]): TQuery<T>;
    endBefore(snapshot: DocSnap<T>): TQuery<T>;
    endBefore(...fieldValues: any[]): TQuery<T>;
    limit(limit: number): TQuery<T>;
    orderBy(fieldPath: keyof T, directionStr?: firebase.firestore.OrderByDirection): TQuery<T>;
    // orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): TQuery<T>;
    startAfter(snapshot: DocSnap<T>): TQuery<T>;
    startAfter(...fieldValues: any[]): TQuery<T>;
    startAt(snapshot: DocSnap<T>): TQuery<T>;
    startAt(...fieldValues: any[]): TQuery<T>;
    where(fieldPath: keyof T | firebase.firestore.FieldPath, opStr: firebase.firestore.WhereFilterOp, value: any): TQuery<T>;

}

export interface TQuery<T> extends IOnSnapshot<T>, Omit<firebase.firestore.Query, 'onSnapshot' | 'xGet' | 'xWatch' | 'endAt' | 'endBefore' | 'limit' | 'orderBy' | 'startAfter' | 'startAt' | 'where'> {
    xGet(xOpts?: XGetOptions): Promise< Array<Doc<T>> >;
    xWatch(data: Array< Doc<T> >, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;

    // Chained queries
    endAt(snapshot: DocSnap<T>): TQuery<T>;
    endAt(...fieldValues: any[]): TQuery<T>;
    endBefore(snapshot: DocSnap<T>): TQuery<T>;
    endBefore(...fieldValues: any[]): TQuery<T>;
    limit(limit: number): TQuery<T>;
    orderBy(fieldPath: keyof T, directionStr?: firebase.firestore.OrderByDirection): TQuery<T>;
    // orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): TQuery<T>;
    startAfter(snapshot: DocSnap<T>): TQuery<T>;
    startAfter(...fieldValues: any[]): TQuery<T>;
    startAt(snapshot: DocSnap<T>): TQuery<T>;
    startAt(...fieldValues: any[]): TQuery<T>;
    where(fieldPath: keyof T | firebase.firestore.FieldPath, opStr: firebase.firestore.WhereFilterOp, value: any): TQuery<T>;


}

// -----------------------------------------
//    Internal types for advanced usage
// -----------------------------------------
export interface DocSnap<T> extends Omit<firebase.firestore.DocumentSnapshot, 'data' | 'get'> {
    data(options: firebase.firestore.SnapshotOptions): T | undefined;
    get<K extends keyof T>(fieldPath: K | firebase.firestore.FieldPath, options?: firebase.firestore.SnapshotOptions): T[K];
}

export interface QueryDocSnap<T> extends Omit<DocSnap<T>, 'exists' | 'data'> {
    readonly exists: true; // always true (In DocSnap it can be false)
    data(options: firebase.firestore.SnapshotOptions): T; // never return undefined
}

export interface IOnSnapshot<T> {
    onSnapshot(
        observer: {
            next?: (snapshot: QuerySnap<T>) => void;
            error?: (error: Error) => void;
            complete?: () => void;
        }
    ): () => void;

    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        observer: {
            next?: (snapshot: QuerySnap<T>) => void;
            error?: (error: Error) => void;
            complete?: () => void;
        }
    ): () => void;

    onSnapshot(
        onNext: (snapshot: QuerySnap<T>) => void,
        onError?: (error: Error) => void,
        onCompletion?: () => void
    ): () => void;

    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        onNext: (snapshot: QuerySnap<T>) => void,
        onError?: (error: Error) => void,
        onCompletion?: () => void
    ): () => void;
}


export interface QuerySnap<T> extends Omit<firebase.firestore.QuerySnapshot, 'docs' | 'docChanges' | 'forEach'> {
    docs: QueryDocSnap<T>[];
    docChanges(options?: firebase.firestore.SnapshotListenOptions): DocChange<T>[];
    forEach(callback: (QueryDocSnap<T>), thisArg?: any): void;
}

export interface DocChange<T> extends Omit<firebase.firestore.DocumentChange, 'doc'> {
    doc: QueryDocSnap<T>;
}



// TODO
// MOVING SUBCOLLECTIONS IS AVAILABLE ONLY IN NODE (not for web)
// Implement this library verions for nodejs   (npm install @google-cloud/firestore)


// export interface MoveOptions {
//     moveSubcollections?: boolean;
// }

// const defaultMoveOptions: Required<MoveOptions> = {
//     moveSubcollections: false
// };

// TODO implement moveTo
async function xMoveTo<T>(docRef: DocRef<T>, targetCollection: ColRef<T>, setOptions: firebase.firestore.SetOptions = {}/*, moveOptions?: MoveOptions*/) {

    let previousCollection = docRef.parent;

    if (previousCollection.isEqual(targetCollection)) {
        console.warn(`documentReference.moveTo(targetCollection) documentReference already in targetCollection. Returning this warning so you can avoid bugs in your app.`);
        return;
    }

    let docData = await docRef.xGet();
    if ( ! docData.exists) {
        throw new Error(`documentReference.moveTo(targetCollection) docId="${docRef.id}" targetCollectionId="${targetCollection.id}". Document not exists in database.`);
    }


    await targetCollection.doc(docRef.id).set( docData.data, setOptions );
    // Longer execution than Promise.all but error message is more clear
    try {
        await docRef.delete();
    }
    catch (err) {
        err.message = `documentReference.moveTo(targetCollection) docId="${docRef.id}" targetCollectionId="${targetCollection.id}`
            + ` - document with id "${docRef.id}" addedd to collection "${targetCollection.id}" but it was not removed from previous collection "${previousCollection.id}".`
            + ` - ! MOST PROBABLY you should remove it manually from old collection if it still extists there.`
            + `Details: ${err.message}`;
        throw err;
    }
}



// ==============================================================
//    Firestore prototype augmentation  (implementation)
// ==============================================================
const empty = function() { /* empty function */ };

async function xGetDocument<T>(
        this: firebase.firestore.DocumentReference,
        xOpts: XGetOptions = {}
            ): Promise< Doc<T|undefined> > {

    const getOpts = xOpts.getOpts;
    const snapOpts = xOpts.snapOpts;

    const docRef = await this.get(getOpts);
    return {
        id: docRef.id,
        data: docRef.data(snapOpts) as T | undefined,
        exists: docRef.exists
    };
}

async function xGetCollection<T>(
        this: firebase.firestore.CollectionReference | firebase.firestore.Query,
        xOpts: XGetOptions = {}
            ): Promise< Array<Doc<T>> > {

    const getOpts = xOpts.getOpts;
    const snapOpts = xOpts.snapOpts;

    let docRef = await this.get(getOpts);
    let docs = docRef.docs.map( (queryDocSnap) => {
        return {
            id: queryDocSnap.id,
            data: queryDocSnap.data(snapOpts) as T,
            exists: true
        };
    });

    return docs;
}

function xWatchDocument<T>(
        this: firebase.firestore.DocumentReference,
        data: Doc<T|undefined>,
        xOpts: XWatchOptions<T> = {}
            ) {

    if ( ! data) {
        throw new Error(`firestoreDb.xWatch(data). Did you forgot to initialize "data" object?  "data={}"  .`);
    }

    const snapListenOpts = xOpts.snapListenOpts || {};
    const snapOpts = xOpts.snapOpts;
    const onError = xOpts.onError;

    const hooks = xOpts.hooks || {};
    let afterAdded    = hooks.afterAdded    || empty;
    let afterMofified = hooks.afterMofified || empty;
    let afterRemoved  = hooks.afterRemoved  || empty;

    let off = this.onSnapshot(snapListenOpts, (docSnap) => {

        const newData = docSnap.data(snapOpts) as T | undefined;
        const oldData = data.data as T;
        const id = this.id;

        if (!data.data && newData) {
            // Added
            data.id   = id;
            data.data = newData;
            data.exists = true;
            afterAdded({id, data: newData});
        }
        else if (data.data && !newData) {
            // Removed
            data.data = newData;
            data.exists = false;
            afterRemoved({id, data: oldData});
        }
        else {
            // Modified
            data.data = newData;
            data.exists = true;
            // Old doc param removed due to performance when watching whole collection
            afterMofified(/* {id, data: oldData} ,*/ {id, data: newData as T});
        }

    }, onError);
    return off;
}

function xWatchCollection<T>(
        this: firebase.firestore.CollectionReference | firebase.firestore.Query,
        data: Array<Doc<T>>,
        xOpts: XWatchOptions<T> = {}
        ) {

    if ( ! data) {
        throw new Error(`firestoreDb.xWatch(data). Did you forgot to initialize "data" array?  "data=[]"  .`);
    }

    const onError = xOpts.onError;
    const snapListenOpts = xOpts.snapListenOpts || {};
    const snapOpts = xOpts.snapOpts;

    const hooks = xOpts.hooks || {};
    let afterAdded    = hooks.afterAdded    || empty;
    let afterMofified = hooks.afterMofified || empty;
    let afterRemoved  = hooks.afterRemoved  || empty;

    let isFirstRun = true;

    const off = this.onSnapshot(snapListenOpts, (querySnap: firebase.firestore.QuerySnapshot) => {


        // optimization
        // let oldData: Array<Doc<T>> = data;
        // Old doc param removed due to performance when watching whole collection
        // if (afterRemoved !== empty) {
        //     // In case if modification happens and index has changed indexes of other documents may changed
        //     oldData = deepCopy(data);
        // }

        querySnap.docChanges().forEach( (docChange: firebase.firestore.DocumentChange) => {

            const id = docChange.doc.id;
            const oldIndex = docChange.oldIndex;
            const newIndex = docChange.newIndex;
            // let   oldDoc = oldData[oldIndex];
            const newDoc = {id, data: docChange.doc.data(snapOpts) as T};

            if (docChange.type === 'added') {

                if (isFirstRun) {
                    // Do not duplicate data in case of watch/unwatch/watch scenario
                    let docMatch = data.filter( doc => doc.id === id )[0];
                    // indexof
                    if (docMatch) {
                        docMatch.data = newDoc.data;
                        let prevIndex = data.indexOf(docMatch);
                        if (prevIndex !== newIndex) {
                            let shift = newIndex > oldIndex ? -1 : 0;
                            data.splice(prevIndex, 1);
                            data.splice(newIndex + shift, 0, docMatch); // -1 because original array is shorter now
                        }
                    }
                    else {
                        // just add
                        data.splice(newIndex, 0, newDoc);
                    }
                }
                else {
                    data.splice(newIndex, 0, newDoc);
                }
                afterAdded(newDoc, newIndex);
            }
            else if (docChange.type === 'modified') {

                if (oldIndex === newIndex) {
                    data[oldIndex] = newDoc; // in-place update
                }
                else {
                    let shift = newIndex > oldIndex ? -1 : 0;
                    data.splice(oldIndex, 1); // remove from previous position
                    data.splice(newIndex + shift, 0, newDoc); // add to new position
                }
                // Old doc param removed due to performance when watching whole collection
                afterMofified(/*oldDoc,*/ newDoc, oldIndex, newIndex);
            }
            else if (docChange.type === 'removed') {
                let oldDoc = data.splice(oldIndex, 1)[0];
                afterRemoved(oldDoc);
            }
        });

        isFirstRun = false;

    }, onError);
    return off;
}


// ==============================================================
//    Update prototype
// ==============================================================


firebase.firestore.DocumentReference.prototype.xGet   = xGetDocument;
firebase.firestore.DocumentReference.prototype.xWatch = xWatchDocument;

firebase.firestore.CollectionReference.prototype.xGet = xGetCollection;
firebase.firestore.CollectionReference.prototype.xWatch = xWatchCollection;

firebase.firestore.Query.prototype.xGet = xGetCollection;
firebase.firestore.Query.prototype.xWatch = xWatchCollection;

export function doNotOptimizeMe() { /* Exporting it so module import will not be optimized out */}