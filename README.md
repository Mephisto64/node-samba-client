# node-samba-client

Node.js wrapper for smbclient

## Requirements

Requires Node.js 10+
Smbclient must be installed. This can be installed on Ubuntu with `sudo apt-get install smbclient`.

Testing with smblient 4.9.1

## API

```javascript
const SambaClient = require('samba-client');

const client = new SambaClient({
    address: '//server/folder', // required (Can use '\\\\server\\folder' syntaxe)
    username: 'test', // not required, defaults to guest
    password: 'test', // not required
    domain: 'WORKGROUP' // not required
});

// send a file
await client.sendFile('somePath/file', 'destinationFolder/name');

// get a file
await client.getFile('someRemotePath/file', 'destinationFolder/name');
```
