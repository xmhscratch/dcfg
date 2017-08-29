const StoreAdapter = require('../adapter')

class CouchDbStore extends StoreAdapter {
	constructor() {
		super()
		return this
	}
}

module.exports = CouchDbStore
