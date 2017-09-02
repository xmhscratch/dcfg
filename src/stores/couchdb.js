const _ = require('lodash')
const NodeCouchDb = require('node-couchdb')
const MemoryCache = require('node-couchdb-plugin-memory')

class CouchDbStore {

    constructor(options = {}) {
        options.cache = options.cache || new MemoryCache()
        this.couch = new NodeCouchDb(options)
        return this
    }

    load(dbName, done) {
        this.dbName = dbName

        return this.couch._requestWrapped({
            method: 'HEAD',
            url: `${this.couch._baseUrl}/${dbName}`
        })
        .then(({ res, body }) => {
            // database already exists
            if (res.statusCode === 200) {
                return done()
            }

            // create database
            if (res.statusCode === 404) {
                return this.couch
                    .createDatabase(dbName)
                    .then(done)
            }
        })
        .catch(done)
    }

    read(done) {
        const { dbName } = this

        return this.couch
            .get(dbName, '_all_docs', {
                include_docs: true
            })
            .then(({ data, headers, status }) => {
                let results = _.map(data.rows, (value, key) => {
                    return _.omit(value.doc, ['_id', '_rev'])
                })

                results = _.reduce(results, (memo, obj, index) => {
                    memo[obj.key] = obj.value
                    return memo
                }, {})

                return done(null, results)
            })
            .catch(done)
    }

    write(keyName, value, done) {
        const { dbName } = this

        return this.couch.mango(dbName, {
            selector: {
                key: { $eq: keyName },
            }
        }, {})
        .then(({ data, headers, status }) => {
            const record = _.first(data.docs)

            if (!record) {
                return this.couch.insert(dbName, {
                    key: keyName,
                    value: value
                }).then(done)
            } else {
                return this.couch.update(dbName, {
                    _id: record._id,
                    _rev: record._rev,
                    key: keyName,
                    value: value
                }).then(done)
            }
        })
        .catch(done)
    }

    delete(keyName, done) {
        const { dbName } = this

        return this.couch.mango(dbName, {
            selector: {
                key: { $eq: keyName },
            }
        }, {})
        .then(({ data, headers, status }) => {
            const record = _.first(data.docs)

            if (!record) {
                return done()
            } else {
                return this.couch.del(
                    dbName, record._id, record._rev
                )
                .then(done)
            }
        })
        .catch(done)
    }
}

module.exports = CouchDbStore
