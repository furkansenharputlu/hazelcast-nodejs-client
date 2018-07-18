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

var Hazelcast = require('hazelcast-client');
var Config = Hazelcast.Config;
var Client = Hazelcast.Client;
var Predicates = Hazelcast.Predicates;
var IdentifiedEntryProcessor = require('./IdentifiedEntryProcessor');
var IdentifiedFactory = require('./IdentifiedFactory');
var NS_IN_MS = 1e6;
var NS_IN_SEC = 1e9;
var MS_IN_SEC = 1e6;

process.on('SIGINT', function () {
    console.log("Shutting down!");
    stopTest = true;
    nz++;
    if (nz === 2) {
        process.exit(1);
    }
});

/**
 * Test variables
 */

var MAX_ALLOWED_ACTIVE_REQUESTS = 32;
var MAX_ALLOWED_CONSECUTIVE_REQUESTS = MAX_ALLOWED_ACTIVE_REQUESTS;
var stopTest = false;
var runningOperations = 0;
var startTime;
var endTime;
var client;
var totalOps = 0;
var nz = 0;

/**
 * Helper functions
 */

function fancyDuration(millisec) {
    var times = Math.floor(millisec / 1000);

    var secs = Math.floor(times % 60);
    var minutes = Math.floor((times % 3600) / 60);
    var hours = Math.floor(times / 3600);

    return hours + ':' + minutes + ':' + secs;
}

function testCompleted() {
    endTime = new Date();
    client.shutdown();
    var elapsedMilliseconds = endTime.getTime() - startTime.getTime();

    console.log('Test completed at ' + endTime + '.\n' +
        'Elapsed time(s): ' + fancyDuration(elapsedMilliseconds));
    console.log('Completed ' + (totalOps / (elapsedMilliseconds / 1000)) + ' ops/sec.');
}

function completeIfNoActiveCallbacks() {
    if (stopTest && runningOperations === 0) {
        testCompleted();
    }
}

function handleError(err) {
    console.log(err);
    process.exit(1);
}

function hrtimeToNanoSec(t) {
    return t[0] * NS_IN_MS + t[1];
}

function hrtimeToMilliSec(t) {
    return t[0] * MS_IN_SEC + t[1] / NS_IN_MS;
}

function completeOperation() {
    runningOperations--;
    totalOps++;
    if (totalOps % 10000 === 0) {
        console.log('Completed operation count: ' + totalOps);
        var lagTimeSt = process.hrtime();
        setImmediate(function () {
            var eventLoopLag = process.hrtime(lagTimeSt);
            //console.log(eventLoopLag);
            if (hrtimeToNanoSec(eventLoopLag) > 40 * NS_IN_MS) {
                console.log('Experiencing event loop lag: ' + hrtimeToMilliSec(eventLoopLag) + ' ms.');
            }
        });
    }
    completeIfNoActiveCallbacks();
}

function randomString(max) {
    return Math.floor(Math.random() * Math.floor(max)).toString();
}

function randomInt(upto) {
    return Math.floor(Math.random() * upto);
}

/**
 * Entry listener
 */

function nop() {

}

var listener = {
    added: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    updated: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    removed: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    evicted: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    clearedAll: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
    evictedAll: function (key, oldvalue, value, mergingvalue) {
        nop(key, oldvalue, value, mergingvalue);
    },
};

/**
 * Test
 */

var cfg = new Config.ClientConfig();
for (var i = 2; i < process.argv.length; i++) {
    cfg.networkConfig.addresses[0] = process.argv[i];
}
cfg.serializationConfig.dataSerializableFactories[66] = new IdentifiedFactory();

var map;
Client.newHazelcastClient(cfg).then(function (c) {
    client = c;
    map = client.getMap('default');
    return map.addEntryListener(listener);
}).then(function () {
    startTime = new Date();
    console.log('Test started at ' + startTime);
    (function innerOperation() {
        if (stopTest) {
            completeIfNoActiveCallbacks();
            return;
        }
        if (runningOperations > MAX_ALLOWED_ACTIVE_REQUESTS) {
            setTimeout(innerOperation, 1);
        } else {
            if (runningOperations >= MAX_ALLOWED_CONSECUTIVE_REQUESTS) {
                setTimeout(innerOperation, 1);
            } else {
                process.nextTick(innerOperation);
            }
            var key = randomString(10000);
            var value = randomString(10000);
            var operation = randomInt(100);

            runningOperations++;
            var pr;
            if (operation < 30) {
                pr = map.get(key).then(completeOperation);
            } else if (operation < 80) {
                pr = map.put(key, value).then(completeOperation);
            } else if (operation < 80) {
                pr = map.values(Predicates.isBetween('this', 0, 10)).then(completeOperation);
            } else {
                pr = map.executeOnKey(key, new IdentifiedEntryProcessor(key)).then(completeOperation);
            }
            pr.catch(handleError);
        }
    })();
});
