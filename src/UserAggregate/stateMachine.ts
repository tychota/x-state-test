import { Machine, assign } from "xstate";
import { UserType, UserStateSchema, UserEvent, getDateOrThrow, DateFromString } from "./types";

export const userMachine = Machine<UserType, UserStateSchema, UserEvent>({
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
        ETHICS_AGREED: { target: "UserAgreed" },
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
        BIRTH_DATE_SET: {
          target: "UserRegistered",
          actions: assign({
            birthDate: (_, event) => {
              return getDateOrThrow(DateFromString.decode(event.birthDate));
            }
          })
        }
      }
    },
    UserAgreed: {
      on: {
        // @ts-ignore
        "": [
          {
            target: "UserCompleted",
            cond: context => {
              return context.photoUrls && context.photoUrls.length > 0;
            }
          }
        ],
        PHOTO_ADDED: {
          target: "UserAgreed",
          actions: assign({
            photoUrls: (context, event) => {
              if (context.photoUrls) return [...context.photoUrls, event.photoUrl];
              return [event.photoUrl];
            }
          })
        },
        ORIGIN_COUNTRY_SET: {
          target: "UserAgreed",
          actions: assign({
            originCountry: (context, event) => {
              return event.country;
            }
          })
        }
      }
    },
    UserCompleted: {}
  }
});
