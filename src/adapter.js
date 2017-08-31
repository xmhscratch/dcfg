class Adapter {

	constructor(store) {
		this.store = store
		return this
	}

	load(dbName, nodeEnv) {
		dbName = `${dbName}_${nodeEnv}`

		this.store.exist(dbName, (error, isExist) => {
			if (error) {}

			if (isExist) {

			}
		})
	}

	read() {
		return this.store.read(dbName, (error, results) => {
			values = unflatten(results)
			return done(error, values)
		})
	}
}

module.exports = Adapter
