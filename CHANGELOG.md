# Changelog

* **3.0.2** - 2020-01-02  
Correction of file names with space in getFile

```javascript
const SambaClient = require('smb-unix-client');

const test = async () => {
    const client = new SambaClient({
        address: '\\\\server\\folder', // required
        username: 'test', // not required, defaults to guest
        password: 'test', // not required
        domain: 'WORKGROUP' // not required
    });

    await client.getFile('folder with space\\new file', '/tmp/new file');
};

test();
```

* **3.0.1** - 2019-12-31  
Address correction to be able to use backslashes

```javascript
const SambaClient = require('smb-unix-client');

const client = new SambaClient({
    address: '\\\\server\\folder', // required
    username: 'test', // not required, defaults to guest
    password: 'test', // not required
    domain: 'WORKGROUP' // not required
});
```

* **3.0.0** - 2019-12-31  
Fork project <https://github.com/eflexsystems/node-samba-client>
