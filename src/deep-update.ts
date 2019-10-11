export function deepUpdate(target: any, source: any) {
    
    for (let k of Object.keys(source)) {
        let sourceVal = source[k];        
        
        if (typeof sourceVal !== 'object') {
            // PRIMITIVE property
            if (target[k] !== sourceVal) {
                target[k] = sourceVal;
            }

        }
        else {            
            // NON-PRIMITIVE property

            if ( ! Array.isArray(sourceVal)) {
                // NON-ARRAY OBJECT property
                if (typeof target[k] !== 'object') {
                    target[k] = {};
                }
                deepUpdate(target[k], source[k]);
            }
            else {
                // ARRAY OBJECT proerty

                if ( !Array.isArray(target[k]) ) {
                    target[k] = new Array(sourceVal.length);
                }
                            
                // Trim in case if target.length > source.length
                if (target[k].length > sourceVal.length) {
                    target[k].splice(sourceVal.length, target[k].length-sourceVal.length);
                }

                for (let i of sourceVal.keys()) {
                    // LOOP ARRAY OBJECT items
                    
                    if (typeof source[k][i] !== 'object') {
                        // ARRAY ITEM = PRIMITIVE
                        if (target[k][i] !== sourceVal[i]) {
                            target[k][i] = sourceVal[i];
                        } 
                    }
                    else {
                        // ARRAY ITEM = NON-PRIMITIVE
                        if ( ! Array.isArray(sourceVal[i])) {
                            // ARRAY ITEM = OBJECT
                            if (typeof target[k][i] !== 'object') {
                                target[k][i] = {};
                            }
                            deepUpdate(target[k][i], sourceVal[i]);
                        }
                        else {
                            // ARRAY ITEM = ARRAY
                            if ( ! Array.isArray(target[k][i])) {
                                target[k][i] = new Array(sourceVal[i]);
                            }
                            
                            // Trim in case if target.length > source.length
                            if (target[k][i].length > sourceVal[i].length) {
                                target[k][i].splice(sourceVal[i].length, target[k][i].length-sourceVal[i].length);
                            }

                            deepUpdate(target[k][i], sourceVal[i]);
                        }
                    }
                }
            }
        }
    }

    // Remove extra properties
    if (typeof target === 'object') {
        if (Object.keys(target).length > Object.keys(source).length) {

            if (Array.isArray(target)) {
                // ARRAY trim items
                // `source` is Array implicitly based on logic of this function
                target.splice((source as any).length, target.length - (source as any).length);
            }
            else {
                // OBJECT trim properties
                for (let k of Object.keys(target)) {
                    if ( ! source.hasOwnProperty(k)) {
                        delete target[k];
                    }
                }
            }

        }
    }

    // Target would be updated without this but it will allow users to produce better code
    return target;
}
