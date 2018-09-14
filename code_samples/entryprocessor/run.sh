rm sample/*.class
javac -cp hazelcast-3.10.5.jar sample/*
java -cp hazelcast-3.10.5.jar:. com.hazelcast.core.server.StartServer
