/*
 * Collection of functions that will be used in the games
 *
 * Gilberto Echeverria
 * 2026-02-10
 */

"use strict";

function boxOverlap(obj1, obj2) {
    // TODO: define variables
    const L1 = obj1.position.x - obj1.halfSize.x;
    const R1 = obj1.position.x + obj1.halfSize.x;
    const T1 = obj1.position.y - obj1.halfSize.y;
    const B1 = obj1.position.y + obj1.halfSize.y;

    const L2 = obj2.position.x - obj2.halfSize.x;
    const R2 = obj2.position.x + obj2.halfSize.x;
    const T2 = obj2.position.y - obj2.halfSize.y;
    const B2 = obj2.position.y + obj2.halfSize.y;

    // Compare the values to determine if the boxes overlap
    // TODO: use the correct condition
    return (L1 < R2 && R1 > L2 && T1 < B2 && B1 > T2);
}

function randomRange(size, start) {
    return Math.floor(Math.random() * size) + ((start === undefined) ? 0 : start);
}

//export { boxOverlap, randomRange };
