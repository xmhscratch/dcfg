const _ = require('lodash')
const { unflatten } = require('flat')

class Adapter {

    constructor(store) {
        this.store = store
        return this
    }

    read(name, nodeEnv, done = _.noop) {
        const dbName = `${name}_${nodeEnv}`

        this._load(dbName, (error, results) => {
            this.store.read(dbName, (error, results) => {
                return done(error, unflatten(results))
            })
        })

        return this
    }

    _load(dbName, done = _.noop) {
        this.store.load(dbName, (error, isCreated) => {
            return done(error, isCreated)
        })

        return this
    }
}

module.exports = Adapter
