import * as firebase from 'firebase/app';


interface Doc<T> {
    id: string;
    data: T
}

interface XWatchOptions<T> {
    onError?: (error: Error)=>void,
    snapListenOpts?: firebase.firestore.SnapshotListenOptions,
    snapOpts?: firebase.firestore.SnapshotOptions
    hooks?: {
        afterAdded?: (doc: Doc<T>) => void,
        afterMofified?: (oldDoc: Doc<T>, newDoc: Doc<T>, oldIndex?: number, newIndex?: number) => void, // old/new index olny in arrays
        afterRemoved?: (removedDoc: Doc<T>) => void,
    }
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
declare module 'firebase/app' {
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
    xGet: (xOpts?: XGetOptions) => Promise< Doc<T> >;
    xWatch: (data: Doc<T>, xOpts?: XWatchOptions<T>) => firebase.Unsubscribe;
    set(data: T, options?: firebase.firestore.SetOptions): Promise<void>;
    update: ((data: Partial<T>) => Promise<void>) | ((field: keyof T | firebase.firestore.FieldPath, value: any, ...moreFieldsAndValues: any[]) => Promise<void>);
}

export interface ColRef<T> extends Omit<firebase.firestore.CollectionReference, 'add' | 'doc' | 'endAt' | 'endBefore' | 'limit' | 'orderBy' | 'startAfter' | 'startAt' | 'where'> {
    xGet: (xOpts?: XGetOptions) => Promise< Array<Doc<T>> >;
    xWatch: (data: Array< Doc<T> >, xOpts?: XWatchOptions<T>) => firebase.Unsubscribe; 
    add: (data: T) => Promise< DocRef<T> >;
    doc(documentPath?: string): DocRef<T>;

    // Typed queries
    endAt(snapshot: DocSnap<T>): Query<T>;
    endAt(...fieldValues: any[]): Query<T>;
    endBefore(snapshot: firebase.firestore.DocumentSnapshot): Query<T>;
    endBefore(...fieldValues: any[]): Query<T>;
    limit(limit: number): Query<T>;
    orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): Query<T>;
    startAfter(snapshot: firebase.firestore.DocumentSnapshot): Query<T>;
    startAfter(...fieldValues: any[]): Query<T>;
    startAt(snapshot: firebase.firestore.DocumentSnapshot): Query<T>;
    startAt(...fieldValues: any[]): Query<T>;
    where(fieldPath: keyof T | firebase.firestore.FieldPath, opStr: firebase.firestore.WhereFilterOp, value: any): Query<T>;
    
}

export interface Query<T> extends Omit<firebase.firestore.Query, 'endAt' | 'endBefore' | 'limit' | 'orderBy' | 'startAfter' | 'startAt' | 'where'> {
    xGet(xOpts?: XGetOptions): Promise< Array<Doc<T>> >;
    xWatch(data: Array< Doc<T> >, xOpts?: XWatchOptions<T>): firebase.Unsubscribe;

    // Chained queries
    endAt(snapshot: DocSnap<T>): Query<T>;
    endAt(...fieldValues: any[]): Query<T>;
    endBefore(snapshot: firebase.firestore.DocumentSnapshot): Query<T>;
    endBefore(...fieldValues: any[]): Query<T>;
    limit(limit: number): Query<T>;
    orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): Query<T>;
    startAfter(snapshot: firebase.firestore.DocumentSnapshot): Query<T>;
    startAfter(...fieldValues: any[]): Query<T>;
    startAt(snapshot: firebase.firestore.DocumentSnapshot): Query<T>;
    startAt(...fieldValues: any[]): Query<T>;
    where(fieldPath: keyof T | firebase.firestore.FieldPath, opStr: firebase.firestore.WhereFilterOp, value: any): Query<T>;

}

export interface DocSnap<T> extends firebase.firestore.DocumentSnapshot {
    // TODO somewhere in future if I will find it usefull
}


// ==============================================================
//    Firestore prototype augmentation  (implementation)
// ==============================================================
const empty = function() {};

async function xGetDocument<T>(
        this: firebase.firestore.DocumentReference,
        xOpts: XGetOptions = {}
            ): Promise< Doc<T|undefined> > {
                
    const getOpts = xOpts.getOpts;
    const snapOpts = xOpts.snapOpts;

    const docRef = await this.get(getOpts);
    return {id: docRef.id, data: docRef.data(snapOpts) as T | undefined};
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
        }
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

    const hooks = xOpts.hooks || {}
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
            afterAdded({id, data: newData});
        }
        else if (data.data && !newData) {
            // Removed
            data.data = newData;
            afterRemoved({id, data: oldData});
        }
        else {
            // Modified
            data.data = newData;
            afterMofified({id, data: oldData}, {id, data: newData as T})
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

    const hooks = xOpts.hooks || {}
    let afterAdded    = hooks.afterAdded    || empty;
    let afterMofified = hooks.afterMofified || empty;
    let afterRemoved  = hooks.afterRemoved  || empty;

    const off = this.onSnapshot(snapListenOpts, (querySnap: firebase.firestore.QuerySnapshot) => {

        // TODO INCLUDE MULTIPLE CHANGES OF INDEXES AT ONCE - test offline !!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
        querySnap.docChanges().forEach( (docChange: firebase.firestore.DocumentChange) => {

            const id = docChange.doc.id;
            const oldIndex = docChange.oldIndex;
            const newIndex = docChange.newIndex;
            const oldDoc = {id, data: data[ oldIndex ].data};
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
                data.splice(oldIndex, 1);
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
