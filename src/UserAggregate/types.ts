import * as t from "io-ts";
import { either, getOrElse } from "fp-ts/lib/Either";
import * as _ from "lodash";

export const DateFromString = new t.Type<Date, string, unknown>(
  "DateFromString",
  (u): u is Date => u instanceof Date,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      const d = new Date(s);
      return isNaN(d.getTime()) ? t.failure(u, c) : t.success(d);
    }),
  a => a.toISOString()
);

export const getDateOrThrow = getOrElse<t.Errors, Date>(e => {
  throw e;
});

export const UserValidator = t.partial({
  uuid: t.string,
  name: t.string,
  email: t.string,
  hashedPassword: t.string,
  birthDate: DateFromString,
  photoUrls: t.array(t.string),
  originCountry: t.string
});
export type UserType = t.TypeOf<typeof UserValidator>;

export interface UserStateSchema {
  states: {
    UserNotCreated: {};
    UserRegistered: {};
    UserAgreed: {};
    UserCompleted: {};
  };
}

export type UserEvent =
  | { type: "USER_CREATED"; uuid: string }
  | { type: "EMAIL_SET"; email: string }
  | { type: "PASSWORD_SET"; hashedPassword: string }
  | { type: "NAME_SET"; name: string }
  | { type: "BIRTH_DATE_SET"; birthDate: string }
  | { type: "ETHICS_AGREED" }
  | { type: "ORIGIN_COUNTRY_SET"; country: string }
  | { type: "PHOTO_ADDED"; photoUrl: string };
