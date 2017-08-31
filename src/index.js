const _ = require('lodash')
const __ = require('flatory')

const flat = require('flat')
const dotenv = require('dotenv')
const async = require('async')

const path = require('path')
const fs = require('fs')
const EventEmitter = require('events')

class Dcfg extends EventEmitter {

    constructor(options = {}, done = _.noop) {
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

        async.mapSeries(this.dbs, (dbName, callback) => {
            return this._adapter(dbName, nodeEnv)
                .read((error, values) => {
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

    get(path) {
        return _.get(this._values, path)
    }

    set(path, value) {
        this._adapter(
            // save to private config db
            _.last(this.dbs),
            // surfix enviroment
            this.getNodeEnv()
        ).write(path, value)

        this.emit('saved', path, value)
        return _.set(this._values, path, value)
    }
}

module.exports = Dcfg
module.exports.CouchDbStore = require('./stores/couchdb')
