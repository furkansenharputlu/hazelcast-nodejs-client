/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var HazelcastClient = require('../../').Client;
var expect = require('chai').expect;

var ClientConfig = require('../../').Config.ClientConfig;
var fs = require('fs');
var Path = require('path');

describe('HazelcastCloudDiscovery Test', function () {
    this.timeout(15000);

    function createClientConfigWithSSLOpts(key, cert, ca) {
        var sslOpts = {
            servername: 'Hazelcast-Inc',
            rejectUnauthorized: true,
            ca: fs.readFileSync(Path.join(__dirname, ca)),
            key: fs.readFileSync(Path.join(__dirname, key)),
            cert: fs.readFileSync(Path.join(__dirname, cert))
        };
        var cfg = new ClientConfig();
        cfg.networkConfig.sslOptions = sslOpts;
        cfg.networkConfig.connectionAttemptLimit = 1000;

        var token = '1533a9e9d24';

        cfg.networkConfig.cloudConfig.enabled = true;
        cfg.networkConfig.cloudConfig.discoveryToken = token;
        cfg.groupConfig.name = 'test1';
        return cfg;
    }

    it('basic cloud discovery test', function () {

        var cfg = createClientConfigWithSSLOpts('./key.pem', './cert.pem',  './ca.pem');

        return HazelcastClient.newHazelcastClient(cfg).then((client) => {
            var mp = client.getMap("testMap");
            return mp.put('key', 'value').then(function () {
                return mp.get('key');
            }).then((res) => {
                return expect(res).to.be.equal('value');
            });
        });
    });
});
