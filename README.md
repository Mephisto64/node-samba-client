# node-samba-client

![GitHub package.json version](https://img.shields.io/github/package-json/v/Mephisto64/node-samba-client?color=r&label=npm&style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Mephisto64/node-samba-client?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/Mephisto64/node-samba-client?style=flat-square)

Nodejs [smb-unix-client](https://www.npmjs.com/package/smb-unix-client) wrapper for smbclient

Fork of [samba-client](https://github.com/eflexsystems/node-samba-client) on 2020-01-01 at version 3.0.0

## Requirements

Requires Node.js 10+
Smbclient must be installed.
This can be installed on

* Ubuntu with `sudo apt-get install smbclient`.
* Centos with `sudo yum install smbclient`.

Testing with smblient 4.9.1

## API

```javascript
const SambaClient = require('smb-unix-client');

const client = new SambaClient({
    address: '//server/share', // required (Can use '\\\\server\\share' syntax)
    username: 'test', // not required, defaults to guest
    password: 'test', // not required
    domain: 'WORKGROUP', // not required
    port: 8080, // not required
    encrypt: true
});

// send a file
await client.sendFile('somePath/file', 'destinationFolder\\name');

// get a file
await client.getFile('someRemotePath\\file', 'destinationFolder/name');
```
