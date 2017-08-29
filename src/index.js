const _ = require('lodash')
const __ = require('flatory')

const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

class Dcfg {
    constructor(options = {}) {
        this._values = {}

        _.defaults(this, options, {
            baseDir: __dirname,
            evalName: 'config',
            store: null
        })

        if (!global._dcfg_loaded) {
            this.initialize()
            global._dcfg_loaded = true
        }
        return this._values
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

    // readScope(filePath) {
    //     return {
    //         scope: path
    //             .relative(path.dirname(filePath), filePath)
    //             .replace(path.extname(filePath), '')
    //             .replace(path.sep, '.'),
    //         config: require(filePath)
    //     }
    // }

    // loadConfigItems(configMap, configItems) {
    //     configMap = (configMap || {})

    //     _.forEach(configItems, (filePath) => {
    //         const configScope = config.readScope(filePath)

    //         _.defaultsDeep(
    //             configScope.config,
    //             configMap[configScope.scope]
    //         )

    //         configMap[configScope.scope] = configScope.config
    //     }, this)

    //     return configMap
    // }

    parse(configPath) {
        console.log(configPath)
        const configMap = {}

        // try {
        //     const baseConfigItems = __(configPath).getChildItems(/\.(js|json)$/g)
        //     configMap = config.loadConfigItems(configMap, baseConfigItems)

        //     if (!_.isEmpty(process.env.NODE_ENV) && !_.isEqual(process.env.NODE_ENV, "local")) {
        //         const scopeDir = path.join(configPath, process.env.NODE_ENV)
        //         fs.existsSync(scopeDir)

        //         const scopeConfigItems = __(configPath, process.env.NODE_ENV)
        //             .getChildItems(/\.(js|json)$/g)
        //         configMap = config.loadConfigItems(configMap, scopeConfigItems)
        //     }
        // } catch (e) {
        //     throw e
        // }

        return configMap
    }

    initialize() {
        const basePath = this.getBasePath()

        _.forEach(process.mainModule.paths, (nodeModulePath) => {
            const isChildPath = /^((?!\.\.\/).)*$/g.test(
                path.relative(basePath, nodeModulePath)
            )

            if (!isChildPath) {
                return
            }

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

                if (fs.existsSync(configPath)) {
                    _.extend(this._values, this.parse(configPath))
                }
            } catch (e) {
                throw e
            }
        }, this)

        // _.extend(
        //     this._values,
        //     config.parse(baseConfigPath)
        // )

        return this
    }

    get(path) {
        return _.get(this._values, path)
    }

    set(path, value) {
        return _.set(this._values, path, value)
    }
}

module.exports = Dcfg
module.exports.CouchDbStore = require('./stores/couchdb')
