import * as firebase from 'firebase';
const deepCopy = require('deepcopy');



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
        afterAdded?: (doc: Doc<T>) => void,
        // TODO - consider remove providing old docs due to performance
        afterMofified?: (oldDoc: Doc<T>, newDoc: Doc<T>, oldIndex?: number, newIndex?: number) => void, // old/new index olny in arrays
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


// ==============================================================
//    Stronger typings for firestore  (they allow you to use <T>)
//        let colRef: ColRef<YourType> = db.collection('colName') as ColRef<YourType>;
// ==============================================================
export interface DocRef<T> extends Omit<firebase.firestore.DocumentReference, 'set' | 'update'> {
    xGet(xOpts?: XGetOptions): Promise< Doc<T> >;
    xWatch(data: Doc<T>, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;
    set(data: T, options?: firebase.firestore.SetOptions): Promise<void>;
    update(data: Partial<T>): Promise<void>;
    update(field: keyof T | firebase.firestore.FieldPath, value: any, ...moreFieldsAndValues: any[]): Promise<void>;
}

export interface ColRef<T> extends Omit<firebase.firestore.CollectionReference, 'add' | 'doc' | 'endAt' | 'endBefore' | 'limit' | 'orderBy' | 'startAfter' | 'startAt' | 'where'> {
    xGet(xOpts?: XGetOptions): Promise< Array<Doc<T>> >;
    xWatch(data: Array< Doc<T> >, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;
    add(data: T): Promise< DocRef<T> >;
    doc(documentPath?: string): DocRef<T>;

    // Typed queries
    endAt(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    endAt(...fieldValues: any[]): TQuery<T>;
    endBefore(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    endBefore(...fieldValues: any[]): TQuery<T>;
    limit(limit: number): TQuery<T>;
    orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): TQuery<T>;
    startAfter(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    startAfter(...fieldValues: any[]): TQuery<T>;
    startAt(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    startAt(...fieldValues: any[]): TQuery<T>;
    where(fieldPath: keyof T | firebase.firestore.FieldPath, opStr: firebase.firestore.WhereFilterOp, value: any): TQuery<T>;

}

export interface TQuery<T> extends Omit<firebase.firestore.Query, 'endAt' | 'endBefore' | 'limit' | 'orderBy' | 'startAfter' | 'startAt' | 'where'> {
    xGet(xOpts?: XGetOptions): Promise< Array<Doc<T>> >;
    xWatch(data: Array< Doc<T> >, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;

    // Chained queries
    endAt(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    endAt(...fieldValues: any[]): TQuery<T>;
    endBefore(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    endBefore(...fieldValues: any[]): TQuery<T>;
    limit(limit: number): TQuery<T>;
    orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): TQuery<T>;
    startAfter(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    startAfter(...fieldValues: any[]): TQuery<T>;
    startAt(snapshot: firebase.firestore.DocumentSnapshot): TQuery<T>;
    startAt(...fieldValues: any[]): TQuery<T>;
    where(fieldPath: keyof T | firebase.firestore.FieldPath, opStr: firebase.firestore.WhereFilterOp, value: any): TQuery<T>;

}

// export interface DocSnap<T> extends firebase.firestore.DocumentSnapshot {
//     // TODO somewhere in future if I will find it usefull
// }


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
            afterMofified({id, data: oldData}, {id, data: newData as T});
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

    const off = this.onSnapshot(snapListenOpts, (querySnap: firebase.firestore.QuerySnapshot) => {

        // optimization
        let oldData: Array<Doc<T>> = data;
        if (afterRemoved !== empty) {
            // In case if modification happens and index has changed indexes of other documents may changed
            oldData = deepCopy(data);
        }

        querySnap.docChanges().forEach( (docChange: firebase.firestore.DocumentChange) => {

            const id = docChange.doc.id;
            const oldIndex = docChange.oldIndex;
            const newIndex = docChange.newIndex;
            let   oldDoc = oldData[oldIndex];
            const newDoc = {id, data: docChange.doc.data(snapOpts) as T};

            if (docChange.type === 'added') {
                data.splice(newIndex, 0, newDoc);
                afterAdded(newDoc);
            }
            else if (docChange.type === 'modified') {

                if (oldIndex === newIndex) {
                    data[oldIndex] = newDoc; // in-place update
                }
                else {
                    data.splice(oldIndex, 1); // remove from previous position
                    data.splice(newIndex, 0, newDoc); // add to new position
                }
                afterMofified(oldDoc, newDoc, oldIndex, newIndex);
            }
            else if (docChange.type === 'removed') {
                oldDoc = data.splice(oldIndex, 1)[0];
                afterRemoved(oldDoc);
            }
        });
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