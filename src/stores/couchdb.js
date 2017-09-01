const NodeCouchDb = require('node-couchdb')

class CouchDbStore {

    constructor(options = {}) {
        this.couch = new NodeCouchDb(options)
        return this
    }

    load(dbName, done) {
        return this.couch
            .createDatabase(dbName)
            .then(done)
            .catch(done)
    }

    read(dbName, done) {
        return this.couch
            .get(dbName, '_all_docs')
            .then(({ data, headers, status }) => {
                return done(null, data)
            })
            .catch(done)
    }

    write() {

    }
}

module.exports = CouchDbStore
