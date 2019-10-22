import { Machine, assign } from "xstate";
import * as t from "io-ts";
import { either, getOrElse } from "fp-ts/lib/Either";
import * as _ from "lodash";

const DateFromString = new t.Type<Date, string, unknown>(
  "DateFromString",
  (u): u is Date => u instanceof Date,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      const d = new Date(s);
      return isNaN(d.getTime()) ? t.failure(u, c) : t.success(d);
    }),
  a => a.toISOString()
);

const getDateOrThrow = getOrElse<t.Errors, Date>(e => {
  throw e;
});

const UserValidator = t.partial({
  uuid: t.string,
  name: t.string,
  email: t.string,
  hashedPassword: t.string,
  birthdate: DateFromString,
  photoUrls: t.array(t.string)
});
type UserType = t.TypeOf<typeof UserValidator>;

interface UserStateSchema {
  states: {
    UserNotCreated: {};
    UserRegistered: {};
    UserAggreed: {};
    UserCompleted: {};
  };
}

type UserEvent =
  | { type: "USER_CREATED"; uuid: string }
  | { type: "EMAIL_SET"; email: string }
  | { type: "PASSWORD_SET"; hashedPassword: string }
  | { type: "NAME_SET"; name: string }
  | { type: "BIRTHDATE_SET"; birthdate: string }
  | { type: "ETHICS_AGREED" }
  | { type: "PHOTO_ADDED"; photoUrl: string };

const userMachine = Machine<UserType, UserStateSchema, UserEvent>({
  id: "user",
  initial: "UserNotCreated",
  context: {},
  strict: true,
  states: {
    UserNotCreated: {
      on: {
        USER_CREATED: {
          target: "UserRegistered",
          actions: assign({
            uuid: (_, event) => {
              return event.uuid;
            }
          })
        }
      }
    },
    UserRegistered: {
      on: {
        ETHICS_AGREED: { target: "UserRegistered" },
        EMAIL_SET: {
          target: "UserRegistered",
          actions: assign({
            email: (_, event) => {
              return event.email;
            }
          })
        },
        PASSWORD_SET: {
          target: "UserRegistered",
          actions: assign({
            hashedPassword: (_, event) => {
              return event.hashedPassword;
            }
          })
        },
        NAME_SET: {
          target: "UserRegistered",
          actions: assign({
            name: (_, event) => {
              return event.name;
            }
          })
        },
        BIRTHDATE_SET: {
          target: "UserRegistered",
          actions: assign({
            birthdate: (_, event) => {
              return getDateOrThrow(DateFromString.decode(event.birthdate));
            }
          })
        }
      }
    },
    UserAggreed: {
      on: {
        PHOTO_ADDED: {
          target: "UserAggreed",
          actions: assign({
            photoUrls: (context: UserType, event) => {
              if (context.photoUrls) return [...context.photoUrls, event.photoUrl];
              return [event.photoUrl];
            }
          })
        }
      }
    },
    UserCompleted: {}
  }
});

class UserAggregate {
  private readonly _machine = userMachine;
  private _state = this._machine.initialState;

  private constructor() {}

  public static fromEvents(events: UserEvent[]) {
    const aggregate = new UserAggregate();
    events.forEach(ev => aggregate.playEvent(ev));
    return aggregate;
  }

  private playEvent(event: UserEvent) {
    if (!_.includes(this.state.nextEvents, event.type)) {
      throw new Error(`Impossible to play Event ${event.type}`);
    }
    this._state = this._machine.transition(this._state, event);
  }

  public get state() {
    return this._state;
  }

  public get uuid() {
    return this.state.context.uuid;
  }

  public get name() {
    return this.state.context.name;
  }

  public get email() {
    return this.state.context.email;
  }

  public createUser(): UserEvent[] {
    if (this.state.value !== "UserNotCreated") throw new Error("Impossible to create a user");

    const uuid = "1234567";
    return [{ type: "USER_CREATED", uuid }];
  }

  public setName(name: string): UserEvent[] {
    if (this.state.value !== "UserRegistered") throw new Error("Impossible to set name");

    return [{ type: "NAME_SET", name }];
  }
  public setEmail(email: string): UserEvent[] {
    if (this.state.value !== "UserRegistered") throw new Error("Impossible to set emil");

    // prettier-ignore
    const assertValid = getOrElse<t.Errors, string>(e => { throw e; });
    const validatedEmail = assertValid(UserValidator.props.email.decode(email));

    return [{ type: "EMAIL_SET", email: validatedEmail }];
  }

  public addPhoto(email: string): UserEvent[] {
    if (this.state.value !== "UserAgreed") throw new Error("Impossible to add photo");

    // prettier-ignore
    const assertValid = getOrElse<t.Errors, string>(e => { throw e; });
    const validatedEmail = assertValid(UserValidator.props.email.decode(email));

    return [{ type: "EMAIL_SET", email: validatedEmail }];
  }
}

// simulate DB
let events: UserEvent[] = [];

events = events.concat(UserAggregate.fromEvents(events).createUser());
events = events.concat(UserAggregate.fromEvents(events).setName("tycho"));
events = events.concat(UserAggregate.fromEvents(events).setEmail("tycho@toto.tech"));

console.log(UserAggregate.fromEvents(events).state.context);

events = events.concat(UserAggregate.fromEvents(events).addPhoto("amazone.s3/path/to/photo"));
