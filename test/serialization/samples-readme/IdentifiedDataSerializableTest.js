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

var Config = require('../../../.').Config;
var Client = require('../../../.').Client;

var Controller = require('./../../RC');

describe('IdentifiedDataSerializable', function () {

    var cluster;
    var client;
    var map;

    function Address(street, zipCode, city, state) {
        this.street = street;
        this.zipCode = zipCode;
        this.city = city;
        this.state = state;
    }

    Address.prototype.getClassId = function () {
        return 1;
    };

    Address.prototype.getFactoryId = function () {
        return 1;
    };

    Address.prototype.writeData = function (objectDataOutput) {
        objectDataOutput.writeUTF(this.street);
        objectDataOutput.writeInt(this.zipCode);
        objectDataOutput.writeUTF(this.city);
        objectDataOutput.writeUTF(this.state);
    };

    Address.prototype.readData = function (objectDataInput) {
        this.street = objectDataInput.readUTF();
        this.zipCode = objectDataInput.readInt();
        this.city = objectDataInput.readUTF();
        this.state = objectDataInput.readUTF();
    };

    var myIdentifiedFactory = {
        create: function (type) {
            if (type === 1) {
                return new Address();
            }
        }
    };

    beforeEach(function () {
        return Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        });
    });

    afterEach(function () {

    });

    it('simple put get', function () {
        var config = new Config.ClientConfig();
        config.serializationConfig.dataSerializableFactories[1] = myIdentifiedFactory;
        return Client.newHazelcastClient(config).then(function (hazelcastClient) {
            client = hazelcastClient;
            map = hazelcastClient.getMap('my-distributed-map');

            return map.put('key', new Address('sahibiata', 42000, 'konya', 'turkey')).then(function () {
                return map.get('key');
            }).then(function (val) {
                console.log(val);
            });

        });
    });


});
