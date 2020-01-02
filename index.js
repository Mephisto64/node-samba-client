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

function wrap(str) {
    return '\'' + str + '\'';
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
      * @example new SambaClient({address: '\\\\server\\share'});
      * @example
      * new SambaClient({
      *     address: '\\\\server\\share',
      *     username: 'test',
      *     password: 'test',
      *     domain: 'WORKGROUP'
      * });
      */
    constructor(options) {
        this.address = wrap(options.address);
        this.username = wrap(options.username || 'guest');
        this.password = options.password ? wrap(options.password) : null;
        this.domain = options.domain;
    }

    /**
     * Get file from remote SMB share
     * @param {string} path Remote relative file path
     * @param {string} destination Local file path
     * @example
     * client.getFile('remote folder\\a file', '/tmp/local folder/new file');
     */
    getFile(path, destination) {
        return this.runCommand('get', path, destination);
    }

    /**
     * Send file to remote SMB share
     * @param {string} path Local file path
     * @param {string} destination Remote relative file path
     * @example
     * client.sendFile('/tmp/local folder/a file', 'remote folder\\new file');
     */
    sendFile(path, destination) {
        return this.runCommand('put', path, destination.replace(singleSlash, '\\'));
    }

    deleteFile(fileName) {
        return this.execute('del', fileName, '');
    }

    async listFiles(fileNamePrefix, fileNameSuffix) {
        try {
            let cmdArgs = util.format('%s*%s', fileNamePrefix, fileNameSuffix);
            let allOutput = await this.execute('dir', cmdArgs, '');
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
        return this.execute('mkdir', remotePath.replace(singleSlash, '\\'), __dirname);
    }

    dir(remotePath) {
        return this.execute('dir', remotePath.replace(singleSlash, '\\'), __dirname);
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

    getSmbClientArgs(fullCmd) {
        let args = ['-U', this.username];

        if (!this.password) {
            args.push('-N');
        }

        args.push('-c', fullCmd, this.address);

        if (this.password) {
            args.push(this.password);
        }

        if (this.domain) {
            args.push('-W');
            args.push(this.domain);
        }

        return args;
    }

    execute(cmd, cmdArgs, workingDir) {
        let fullCmd = wrap(util.format('%s %s', cmd, cmdArgs));
        let command = ['smbclient', this.getSmbClientArgs(fullCmd).join(' ')].join(' ');

        let options = {
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
    }

    runCommand(cmd, path, destination) {
        let workingDir = p.dirname(path);
        let fileName = p.basename(path).replace(singleSlash, '\\');
        let cmdArgs = util.format('"%s" "%s"', fileName, destination);

        return this.execute(cmd, cmdArgs, workingDir);
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
