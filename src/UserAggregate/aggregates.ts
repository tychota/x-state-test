import { userMachine } from "./stateMachine";
import { UserEvent, UserValidator } from "./types";
import { includes } from "lodash";

import { getOrElse } from "fp-ts/lib/Either";
import * as t from "io-ts";

export class UserAggregate {
  private readonly _machine = userMachine;
  private _state = this._machine.initialState;

  private constructor() {}

  public static fromEvents(events: UserEvent[]) {
    const aggregate = new UserAggregate();
    events.forEach(ev => aggregate.playEvent(ev));
    return aggregate;
  }

  private playEvent(event: UserEvent) {
    if (!includes(this.state.nextEvents, event.type)) {
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

  public agreeEthics(): UserEvent[] {
    return [{ type: "ETHICS_AGREED" }];
  }

  public addPhoto(email: string): UserEvent[] {
    if (this.state.value !== "UserAgreed") throw new Error("Impossible to add photo");

    // prettier-ignore
    const assertValid = getOrElse<t.Errors, string>(e => { throw e; });
    const validatedEmail = assertValid(UserValidator.props.email.decode(email));

    return [{ type: "PHOTO_ADDED", photoUrl: validatedEmail }];
  }

  public setOriginCountry(country: string): UserEvent[] {
    if (this.state.value !== "UserAgreed") throw new Error("Impossible to set origin country");

    return [{ type: "ORIGIN_COUNTRY_SET", country: country }];
  }
}
