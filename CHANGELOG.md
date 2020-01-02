# Changelog

* **3.0.1** - 2019-12-31  
Address correction to be able to use backslashes

```javascript
let client = new SambaClient({
    address: '\\\\server\\folder', // required
    username: 'test', // not required, defaults to guest
    password: 'test', // not required
    domain: 'WORKGROUP' // not required
});
```

* **3.0.0** - 2019-12-31  
Fork project <https://github.com/eflexsystems/node-samba-client>
