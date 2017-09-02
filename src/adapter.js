const _ = require('lodash')
const { unflatten } = require('flat')

class Adapter {

    constructor(store) {
        this.store = store
        return this
    }

    read(name, nodeEnv, done = _.noop) {
        const dbName = `${name}_${nodeEnv}`

        this._load(dbName, () => {
            this.store.read((error, results) => {
                return done(error, unflatten(results))
            })
        })

        return this
    }

    write(name, nodeEnv, keyName, value, done = _.noop) {
        const dbName = `${name}_${nodeEnv}`

        this._load(dbName, () => {
            return this.store.write(
                keyName, value,
                (error, results) => {
                    return done(error, unflatten(results))
                }
            )
        })

        return this
    }

    delete(name, nodeEnv, keyName, value, done = _.noop) {
        const dbName = `${name}_${nodeEnv}`

        this._load(dbName, () => {
            return this.store.delete(
                keyName, value,
                (error, results) => {
                    return done(error, unflatten(results))
                }
            )
        })

        return this
    }

    _load(dbName, done = _.noop) {
        return this.store.load(dbName, (error, results) => {
            if (error) {
                throw error
            }
            return done()
        })
    }
}

module.exports = Adapter
