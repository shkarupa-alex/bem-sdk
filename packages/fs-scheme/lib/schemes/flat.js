'use strict';

var path = require('path');
var assert = require('assert');
var BemCell = require('@bem/sdk.cell');
var bemNaming = require('@bem/sdk.naming');

var presets = require('../presets');

module.exports = {
    path: function(cell, options) {
        assert(BemCell.isBemCell(cell),
            'Provide instance of [@bem/sdk.cell](https://github.com/bem/bem-sdk/tree/master/packages/cell).'
        );

        var opts;
        var b_;

        if (!options) {
            opts = presets['origin'];
            b_ = bemNaming;
        } else if (typeof options === 'string') {
            var preset = presets[options];
            assert(preset, 'there is no such preset check options');
            opts = preset;
            b_ = bemNaming(opts.naming);
        } else {
            var defaultOpts = presets['origin'];
            opts = {
                naming: options.naming || defaultOpts.naming
            };
            b_ = bemNaming(opts.naming);
        }

        var layer = '';
        var tech = cell.tech;
        var entity = cell.entity;

        cell.layer && (layer = cell.layer + '.blocks');

        return path.join(layer,
            b_.stringify(entity) + (tech ? '.' + tech : ''));
    }
};
