'use strict';

const exec = require('child_process').exec;
const util = require('util');
const p = require('path');

const singleSlash = /\//g;
/*
 * NT_STATUS_NO_SUCH_FILE - when trying to dir a file in a directory that *does* exist
 * NT_STATUS_OBJECT_NAME_NOT_FOUND - when trying to dir a file in a directory that *does not* exist
 */
const missingFileRegex = /(NT_STATUS_OBJECT_NAME_NOT_FOUND|NT_STATUS_NO_SUCH_FILE)/im;

const fn = {
    /**
     * Protects the character string with quotes
     * @param {string} str String value to protect
     * @example the value => 'the value'
     */
    wrap(str) {
        return '\'' + str + '\'';
    },
    /**
     * Contruct command line
     * @param {string} fullCmd command line
     * @param {SambaClient} client instance of SambaClient
     */
    getSmbClientArgs(fullCmd, client) {
        const args = ['-U', client.username];

        if (!client.password) {
            args.push('-N');
        }

        args.push('-c', fullCmd, client.address);

        if (client.password) {
            args.push(client.password);
        }

        if (client.domain) {
            args.push('-W');
            args.push(client.domain);
        }

        if (client.port) {
            args.push('-p');
            args.push(client.port);
        }

        return args;
    },
    /**
     * Execute command
     * @param {string} cmd command line
     * @param {string} cmdArgs command line arguments
     * @param {string} workingDir Working directory path
     * @param {SambaClient} client SambaClient instance
     */
    execute(cmd, cmdArgs, workingDir, client) {
        const fullCmd = fn.wrap(util.format('%s %s', cmd, cmdArgs));
        const command = ['smbclient', fn.getSmbClientArgs(fullCmd, client).join(' ')].join(' ');

        const options = {
            cwd: workingDir
        };

        return new Promise((resolve, reject) => {
            exec(command, options, function (err, stdout, stderr) {
                let allOutput = stdout + stderr;

                if (err) {
                    err.message += allOutput;
                    return reject(err);
                }

                return resolve(allOutput);
            });
        });
    },
    /**
     * Prepare command
     * @param {string} cmd command line
     * @param {string} path file path
     * @param {string} destination file path
     * @param {SambaClient} client SambaClient instance
     */
    runCommand(cmd, path, destination, client) {
        let workingDir = p.dirname(path);
        let fileName = p.basename(path).replace(singleSlash, '\\');
        let cmdArgs = util.format('"%s" "%s"', fileName, destination);

        return fn.execute(cmd, cmdArgs, workingDir, client);
    }
}

class SambaClient {
     /**
      * smbclient contructor - the connection attempt is made when using a method
      * @constructor SambaClient
      * @param {object} options Options for smbclient
      * @param {string} options.address Address of share : `'\\\\server\\share'`
      * @param {string} [options.username=guest] User account name : `'test'`
      * @param {string} [options.password] Password of user account : `'test'`
      * @param {string} [options.domain] Domain of user account : `'WORKGROUP'`
      * @param {string} [options.port] Connection port : `139`
      * @example new SambaClient({address: '\\\\server\\share'});
      * @example
      * new SambaClient({
      *     address: '\\\\server\\share',
      *     username: 'test',
      *     password: 'test',
      *     domain: 'WORKGROUP',
      *     port: 139
      * });
      */
    constructor(options) {
        this.address = fn.wrap(options.address);
        this.username = fn.wrap(options.username || 'guest');
        this.password = options.password ? fn.wrap(options.password) : null;
        this.domain = options.domain;
        this.port = options.port;
    }

    /**
     * Get file from remote SMB share
     * @param {string} path Remote relative file path
     * @param {string} destination Local file path
     * @example
     * client.getFile('remote folder\\a file', '/tmp/local folder/new file');
     */
    getFile(path, destination) {
        return fn.runCommand('get', path, destination, this);
    }

    /**
     * Send file to remote SMB share
     * @param {string} path Local file path
     * @param {string} destination Remote relative file path
     * @example
     * client.sendFile('/tmp/local folder/a file', 'remote folder\\new file');
     */
    sendFile(path, destination) {
        return fn.runCommand('put', path, destination.replace(singleSlash, '\\'), this);
    }

    deleteFile(fileName) {
        return fn.execute('del', fileName, '', this);
    }

    async listFiles(fileNamePrefix, fileNameSuffix) {
        try {
            let cmdArgs = util.format('%s*%s', fileNamePrefix, fileNameSuffix);
            let allOutput = await fn.execute('dir', cmdArgs, '', this);
            let fileList = [];
            let lines = allOutput.split('\n');
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].toString().trim();
                if (line.startsWith(fileNamePrefix)) {
                    let parsed = line.substring(0, line.indexOf(fileNameSuffix) + fileNameSuffix.length);
                    fileList.push(parsed);
                }
            }
            return fileList;
        } catch (e) {
            if (e.message.match(missingFileRegex)) {
                return [];
            } else {
                throw e;
            }
        }
    }

    mkdir(remotePath) {
        return fn.execute('mkdir', remotePath.replace(singleSlash, '\\'), __dirname, this);
    }

    dir(remotePath) {
        return fn.execute('dir', remotePath.replace(singleSlash, '\\'), __dirname, this);
    }

    async fileExists(remotePath) {
        try {
            await this.dir(remotePath);
            return true;
        } catch (e) {
            if (e.message.match(missingFileRegex)) {
                return false;
            } else {
                throw e;
            }
        }
    }

    getAllShares() {
        return new Promise((resolve, reject) => {
            exec('smbtree -U guest -N', {}, function (err, stdout, stderr) {
                let allOutput = stdout + stderr;

                if (err !== null) {
                    err.message += allOutput;
                    return reject(err);
                }

                let shares = [];
                for (let line in stdout.split(/\r?\n/)) {
                    let words = line.split(/\t/);
                    if (words.length > 2 && words[2].match(/^\s*$/) !== null) {
                        shares.append(words[2].trim());
                    }
                }

                return resolve(shares);
            });
        });
    }
}

module.exports = SambaClient;
