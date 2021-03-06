'use strict';

const path = require('path');

const describe = require('mocha').describe;
const it = require('mocha').it;

const chai = require('chai');

chai.use(require('chai-as-promised'));

const expect = chai.expect;

const proxyquire = require('proxyquire');
const notStubbedBemConfig = require('..');

function config(conf) {
    return proxyquire('..', {
        'betterc'() {
            return Promise.resolve(conf || [{}]);
        }
    });
}

describe('async', () => {
    it('should return empty config', () => {
        const bemConfig = config();

        return expect(bemConfig().configs()).to.eventually.deep.equal([{}]);
    });

    it('should return empty config if empty map passed', () => {
        const bemConfig = config([{}]);

        return expect(bemConfig().configs()).to.eventually.deep.equal([{}]);
    });

    it('should return configs', () => {
        const bemConfig = config([
            { test: 1 },
            { test: 2 }
        ]);

        return expect(bemConfig().configs()).to.eventually.deep.equal(
            [{ test: 1 }, { test: 2 }]
        );
    });

    // root()
    it('should return project root', () => {
        const bemConfig = config([
            { test: 1, __source: 'some/path' },
            { test: 2, root: true, __source: __filename },
            { other: 'field', __source: 'some/other/path' }
        ]);

        return expect(bemConfig().root()).to.eventually.equal(
            path.dirname(__filename)
        );
    });

    // get()
    it('should return merged config', () => {
        const bemConfig = config([
            { test: 1 },
            { test: 2 },
            { other: 'field' }
        ]);

        return expect(bemConfig().get()).to.eventually.deep.equal(
            { test: 2, other: 'field' }
        );
    });

    // level()
    it('should return undefined if no levels in config', () => {
        const bemConfig = config();

        return expect(bemConfig().level('l1')).to.eventually.equal(
            undefined
        );
    });

    it('should return undefined if no level found', () => {
        const bemConfig = config([{
            levels: {
                l1: {
                    some: 'conf'
                }
            }
        }]);

        return expect(bemConfig().level('l2')).to.eventually.equal(
            undefined
        );
    });

    it('should return level if no __source provided', () => {
        const bemConfig = config([{
            levels: {
                'path/to/level': {
                    test: 1
                }
            },
            something: 'else'
        }]);

        return expect(bemConfig().level('path/to/level')).to.eventually.deep.equal(
            { test: 1, something: 'else' }
        );
    });

    it('should return level with __source', () => {
        const bemConfig = config([{
            levels: {
                'path/to/level': {
                    test: 1
                }
            },
            something: 'else',
            __source: path.join(process.cwd(), path.basename(__filename))
        }]);

        return expect(bemConfig().level('path/to/level')).to.eventually.deep.equal(
            { test: 1, something: 'else' }
        );
    });

    it('should resolve wildcard levels', () => {
        const bemConfig = config([{
            levels: {
                'l*': {
                    test: 1
                }
            },
            something: 'else'
        }]);

        return Promise.all([
            expect(bemConfig({ cwd: path.resolve(__dirname, 'mocks') }).level('level1')).to.eventually.deep.equal(
                { test: 1, something: 'else' }
            ),

            expect(bemConfig({ cwd: path.resolve(__dirname, 'mocks') }).level('level2')).to.eventually.deep.equal(
                { test: 1, something: 'else' }
            )
        ]);
    });

    it('should resolve wildcard levels with absolute path', () => {
        const conf = {
            levels: {},
            something: 'else'
        };

        conf.levels[path.join(__dirname, 'mocks', 'l*')] = { test: 1 };

        const bemConfig = config([conf]);

        return expect(bemConfig({ cwd: path.resolve(__dirname, 'mocks') }).level('level1')).to.eventually.deep.equal(
            { test: 1, something: 'else' }
        );
    });

    it('should return globbed levels map', () => {
        const mockDir = path.resolve(__dirname, 'mocks');
        const levelPath = path.join(mockDir, 'l*');
        const levels = {};

        levels[levelPath] = { some: 'conf1' };

        const bemConfig = config([{
            levels,
            libs: {
                'lib1': {
                    levels
                }
            },
            __source: mockDir
        }]);

        const expected = {};
        expected[path.join(mockDir, 'level1')] = { some: 'conf1' };
        expected[path.join(mockDir, 'level2')] = { some: 'conf1' };

        return expect(bemConfig().levelMap()).to.eventually.deep.equal(
            expected
        );
    });

    it('should respect absolute path for level', () => {
        const bemConfig = config([{
            levels: {
                '/path/to/level': {
                    test: 1
                }
            },
            something: 'else'
        }]);

        return expect(bemConfig().level('/path/to/level')).to.eventually.deep.equal(
            { test: 1, something: 'else' }
        );
    });

    it('should respect "." path', () => {
        const bemConfig = config([{
            levels: {
                '.': {
                    test: 1
                }
            },
            something: 'else'
        }]);

        return expect(bemConfig().level('.')).to.eventually.deep.equal(
            { test: 1, something: 'else' }
        );
    });

    it('should return extended level config merged from different configs', () => {
        const bemConfig = config([{
            levels: {
                level1: {
                    'l1o1': 'l1v1'
                }
            },
            common: 'value'
        }, {
            levels: {
                level1: {
                    'l1o2': 'l1v2'
                }
            }
        }]);

        const expected = {
            l1o1: 'l1v1',
            l1o2: 'l1v2',
            common: 'value'
        };

        return expect(bemConfig().level('level1')).to.eventually.deep.equal(
            expected
        );
    });

    it('should not extend with configs higher then root', () => {
        const bemConfig = config([{
            levels: {
                level1: {
                    l1o1: 'should not be used',
                    l1o2: 'should not be used either'
                }
            }
        }, {
            levels: {
                level1: {
                    something: 'from root level',
                    l1o1: 'should be overwritten'
                }
            },
            root: true
        }, {
            levels: {
                level1: {
                    l1o1: 'should win'
                }
            }
        }]);

        return expect(bemConfig().level('level1')).to.eventually.deep.equal(
            { something: 'from root level', l1o1: 'should win' }
        );
    });

    it.skip('should use last occurrence of array option', () => {

    });

    it.skip('should respect extend for options', () => {

    });

    // levelMap()
    it('should return empty map on levelMap if no levels found', () => {
        const bemConfig = config();

        return expect(bemConfig().levelMap()).to.eventually.deep.equal(
            {}
        );
    });

    it('should return levels map', () => {
        const bemConfig = config([{
            levels: {
                l1: {
                    some: 'conf1'
                }
            },
            libs: {
                lib1: {
                    levels: {
                        l1: {
                            some: 'conf1'
                        }
                    }
                }
            }
        }]);

        const expected = {};
        expected[path.resolve('l1')] = { some: 'conf1' };

        // because of mocked rc, all instances of bemConfig has always the same data
        return expect(bemConfig().levelMap()).to.eventually.deep.equal(
            expected
        );
    });

// library()
    it('should return undefined if no libs in config', () => {
        const bemConfig = config();

        return expect(bemConfig().library('lib1')).to.eventually.deep.equal(
            undefined
        );
    });

    it('should return undefined if no library found', () => {
        const bemConfig = config([{
            libs: {
                'lib1': {
                    conf: 'of lib1',
                    path: 'libs/lib1'
                }
            }
        }]);

        return expect(bemConfig().library('lib2')).to.eventually.deep.equal(
            undefined
        );
    });

    it('should return library config', () => {
        const conf = [{
            libs: {
                'lib1': {
                    conf: 'of lib1',
                    path: 'libs/lib1'
                }
            }
        }];

        const bemConfig = config(conf);

        return bemConfig().library('lib1')
            .then(lib => {
                return lib.get().then(libConf => {
                    // because of mocked rc, all instances of bemConfig has always the same data
                    return expect(libConf).to.deep.equal(conf[0]);
                });
            });
    });

    // module()
    it('should return undefined if no modules in config', () => {
        const bemConfig = config();

        return expect(bemConfig().module('m1')).to.eventually.equal(
            undefined
        );
    });

    it('should return undefined if no module found', () => {
        const bemConfig = config([{
            modules: {
                m1: {
                    conf: 'of m1'
                }
            }
        }]);

        return expect(bemConfig().module('m2')).to.eventually.equal(
            undefined
        );
    });

    it('should return module', () => {
        const bemConfig = config([{
            modules: {
                m1: {
                    conf: 'of m1'
                },
                m2: {
                    conf: 'of m2'
                }
            }
        }]);

        return expect(bemConfig().module('m1')).to.eventually.deep.equal(
            { conf: 'of m1' }
        );
    });

    it('should respect rc options', () => {
        const pathToConfig = path.resolve(__dirname, 'mocks', 'argv-conf.json');
        const opts = {
            defaults: { conf: 'def' },
            pathToConfig: pathToConfig,
            fsRoot: process.cwd(),
            fsHome: process.cwd()
        };

        const expected = { conf: 'def', argv: true, __source: pathToConfig };

        return expect(notStubbedBemConfig(opts).get()).to.eventually.deep.equal(
            expected
        );
    });

// TODO: add test for
// resolving, e.g. projectRoot
// 'should override default config with .bemrc'
// 'should not override default levels if none in .bemrc provided'
// 'should not mutate defaults'

    it('should return common config if no levels provided', () => {
        const bemConfig = config([
            { common: 'value' }
        ]);

        return expect(bemConfig().level('level1')).to.eventually.deep.equal(
            { common: 'value' }
        );
    });

    it('should respect extendedBy from rc options', () => {
        const pathToConfig = path.resolve(__dirname, 'mocks', 'argv-conf.json');
        const actual = notStubbedBemConfig({
            defaults: {
                levels: {
                    'path/to/level': {
                        test1: 1,
                        same: 'initial'
                    }
                },
                common: 'initial',
                original: 'blah'
            },
            extendBy: {
                levels: { 'path/to/level': { test2: 2, same: 'new' } },
                common: 'overriden',
                extended: 'yo'
            },
            pathToConfig: pathToConfig,
            fsRoot: process.cwd(),
            fsHome: process.cwd()
        }).level('path/to/level');

        const expected = {
            test1: 1,
            test2: 2,
            same: 'new',
            common: 'overriden',
            original: 'blah',
            extended: 'yo',
            argv: true
        };

        return expect(actual).to.eventually.deep.equal(
            expected
        );
    });
});
