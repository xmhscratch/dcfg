const _ = require('lodash')
const __ = require('flatory')

const flat = require('flat')
const dotenv = require('dotenv')
const async = require('async')

const path = require('path')
const fs = require('fs')
const EventEmitter = require('events')

const Adapter = require('./adapter')

class Dcfg extends EventEmitter {

    constructor(options = {}, done = _.noop) {
        super()

        this._values = {}

        const nodeEnv = this.getNodeEnv()
        _.defaults(this, options, {
            // [shared, shared, ..., private]
            dbs: [],
            baseDir: __dirname,
            evalName: 'config',
            store: null,
        })

        this._adapter = new Adapter(this.store)

        if (!global._dcfg_loaded) {
            this.initialize(done)
            global._dcfg_loaded = true
        }

        return this
    }

    getBasePath() {
        const nodeModuleBasePath = _.find(process.mainModule.paths, (nodeModulePath) => {
            const basePath = path.dirname(nodeModulePath)
            const packageFile = path.resolve(basePath, 'package.json')

            return fs.existsSync(nodeModulePath)
                && fs.existsSync(packageFile)
        }, this)

        return path.dirname(nodeModuleBasePath) || __dirname
    }

    readScope(filePath) {
        return {
            scope: path
                .relative(path.dirname(filePath), filePath)
                .replace(path.extname(filePath), '')
                .replace(path.sep, '.'),
            config: require(filePath)
        }
    }

    loadConfigItems(configMap, configItems) {
        configMap = (configMap || {})

        _.forEach(configItems, (filePath) => {
            const configScope = this.readScope(filePath)

            _.defaultsDeep(
                configScope.config,
                configMap[configScope.scope]
            )

            configMap[configScope.scope] = configScope.config
        }, this)

        return configMap
    }

    parse(configPath) {
        const configMap = {}

        try {
            const baseConfigItems = __(configPath).getChildItems(/\.(js|json)$/g)
            this.loadConfigItems(configMap, baseConfigItems)

            const nodeEnv = this.getNodeEnv()
            if (!_.isEqual(nodeEnv, "local")) {
                const scopeDir = path.join(configPath, nodeEnv)
                fs.existsSync(scopeDir)

                const scopeConfigItems = __(configPath, nodeEnv)
                    .getChildItems(/\.(js|json)$/g)
                this.loadConfigItems(configMap, scopeConfigItems)
            }
        } catch (e) {
            throw e
        }

        return configMap
    }

    getNodeEnv() {
        return process.env.NODE_ENV || 'local'
    }

    initialize(done) {
        const basePath = this.getBasePath()

        _.forEach(process.mainModule.paths, (nodeModulePath) => {
            const isChildPath = /^((?!\.\.\/).)*$/g.test(
                path.relative(basePath, nodeModulePath)
            )
            if (!isChildPath) return

            try {
                const envFile = path.resolve(basePath, '.env')
                if (fs.existsSync(envFile)) {
                    dotenv.config({
                        silent: false,
                        encoding: 'utf8',
                        path: envFile
                    })
                }

                const configPath =  path.resolve(
                    path.dirname(nodeModulePath), this.evalName
                )

                if (_.isEqual(basePath, configPath)) return
                if (!/^.*\/config$/g.test(configPath)) return

                if (fs.existsSync(configPath)) {
                    _.extend(this._values, this.parse(configPath))
                }
            } catch (e) {
                throw e
            }
        }, this)

        const nodeEnv = this.getNodeEnv()

        if (_.isEmpty(this.dbs)) {
            this.emit('ready', this._values)
            return this
        }

        async.mapSeries(this.dbs, (dbName, callback) => {
            return this._adapter
                .read(dbName, nodeEnv, (error, values) => {
                    if (error) {
                        this.emit('error', error)
                    } else {
                        _.extend(this._values, values)
                    }

                    return callback(null, error)
                })
        }, (noop, error) => {
            this.emit('ready', this._values)
            return done(error, this._values)
        })

        return this
    }

    get(keyPath, defaultValue) {
        return _.get(this._values, keyPath, defaultValue)
    }

    set(keyPath, value) {
        const nodeEnv = this.getNodeEnv()

        // save to private config db
        this._adapter.write(
            _.last(this.dbs), nodeEnv, keyPath, value,
            (error, results) => {
                this.emit('change', keyPath, value)
            }
        )

        return _.set(this._values, keyPath, value)
    }

    unset(keyPath) {
        const nodeEnv = this.getNodeEnv()

        // save to private config db
        this._adapter.delete(
            _.last(this.dbs), nodeEnv, keyPath,
            (error, results) => {
                this.emit('delete', keyPath)
            }
        )

        return _.set(this._values, keyPath, undefined)
    }
}

module.exports = Dcfg
module.exports.CouchDbStore = require('./stores/couchdb')
