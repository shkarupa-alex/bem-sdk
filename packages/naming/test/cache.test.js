'use strict';

const test = require('ava');
const naming = require('../index');

test('should cache instance of original naming', t => {
    const instance1 = naming();
    const instance2 = naming();

    t.is(instance1, instance2);
});

test('should consider `elem` option for cache', t => {
    const instance1 = naming();
    const instance2 = naming({ delims: { elem: '==' } });

    t.not(instance1, instance2);
});

test('should consider `mod` option for cache', t => {
    const instance1 = naming();
    const instance2 = naming({ delims: { mod: '=' } });

    t.not(instance1, instance2);
});

test('should consider `wordPattern` option for cache', t => {
    const instance1 = naming();
    const instance2 = naming({ wordPattern: '[a-z]+' });

    t.not(instance1, instance2);
});

test('should cache instance of custom naming', t => {
    const opts = { delims: { elem: '__', mod: '--' } };
    const instance1 = naming(opts);
    const instance2 = naming(opts);

    t.is(instance1, instance2);
});

test('should cache instance of custom naming', t => {
    const instance1 = naming({ delims: { elem: '__', mod: '_' } });
    const instance2 = naming({ delims: { elem: '__', mod: '--' } });

    t.not(instance1, instance2);
});
