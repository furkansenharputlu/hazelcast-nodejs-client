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

var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;

// You need to create the equivalent of this object on the Java server side.
// Server-side class should implements IdentifiedDataSerializable interface.
function IdentifiedEntryProcessor(value) {
    this.value = value;
}

IdentifiedEntryProcessor.prototype.readData = function (inp) {
    this.value = inp.readUTF();
};

IdentifiedEntryProcessor.prototype.writeData = function (outp) {
    outp.writeUTF(this.value);
};

IdentifiedEntryProcessor.prototype.getFactoryId = function () {
    return 5;
};

IdentifiedEntryProcessor.prototype.getClassId = function () {
    return 1;
};

function EntryProcessorDataSerializableFactory() {

}

// You need to create the equivalent of this factory object on the Java server side.
EntryProcessorDataSerializableFactory.prototype.create = function (type) {
    if (type === 1) {
        return new IdentifiedEntryProcessor();
    }
    return null;
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.dataSerializableFactories[5] = new EntryProcessorDataSerializableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    // Get the Distributed Map from Cluster.
    var map = hz.getMap('my-distributed-map');
    // Put a string into the Distributed Map
    return map.put('key', 'not-processed').then(function () {
        // Run the IdentifiedEntryProcessor class on the Hazelcast Cluster Member holding the key called "key"
        return map.executeOnKey('key', new IdentifiedEntryProcessor('processed'));
    }).then(function () {
        // Show that the IdentifiedEntryProcessor updated the value.
        return map.get('key');
    }).then(function (value) {
        console.log(value);
        // Shutdown the Hazelcast Cluster Member
        hz.shutdown();
    })
});
