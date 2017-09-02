const Dcfg = require('../')
const CouchDbStore = Dcfg.CouchDbStore
const prettyoutput = require('prettyoutput')

const dcfg = new Dcfg({
    dbs: ['tests'],
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

dcfg.on('ready', (config) => {
    // console.log(config)
    // dcfg.unset('foo')
    // dcfg.set('foo', 'bar23123')
})
