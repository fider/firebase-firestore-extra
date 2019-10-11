import { deepUpdate } from '../src/deep-update'


test('example', () => {
    deepUpdate({}, {});
});

// let t: any;
// let s: any;
// function testx(t, s) {
    
//     deepUpdate(t, s);
//     console.log(JSON.stringify(t));
// }

// t = {a:1, z:1};
// s = {a:2, x:1};
// testx(t, s);

// t = [1, {a:1, z:1}, 5, 2323,2];
// s = [1, {a:2, x:[{a:2, x:1}]}, [[1, {a:1, z:1}, 5, 2323,2]]];
// testx(t, s);

// TODO remove numbers from typings
// TODO tests:
// - deepCopy of source so I can compare it with updated target
// - sourceOriginal pointer to ensure source not modified during deepUpdate (use deepRefenceEqual)
// - run deepUpdate(target, source)
// - expect deepRefenceEqual(source, originalSourceReference) // source unmodified
// - expect deepRefenceEqualSpecialWithSkipNonObjectsBasingOnOriginalTarget(originalTarget, target, originalSourceReference)
