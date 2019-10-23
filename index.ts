import { UserEvent } from "./src/UserAggregate/types";
import { UserAggregate } from "./src/UserAggregate/aggregates";

// simulate DB
let events: UserEvent[] = [];

events = events.concat(UserAggregate.fromEvents(events).createUser());
events = events.concat(UserAggregate.fromEvents(events).setName("tycho"));
events = events.concat(UserAggregate.fromEvents(events).setEmail("tycho@toto.tech"));
events = events.concat(UserAggregate.fromEvents(events).agreeEthics());
events = events.concat(UserAggregate.fromEvents(events).setOriginCountry("france"));
events = events.concat(UserAggregate.fromEvents(events).addPhoto("amazon.s3/path/to/photo"));

console.log("events", events);
console.log("-------------------------------------");
const aggregate = UserAggregate.fromEvents(events);
console.log("context", aggregate.state.context);
console.log("-------------------------------------");
console.log("value", aggregate.state.value);
console.log("-------------------------------------");
