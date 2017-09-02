# dcfg
Configuration manager for distributed nodejs applications

How to use

```javascript
const Dcfg = require('../')
const CouchDbStore = Dcfg.CouchDbStore

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
    // dcfg.set('foo', 'bar23123')
    // dcfg.unset('foo')
    // dcfg.get('foo')
})
```
