#!/bin/sh

HAZELCAST_TEST_VERSION="3.10"
HAZELCAST_VERSION="3.10"

CLASSPATH="hazelcast-${HAZELCAST_VERSION}.jar:hazelcast-${HAZELCAST_TEST_VERSION}-tests.jar"
CMD_CONFIGS="-Dhazelcast.multicast.group=224.206.1.1 -Djava.net.preferIPv4Stack=true"
java ${CMD_CONFIGS} -cp ${CLASSPATH} com.hazelcast.core.server.StartServer > hazelcast-${HAZELCAST_VERSION}-out.log 2>hazelcast-${HAZELCAST_VERSION}-err.log &
