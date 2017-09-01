const Dcfg = require('../')
const CouchDbStore = Dcfg.CouchDbStore
const prettyoutput = require('prettyoutput')

const config = new Dcfg({
    dbs: ['tests', 'shared'],
    baseDir: null,
    evalName: 'config',
    store: new CouchDbStore({
        host: '127.0.0.1',
        protocol: 'http',
        // port: 6984,
        // auth: {
        //     user: 'login',
        //     pass: 'secret'
        // }
    })
})

// console.log(prettyoutput(config))
