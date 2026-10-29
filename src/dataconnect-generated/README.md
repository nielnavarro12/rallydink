# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCourt*](#getcourt)
  - [*ListCourts*](#listcourts)
  - [*GetMyProfile*](#getmyprofile)
  - [*ListUsers*](#listusers)
  - [*GetBooking*](#getbooking)
  - [*ListMyBookings*](#listmybookings)
  - [*GetSession*](#getsession)
  - [*ListSessions*](#listsessions)
  - [*GetTransaction*](#gettransaction)
  - [*ListMyTransactions*](#listmytransactions)
  - [*GetDisplayQueue*](#getdisplayqueue)
  - [*ListQueues*](#listqueues)
- [**Mutations**](#mutations)
  - [*CreateCourt*](#createcourt)
  - [*UpdateCourt*](#updatecourt)
  - [*DeleteCourt*](#deletecourt)
  - [*CreateUser*](#createuser)
  - [*UpdateUser*](#updateuser)
  - [*DeleteUser*](#deleteuser)
  - [*CreateBooking*](#createbooking)
  - [*UpdateBooking*](#updatebooking)
  - [*DeleteBooking*](#deletebooking)
  - [*CreateOpenPlaySession*](#createopenplaysession)
  - [*UpdateSession*](#updatesession)
  - [*DeleteSession*](#deletesession)
  - [*CreateTransaction*](#createtransaction)
  - [*DeleteTransaction*](#deletetransaction)
  - [*CreateDisplayQueue*](#createdisplayqueue)
  - [*UpdateDisplayQueue*](#updatedisplayqueue)
  - [*DeleteDisplayQueue*](#deletedisplayqueue)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetCourt
You can execute the `GetCourt` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCourt(vars: GetCourtVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourtData, GetCourtVariables>;

interface GetCourtRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCourtVariables): QueryRef<GetCourtData, GetCourtVariables>;
}
export const getCourtRef: GetCourtRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCourt(dc: DataConnect, vars: GetCourtVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourtData, GetCourtVariables>;

interface GetCourtRef {
  ...
  (dc: DataConnect, vars: GetCourtVariables): QueryRef<GetCourtData, GetCourtVariables>;
}
export const getCourtRef: GetCourtRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCourtRef:
```typescript
const name = getCourtRef.operationName;
console.log(name);
```

### Variables
The `GetCourt` query requires an argument of type `GetCourtVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCourtVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetCourt` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCourtData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCourtData {
  court?: {
    name: string;
    status: string;
    amenities?: string | null;
  };
}
```
### Using `GetCourt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCourt, GetCourtVariables } from '@dataconnect/generated';

// The `GetCourt` query requires an argument of type `GetCourtVariables`:
const getCourtVars: GetCourtVariables = {
  id: ..., 
};

// Call the `getCourt()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCourt(getCourtVars);
// Variables can be defined inline as well.
const { data } = await getCourt({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCourt(dataConnect, getCourtVars);

console.log(data.court);

// Or, you can use the `Promise` API.
getCourt(getCourtVars).then((response) => {
  const data = response.data;
  console.log(data.court);
});
```

### Using `GetCourt`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCourtRef, GetCourtVariables } from '@dataconnect/generated';

// The `GetCourt` query requires an argument of type `GetCourtVariables`:
const getCourtVars: GetCourtVariables = {
  id: ..., 
};

// Call the `getCourtRef()` function to get a reference to the query.
const ref = getCourtRef(getCourtVars);
// Variables can be defined inline as well.
const ref = getCourtRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCourtRef(dataConnect, getCourtVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.court);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.court);
});
```

## ListCourts
You can execute the `ListCourts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listCourts(options?: ExecuteQueryOptions): QueryPromise<ListCourtsData, undefined>;

interface ListCourtsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCourtsData, undefined>;
}
export const listCourtsRef: ListCourtsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCourts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCourtsData, undefined>;

interface ListCourtsRef {
  ...
  (dc: DataConnect): QueryRef<ListCourtsData, undefined>;
}
export const listCourtsRef: ListCourtsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCourtsRef:
```typescript
const name = listCourtsRef.operationName;
console.log(name);
```

### Variables
The `ListCourts` query has no variables.
### Return Type
Recall that executing the `ListCourts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCourtsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCourtsData {
  courts: ({
    name: string;
    status: string;
  })[];
}
```
### Using `ListCourts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCourts } from '@dataconnect/generated';


// Call the `listCourts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCourts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCourts(dataConnect);

console.log(data.courts);

// Or, you can use the `Promise` API.
listCourts().then((response) => {
  const data = response.data;
  console.log(data.courts);
});
```

### Using `ListCourts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCourtsRef } from '@dataconnect/generated';


// Call the `listCourtsRef()` function to get a reference to the query.
const ref = listCourtsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCourtsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.courts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.courts);
});
```

## GetMyProfile
You can execute the `GetMyProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyProfile(options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyProfileRef:
```typescript
const name = getMyProfileRef.operationName;
console.log(name);
```

### Variables
The `GetMyProfile` query has no variables.
### Return Type
Recall that executing the `GetMyProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyProfileData {
  user?: {
    email: string;
    role: string;
    membershipStatus?: string | null;
    phone?: string | null;
  };
}
```
### Using `GetMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyProfile } from '@dataconnect/generated';


// Call the `getMyProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyProfile(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getMyProfile().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetMyProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyProfileRef } from '@dataconnect/generated';


// Call the `getMyProfileRef()` function to get a reference to the query.
const ref = getMyProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListUsers
You can execute the `ListUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUsersRef:
```typescript
const name = listUsersRef.operationName;
console.log(name);
```

### Variables
The `ListUsers` query has no variables.
### Return Type
Recall that executing the `ListUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUsersData {
  users: ({
    email: string;
    role: string;
  })[];
}
```
### Using `ListUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUsers } from '@dataconnect/generated';


// Call the `listUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUsersRef } from '@dataconnect/generated';


// Call the `listUsersRef()` function to get a reference to the query.
const ref = listUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetBooking
You can execute the `GetBooking` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBooking(vars: GetBookingVariables, options?: ExecuteQueryOptions): QueryPromise<GetBookingData, GetBookingVariables>;

interface GetBookingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBookingVariables): QueryRef<GetBookingData, GetBookingVariables>;
}
export const getBookingRef: GetBookingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBooking(dc: DataConnect, vars: GetBookingVariables, options?: ExecuteQueryOptions): QueryPromise<GetBookingData, GetBookingVariables>;

interface GetBookingRef {
  ...
  (dc: DataConnect, vars: GetBookingVariables): QueryRef<GetBookingData, GetBookingVariables>;
}
export const getBookingRef: GetBookingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBookingRef:
```typescript
const name = getBookingRef.operationName;
console.log(name);
```

### Variables
The `GetBooking` query requires an argument of type `GetBookingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBookingVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetBooking` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBookingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetBookingData {
  booking?: {
    startTime: TimestampString;
    endTime: TimestampString;
    court: {
      name: string;
    };
  };
}
```
### Using `GetBooking`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBooking, GetBookingVariables } from '@dataconnect/generated';

// The `GetBooking` query requires an argument of type `GetBookingVariables`:
const getBookingVars: GetBookingVariables = {
  id: ..., 
};

// Call the `getBooking()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBooking(getBookingVars);
// Variables can be defined inline as well.
const { data } = await getBooking({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBooking(dataConnect, getBookingVars);

console.log(data.booking);

// Or, you can use the `Promise` API.
getBooking(getBookingVars).then((response) => {
  const data = response.data;
  console.log(data.booking);
});
```

### Using `GetBooking`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBookingRef, GetBookingVariables } from '@dataconnect/generated';

// The `GetBooking` query requires an argument of type `GetBookingVariables`:
const getBookingVars: GetBookingVariables = {
  id: ..., 
};

// Call the `getBookingRef()` function to get a reference to the query.
const ref = getBookingRef(getBookingVars);
// Variables can be defined inline as well.
const ref = getBookingRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBookingRef(dataConnect, getBookingVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.booking);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.booking);
});
```

## ListMyBookings
You can execute the `ListMyBookings` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyBookings(options?: ExecuteQueryOptions): QueryPromise<ListMyBookingsData, undefined>;

interface ListMyBookingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyBookingsData, undefined>;
}
export const listMyBookingsRef: ListMyBookingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyBookings(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyBookingsData, undefined>;

interface ListMyBookingsRef {
  ...
  (dc: DataConnect): QueryRef<ListMyBookingsData, undefined>;
}
export const listMyBookingsRef: ListMyBookingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyBookingsRef:
```typescript
const name = listMyBookingsRef.operationName;
console.log(name);
```

### Variables
The `ListMyBookings` query has no variables.
### Return Type
Recall that executing the `ListMyBookings` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyBookingsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyBookingsData {
  bookings: ({
    startTime: TimestampString;
    endTime: TimestampString;
    court: {
      name: string;
    };
  })[];
}
```
### Using `ListMyBookings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyBookings } from '@dataconnect/generated';


// Call the `listMyBookings()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyBookings();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyBookings(dataConnect);

console.log(data.bookings);

// Or, you can use the `Promise` API.
listMyBookings().then((response) => {
  const data = response.data;
  console.log(data.bookings);
});
```

### Using `ListMyBookings`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyBookingsRef } from '@dataconnect/generated';


// Call the `listMyBookingsRef()` function to get a reference to the query.
const ref = listMyBookingsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyBookingsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bookings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bookings);
});
```

## GetSession
You can execute the `GetSession` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSession(vars: GetSessionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSessionData, GetSessionVariables>;

interface GetSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSessionVariables): QueryRef<GetSessionData, GetSessionVariables>;
}
export const getSessionRef: GetSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSession(dc: DataConnect, vars: GetSessionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSessionData, GetSessionVariables>;

interface GetSessionRef {
  ...
  (dc: DataConnect, vars: GetSessionVariables): QueryRef<GetSessionData, GetSessionVariables>;
}
export const getSessionRef: GetSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSessionRef:
```typescript
const name = getSessionRef.operationName;
console.log(name);
```

### Variables
The `GetSession` query requires an argument of type `GetSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSessionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetSession` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetSessionData {
  openPlaySession?: {
    name: string;
    startTime: TimestampString;
    maxCapacity: number;
  };
}
```
### Using `GetSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSession, GetSessionVariables } from '@dataconnect/generated';

// The `GetSession` query requires an argument of type `GetSessionVariables`:
const getSessionVars: GetSessionVariables = {
  id: ..., 
};

// Call the `getSession()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSession(getSessionVars);
// Variables can be defined inline as well.
const { data } = await getSession({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSession(dataConnect, getSessionVars);

console.log(data.openPlaySession);

// Or, you can use the `Promise` API.
getSession(getSessionVars).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession);
});
```

### Using `GetSession`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSessionRef, GetSessionVariables } from '@dataconnect/generated';

// The `GetSession` query requires an argument of type `GetSessionVariables`:
const getSessionVars: GetSessionVariables = {
  id: ..., 
};

// Call the `getSessionRef()` function to get a reference to the query.
const ref = getSessionRef(getSessionVars);
// Variables can be defined inline as well.
const ref = getSessionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSessionRef(dataConnect, getSessionVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.openPlaySession);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession);
});
```

## ListSessions
You can execute the `ListSessions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSessions(options?: ExecuteQueryOptions): QueryPromise<ListSessionsData, undefined>;

interface ListSessionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSessionsData, undefined>;
}
export const listSessionsRef: ListSessionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSessions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSessionsData, undefined>;

interface ListSessionsRef {
  ...
  (dc: DataConnect): QueryRef<ListSessionsData, undefined>;
}
export const listSessionsRef: ListSessionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSessionsRef:
```typescript
const name = listSessionsRef.operationName;
console.log(name);
```

### Variables
The `ListSessions` query has no variables.
### Return Type
Recall that executing the `ListSessions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSessionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSessionsData {
  openPlaySessions: ({
    name: string;
    startTime: TimestampString;
  })[];
}
```
### Using `ListSessions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSessions } from '@dataconnect/generated';


// Call the `listSessions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSessions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSessions(dataConnect);

console.log(data.openPlaySessions);

// Or, you can use the `Promise` API.
listSessions().then((response) => {
  const data = response.data;
  console.log(data.openPlaySessions);
});
```

### Using `ListSessions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSessionsRef } from '@dataconnect/generated';


// Call the `listSessionsRef()` function to get a reference to the query.
const ref = listSessionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSessionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.openPlaySessions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.openPlaySessions);
});
```

## GetTransaction
You can execute the `GetTransaction` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTransaction(vars: GetTransactionVariables, options?: ExecuteQueryOptions): QueryPromise<GetTransactionData, GetTransactionVariables>;

interface GetTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTransactionVariables): QueryRef<GetTransactionData, GetTransactionVariables>;
}
export const getTransactionRef: GetTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTransaction(dc: DataConnect, vars: GetTransactionVariables, options?: ExecuteQueryOptions): QueryPromise<GetTransactionData, GetTransactionVariables>;

interface GetTransactionRef {
  ...
  (dc: DataConnect, vars: GetTransactionVariables): QueryRef<GetTransactionData, GetTransactionVariables>;
}
export const getTransactionRef: GetTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTransactionRef:
```typescript
const name = getTransactionRef.operationName;
console.log(name);
```

### Variables
The `GetTransaction` query requires an argument of type `GetTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTransactionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetTransaction` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTransactionData {
  transaction?: {
    amount: number;
    itemDescription: string;
    timestamp: TimestampString;
  };
}
```
### Using `GetTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTransaction, GetTransactionVariables } from '@dataconnect/generated';

// The `GetTransaction` query requires an argument of type `GetTransactionVariables`:
const getTransactionVars: GetTransactionVariables = {
  id: ..., 
};

// Call the `getTransaction()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTransaction(getTransactionVars);
// Variables can be defined inline as well.
const { data } = await getTransaction({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTransaction(dataConnect, getTransactionVars);

console.log(data.transaction);

// Or, you can use the `Promise` API.
getTransaction(getTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction);
});
```

### Using `GetTransaction`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTransactionRef, GetTransactionVariables } from '@dataconnect/generated';

// The `GetTransaction` query requires an argument of type `GetTransactionVariables`:
const getTransactionVars: GetTransactionVariables = {
  id: ..., 
};

// Call the `getTransactionRef()` function to get a reference to the query.
const ref = getTransactionRef(getTransactionVars);
// Variables can be defined inline as well.
const ref = getTransactionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTransactionRef(dataConnect, getTransactionVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transaction);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction);
});
```

## ListMyTransactions
You can execute the `ListMyTransactions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyTransactions(options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, undefined>;

interface ListMyTransactionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyTransactionsData, undefined>;
}
export const listMyTransactionsRef: ListMyTransactionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyTransactions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, undefined>;

interface ListMyTransactionsRef {
  ...
  (dc: DataConnect): QueryRef<ListMyTransactionsData, undefined>;
}
export const listMyTransactionsRef: ListMyTransactionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyTransactionsRef:
```typescript
const name = listMyTransactionsRef.operationName;
console.log(name);
```

### Variables
The `ListMyTransactions` query has no variables.
### Return Type
Recall that executing the `ListMyTransactions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyTransactionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyTransactionsData {
  transactions: ({
    amount: number;
    itemDescription: string;
    timestamp: TimestampString;
  })[];
}
```
### Using `ListMyTransactions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyTransactions } from '@dataconnect/generated';


// Call the `listMyTransactions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyTransactions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyTransactions(dataConnect);

console.log(data.transactions);

// Or, you can use the `Promise` API.
listMyTransactions().then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

### Using `ListMyTransactions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyTransactionsRef } from '@dataconnect/generated';


// Call the `listMyTransactionsRef()` function to get a reference to the query.
const ref = listMyTransactionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyTransactionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transactions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

## GetDisplayQueue
You can execute the `GetDisplayQueue` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDisplayQueue(vars: GetDisplayQueueVariables, options?: ExecuteQueryOptions): QueryPromise<GetDisplayQueueData, GetDisplayQueueVariables>;

interface GetDisplayQueueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDisplayQueueVariables): QueryRef<GetDisplayQueueData, GetDisplayQueueVariables>;
}
export const getDisplayQueueRef: GetDisplayQueueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDisplayQueue(dc: DataConnect, vars: GetDisplayQueueVariables, options?: ExecuteQueryOptions): QueryPromise<GetDisplayQueueData, GetDisplayQueueVariables>;

interface GetDisplayQueueRef {
  ...
  (dc: DataConnect, vars: GetDisplayQueueVariables): QueryRef<GetDisplayQueueData, GetDisplayQueueVariables>;
}
export const getDisplayQueueRef: GetDisplayQueueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDisplayQueueRef:
```typescript
const name = getDisplayQueueRef.operationName;
console.log(name);
```

### Variables
The `GetDisplayQueue` query requires an argument of type `GetDisplayQueueVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDisplayQueueVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetDisplayQueue` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDisplayQueueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetDisplayQueueData {
  displayQueue?: {
    playerOrder?: UUIDString[] | null;
    session: {
      name: string;
    };
  };
}
```
### Using `GetDisplayQueue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDisplayQueue, GetDisplayQueueVariables } from '@dataconnect/generated';

// The `GetDisplayQueue` query requires an argument of type `GetDisplayQueueVariables`:
const getDisplayQueueVars: GetDisplayQueueVariables = {
  id: ..., 
};

// Call the `getDisplayQueue()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDisplayQueue(getDisplayQueueVars);
// Variables can be defined inline as well.
const { data } = await getDisplayQueue({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDisplayQueue(dataConnect, getDisplayQueueVars);

console.log(data.displayQueue);

// Or, you can use the `Promise` API.
getDisplayQueue(getDisplayQueueVars).then((response) => {
  const data = response.data;
  console.log(data.displayQueue);
});
```

### Using `GetDisplayQueue`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDisplayQueueRef, GetDisplayQueueVariables } from '@dataconnect/generated';

// The `GetDisplayQueue` query requires an argument of type `GetDisplayQueueVariables`:
const getDisplayQueueVars: GetDisplayQueueVariables = {
  id: ..., 
};

// Call the `getDisplayQueueRef()` function to get a reference to the query.
const ref = getDisplayQueueRef(getDisplayQueueVars);
// Variables can be defined inline as well.
const ref = getDisplayQueueRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDisplayQueueRef(dataConnect, getDisplayQueueVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.displayQueue);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.displayQueue);
});
```

## ListQueues
You can execute the `ListQueues` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listQueues(options?: ExecuteQueryOptions): QueryPromise<ListQueuesData, undefined>;

interface ListQueuesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListQueuesData, undefined>;
}
export const listQueuesRef: ListQueuesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listQueues(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListQueuesData, undefined>;

interface ListQueuesRef {
  ...
  (dc: DataConnect): QueryRef<ListQueuesData, undefined>;
}
export const listQueuesRef: ListQueuesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listQueuesRef:
```typescript
const name = listQueuesRef.operationName;
console.log(name);
```

### Variables
The `ListQueues` query has no variables.
### Return Type
Recall that executing the `ListQueues` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListQueuesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListQueuesData {
  displayQueues: ({
    id: UUIDString;
    playerOrder?: UUIDString[] | null;
  } & DisplayQueue_Key)[];
}
```
### Using `ListQueues`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listQueues } from '@dataconnect/generated';


// Call the `listQueues()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listQueues();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listQueues(dataConnect);

console.log(data.displayQueues);

// Or, you can use the `Promise` API.
listQueues().then((response) => {
  const data = response.data;
  console.log(data.displayQueues);
});
```

### Using `ListQueues`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listQueuesRef } from '@dataconnect/generated';


// Call the `listQueuesRef()` function to get a reference to the query.
const ref = listQueuesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listQueuesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.displayQueues);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.displayQueues);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateCourt
You can execute the `CreateCourt` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCourt(): MutationPromise<CreateCourtData, undefined>;

interface CreateCourtRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateCourtData, undefined>;
}
export const createCourtRef: CreateCourtRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCourt(dc: DataConnect): MutationPromise<CreateCourtData, undefined>;

interface CreateCourtRef {
  ...
  (dc: DataConnect): MutationRef<CreateCourtData, undefined>;
}
export const createCourtRef: CreateCourtRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCourtRef:
```typescript
const name = createCourtRef.operationName;
console.log(name);
```

### Variables
The `CreateCourt` mutation has no variables.
### Return Type
Recall that executing the `CreateCourt` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCourtData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCourtData {
  court_insert: Court_Key;
}
```
### Using `CreateCourt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCourt } from '@dataconnect/generated';


// Call the `createCourt()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCourt();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCourt(dataConnect);

console.log(data.court_insert);

// Or, you can use the `Promise` API.
createCourt().then((response) => {
  const data = response.data;
  console.log(data.court_insert);
});
```

### Using `CreateCourt`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCourtRef } from '@dataconnect/generated';


// Call the `createCourtRef()` function to get a reference to the mutation.
const ref = createCourtRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCourtRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.court_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.court_insert);
});
```

## UpdateCourt
You can execute the `UpdateCourt` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCourt(vars: UpdateCourtVariables): MutationPromise<UpdateCourtData, UpdateCourtVariables>;

interface UpdateCourtRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCourtVariables): MutationRef<UpdateCourtData, UpdateCourtVariables>;
}
export const updateCourtRef: UpdateCourtRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCourt(dc: DataConnect, vars: UpdateCourtVariables): MutationPromise<UpdateCourtData, UpdateCourtVariables>;

interface UpdateCourtRef {
  ...
  (dc: DataConnect, vars: UpdateCourtVariables): MutationRef<UpdateCourtData, UpdateCourtVariables>;
}
export const updateCourtRef: UpdateCourtRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCourtRef:
```typescript
const name = updateCourtRef.operationName;
console.log(name);
```

### Variables
The `UpdateCourt` mutation requires an argument of type `UpdateCourtVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCourtVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateCourt` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCourtData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCourtData {
  court_update?: Court_Key | null;
}
```
### Using `UpdateCourt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCourt, UpdateCourtVariables } from '@dataconnect/generated';

// The `UpdateCourt` mutation requires an argument of type `UpdateCourtVariables`:
const updateCourtVars: UpdateCourtVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateCourt()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCourt(updateCourtVars);
// Variables can be defined inline as well.
const { data } = await updateCourt({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCourt(dataConnect, updateCourtVars);

console.log(data.court_update);

// Or, you can use the `Promise` API.
updateCourt(updateCourtVars).then((response) => {
  const data = response.data;
  console.log(data.court_update);
});
```

### Using `UpdateCourt`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCourtRef, UpdateCourtVariables } from '@dataconnect/generated';

// The `UpdateCourt` mutation requires an argument of type `UpdateCourtVariables`:
const updateCourtVars: UpdateCourtVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateCourtRef()` function to get a reference to the mutation.
const ref = updateCourtRef(updateCourtVars);
// Variables can be defined inline as well.
const ref = updateCourtRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCourtRef(dataConnect, updateCourtVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.court_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.court_update);
});
```

## DeleteCourt
You can execute the `DeleteCourt` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteCourt(vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;

interface DeleteCourtRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
}
export const deleteCourtRef: DeleteCourtRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteCourt(dc: DataConnect, vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;

interface DeleteCourtRef {
  ...
  (dc: DataConnect, vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
}
export const deleteCourtRef: DeleteCourtRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteCourtRef:
```typescript
const name = deleteCourtRef.operationName;
console.log(name);
```

### Variables
The `DeleteCourt` mutation requires an argument of type `DeleteCourtVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteCourtVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteCourt` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteCourtData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteCourtData {
  court_delete?: Court_Key | null;
}
```
### Using `DeleteCourt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteCourt, DeleteCourtVariables } from '@dataconnect/generated';

// The `DeleteCourt` mutation requires an argument of type `DeleteCourtVariables`:
const deleteCourtVars: DeleteCourtVariables = {
  id: ..., 
};

// Call the `deleteCourt()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteCourt(deleteCourtVars);
// Variables can be defined inline as well.
const { data } = await deleteCourt({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteCourt(dataConnect, deleteCourtVars);

console.log(data.court_delete);

// Or, you can use the `Promise` API.
deleteCourt(deleteCourtVars).then((response) => {
  const data = response.data;
  console.log(data.court_delete);
});
```

### Using `DeleteCourt`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteCourtRef, DeleteCourtVariables } from '@dataconnect/generated';

// The `DeleteCourt` mutation requires an argument of type `DeleteCourtVariables`:
const deleteCourtVars: DeleteCourtVariables = {
  id: ..., 
};

// Call the `deleteCourtRef()` function to get a reference to the mutation.
const ref = deleteCourtRef(deleteCourtVars);
// Variables can be defined inline as well.
const ref = deleteCourtRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteCourtRef(dataConnect, deleteCourtVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.court_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.court_delete);
});
```

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateUser
You can execute the `UpdateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUser(vars: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;

interface UpdateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
}
export const updateUserRef: UpdateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUser(dc: DataConnect, vars: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;

interface UpdateUserRef {
  ...
  (dc: DataConnect, vars: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
}
export const updateUserRef: UpdateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserRef:
```typescript
const name = updateUserRef.operationName;
console.log(name);
```

### Variables
The `UpdateUser` mutation requires an argument of type `UpdateUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateUserVariables {
  membershipStatus: string;
}
```
### Return Type
Recall that executing the `UpdateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUser, UpdateUserVariables } from '@dataconnect/generated';

// The `UpdateUser` mutation requires an argument of type `UpdateUserVariables`:
const updateUserVars: UpdateUserVariables = {
  membershipStatus: ..., 
};

// Call the `updateUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUser(updateUserVars);
// Variables can be defined inline as well.
const { data } = await updateUser({ membershipStatus: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUser(dataConnect, updateUserVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUser(updateUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserRef, UpdateUserVariables } from '@dataconnect/generated';

// The `UpdateUser` mutation requires an argument of type `UpdateUserVariables`:
const updateUserVars: UpdateUserVariables = {
  membershipStatus: ..., 
};

// Call the `updateUserRef()` function to get a reference to the mutation.
const ref = updateUserRef(updateUserVars);
// Variables can be defined inline as well.
const ref = updateUserRef({ membershipStatus: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserRef(dataConnect, updateUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## DeleteUser
You can execute the `DeleteUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteUser(): MutationPromise<DeleteUserData, undefined>;

interface DeleteUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
}
export const deleteUserRef: DeleteUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface DeleteUserRef {
  ...
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
}
export const deleteUserRef: DeleteUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUserRef:
```typescript
const name = deleteUserRef.operationName;
console.log(name);
```

### Variables
The `DeleteUser` mutation has no variables.
### Return Type
Recall that executing the `DeleteUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUserData {
  user_delete?: User_Key | null;
}
```
### Using `DeleteUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUser } from '@dataconnect/generated';


// Call the `deleteUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUser(dataConnect);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
deleteUser().then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

### Using `DeleteUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUserRef } from '@dataconnect/generated';


// Call the `deleteUserRef()` function to get a reference to the mutation.
const ref = deleteUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

## CreateBooking
You can execute the `CreateBooking` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createBooking(vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;

interface CreateBookingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
}
export const createBookingRef: CreateBookingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createBooking(dc: DataConnect, vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;

interface CreateBookingRef {
  ...
  (dc: DataConnect, vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
}
export const createBookingRef: CreateBookingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createBookingRef:
```typescript
const name = createBookingRef.operationName;
console.log(name);
```

### Variables
The `CreateBooking` mutation requires an argument of type `CreateBookingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateBookingVariables {
  courtId: UUIDString;
  startTime: TimestampString;
  endTime: TimestampString;
}
```
### Return Type
Recall that executing the `CreateBooking` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateBookingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateBookingData {
  booking_insert: Booking_Key;
}
```
### Using `CreateBooking`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createBooking, CreateBookingVariables } from '@dataconnect/generated';

// The `CreateBooking` mutation requires an argument of type `CreateBookingVariables`:
const createBookingVars: CreateBookingVariables = {
  courtId: ..., 
  startTime: ..., 
  endTime: ..., 
};

// Call the `createBooking()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createBooking(createBookingVars);
// Variables can be defined inline as well.
const { data } = await createBooking({ courtId: ..., startTime: ..., endTime: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createBooking(dataConnect, createBookingVars);

console.log(data.booking_insert);

// Or, you can use the `Promise` API.
createBooking(createBookingVars).then((response) => {
  const data = response.data;
  console.log(data.booking_insert);
});
```

### Using `CreateBooking`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createBookingRef, CreateBookingVariables } from '@dataconnect/generated';

// The `CreateBooking` mutation requires an argument of type `CreateBookingVariables`:
const createBookingVars: CreateBookingVariables = {
  courtId: ..., 
  startTime: ..., 
  endTime: ..., 
};

// Call the `createBookingRef()` function to get a reference to the mutation.
const ref = createBookingRef(createBookingVars);
// Variables can be defined inline as well.
const ref = createBookingRef({ courtId: ..., startTime: ..., endTime: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createBookingRef(dataConnect, createBookingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.booking_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.booking_insert);
});
```

## UpdateBooking
You can execute the `UpdateBooking` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateBooking(vars: UpdateBookingVariables): MutationPromise<UpdateBookingData, UpdateBookingVariables>;

interface UpdateBookingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBookingVariables): MutationRef<UpdateBookingData, UpdateBookingVariables>;
}
export const updateBookingRef: UpdateBookingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateBooking(dc: DataConnect, vars: UpdateBookingVariables): MutationPromise<UpdateBookingData, UpdateBookingVariables>;

interface UpdateBookingRef {
  ...
  (dc: DataConnect, vars: UpdateBookingVariables): MutationRef<UpdateBookingData, UpdateBookingVariables>;
}
export const updateBookingRef: UpdateBookingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateBookingRef:
```typescript
const name = updateBookingRef.operationName;
console.log(name);
```

### Variables
The `UpdateBooking` mutation requires an argument of type `UpdateBookingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateBookingVariables {
  id: UUIDString;
  endTime: TimestampString;
}
```
### Return Type
Recall that executing the `UpdateBooking` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateBookingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateBookingData {
  booking_update?: Booking_Key | null;
}
```
### Using `UpdateBooking`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateBooking, UpdateBookingVariables } from '@dataconnect/generated';

// The `UpdateBooking` mutation requires an argument of type `UpdateBookingVariables`:
const updateBookingVars: UpdateBookingVariables = {
  id: ..., 
  endTime: ..., 
};

// Call the `updateBooking()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateBooking(updateBookingVars);
// Variables can be defined inline as well.
const { data } = await updateBooking({ id: ..., endTime: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateBooking(dataConnect, updateBookingVars);

console.log(data.booking_update);

// Or, you can use the `Promise` API.
updateBooking(updateBookingVars).then((response) => {
  const data = response.data;
  console.log(data.booking_update);
});
```

### Using `UpdateBooking`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateBookingRef, UpdateBookingVariables } from '@dataconnect/generated';

// The `UpdateBooking` mutation requires an argument of type `UpdateBookingVariables`:
const updateBookingVars: UpdateBookingVariables = {
  id: ..., 
  endTime: ..., 
};

// Call the `updateBookingRef()` function to get a reference to the mutation.
const ref = updateBookingRef(updateBookingVars);
// Variables can be defined inline as well.
const ref = updateBookingRef({ id: ..., endTime: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateBookingRef(dataConnect, updateBookingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.booking_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.booking_update);
});
```

## DeleteBooking
You can execute the `DeleteBooking` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBooking(vars: DeleteBookingVariables): MutationPromise<DeleteBookingData, DeleteBookingVariables>;

interface DeleteBookingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBookingVariables): MutationRef<DeleteBookingData, DeleteBookingVariables>;
}
export const deleteBookingRef: DeleteBookingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBooking(dc: DataConnect, vars: DeleteBookingVariables): MutationPromise<DeleteBookingData, DeleteBookingVariables>;

interface DeleteBookingRef {
  ...
  (dc: DataConnect, vars: DeleteBookingVariables): MutationRef<DeleteBookingData, DeleteBookingVariables>;
}
export const deleteBookingRef: DeleteBookingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBookingRef:
```typescript
const name = deleteBookingRef.operationName;
console.log(name);
```

### Variables
The `DeleteBooking` mutation requires an argument of type `DeleteBookingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBookingVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteBooking` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBookingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBookingData {
  booking_delete?: Booking_Key | null;
}
```
### Using `DeleteBooking`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBooking, DeleteBookingVariables } from '@dataconnect/generated';

// The `DeleteBooking` mutation requires an argument of type `DeleteBookingVariables`:
const deleteBookingVars: DeleteBookingVariables = {
  id: ..., 
};

// Call the `deleteBooking()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBooking(deleteBookingVars);
// Variables can be defined inline as well.
const { data } = await deleteBooking({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBooking(dataConnect, deleteBookingVars);

console.log(data.booking_delete);

// Or, you can use the `Promise` API.
deleteBooking(deleteBookingVars).then((response) => {
  const data = response.data;
  console.log(data.booking_delete);
});
```

### Using `DeleteBooking`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBookingRef, DeleteBookingVariables } from '@dataconnect/generated';

// The `DeleteBooking` mutation requires an argument of type `DeleteBookingVariables`:
const deleteBookingVars: DeleteBookingVariables = {
  id: ..., 
};

// Call the `deleteBookingRef()` function to get a reference to the mutation.
const ref = deleteBookingRef(deleteBookingVars);
// Variables can be defined inline as well.
const ref = deleteBookingRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBookingRef(dataConnect, deleteBookingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.booking_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.booking_delete);
});
```

## CreateOpenPlaySession
You can execute the `CreateOpenPlaySession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createOpenPlaySession(): MutationPromise<CreateOpenPlaySessionData, undefined>;

interface CreateOpenPlaySessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateOpenPlaySessionData, undefined>;
}
export const createOpenPlaySessionRef: CreateOpenPlaySessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createOpenPlaySession(dc: DataConnect): MutationPromise<CreateOpenPlaySessionData, undefined>;

interface CreateOpenPlaySessionRef {
  ...
  (dc: DataConnect): MutationRef<CreateOpenPlaySessionData, undefined>;
}
export const createOpenPlaySessionRef: CreateOpenPlaySessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createOpenPlaySessionRef:
```typescript
const name = createOpenPlaySessionRef.operationName;
console.log(name);
```

### Variables
The `CreateOpenPlaySession` mutation has no variables.
### Return Type
Recall that executing the `CreateOpenPlaySession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateOpenPlaySessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateOpenPlaySessionData {
  openPlaySession_insert: OpenPlaySession_Key;
}
```
### Using `CreateOpenPlaySession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createOpenPlaySession } from '@dataconnect/generated';


// Call the `createOpenPlaySession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createOpenPlaySession();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createOpenPlaySession(dataConnect);

console.log(data.openPlaySession_insert);

// Or, you can use the `Promise` API.
createOpenPlaySession().then((response) => {
  const data = response.data;
  console.log(data.openPlaySession_insert);
});
```

### Using `CreateOpenPlaySession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createOpenPlaySessionRef } from '@dataconnect/generated';


// Call the `createOpenPlaySessionRef()` function to get a reference to the mutation.
const ref = createOpenPlaySessionRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createOpenPlaySessionRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.openPlaySession_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession_insert);
});
```

## UpdateSession
You can execute the `UpdateSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSession(vars: UpdateSessionVariables): MutationPromise<UpdateSessionData, UpdateSessionVariables>;

interface UpdateSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSessionVariables): MutationRef<UpdateSessionData, UpdateSessionVariables>;
}
export const updateSessionRef: UpdateSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSession(dc: DataConnect, vars: UpdateSessionVariables): MutationPromise<UpdateSessionData, UpdateSessionVariables>;

interface UpdateSessionRef {
  ...
  (dc: DataConnect, vars: UpdateSessionVariables): MutationRef<UpdateSessionData, UpdateSessionVariables>;
}
export const updateSessionRef: UpdateSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSessionRef:
```typescript
const name = updateSessionRef.operationName;
console.log(name);
```

### Variables
The `UpdateSession` mutation requires an argument of type `UpdateSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSessionVariables {
  id: UUIDString;
  currentPlayersCount: number;
}
```
### Return Type
Recall that executing the `UpdateSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSessionData {
  openPlaySession_update?: OpenPlaySession_Key | null;
}
```
### Using `UpdateSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSession, UpdateSessionVariables } from '@dataconnect/generated';

// The `UpdateSession` mutation requires an argument of type `UpdateSessionVariables`:
const updateSessionVars: UpdateSessionVariables = {
  id: ..., 
  currentPlayersCount: ..., 
};

// Call the `updateSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSession(updateSessionVars);
// Variables can be defined inline as well.
const { data } = await updateSession({ id: ..., currentPlayersCount: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSession(dataConnect, updateSessionVars);

console.log(data.openPlaySession_update);

// Or, you can use the `Promise` API.
updateSession(updateSessionVars).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession_update);
});
```

### Using `UpdateSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSessionRef, UpdateSessionVariables } from '@dataconnect/generated';

// The `UpdateSession` mutation requires an argument of type `UpdateSessionVariables`:
const updateSessionVars: UpdateSessionVariables = {
  id: ..., 
  currentPlayersCount: ..., 
};

// Call the `updateSessionRef()` function to get a reference to the mutation.
const ref = updateSessionRef(updateSessionVars);
// Variables can be defined inline as well.
const ref = updateSessionRef({ id: ..., currentPlayersCount: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSessionRef(dataConnect, updateSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.openPlaySession_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession_update);
});
```

## DeleteSession
You can execute the `DeleteSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteSession(vars: DeleteSessionVariables): MutationPromise<DeleteSessionData, DeleteSessionVariables>;

interface DeleteSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSessionVariables): MutationRef<DeleteSessionData, DeleteSessionVariables>;
}
export const deleteSessionRef: DeleteSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSession(dc: DataConnect, vars: DeleteSessionVariables): MutationPromise<DeleteSessionData, DeleteSessionVariables>;

interface DeleteSessionRef {
  ...
  (dc: DataConnect, vars: DeleteSessionVariables): MutationRef<DeleteSessionData, DeleteSessionVariables>;
}
export const deleteSessionRef: DeleteSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSessionRef:
```typescript
const name = deleteSessionRef.operationName;
console.log(name);
```

### Variables
The `DeleteSession` mutation requires an argument of type `DeleteSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSessionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSessionData {
  openPlaySession_delete?: OpenPlaySession_Key | null;
}
```
### Using `DeleteSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSession, DeleteSessionVariables } from '@dataconnect/generated';

// The `DeleteSession` mutation requires an argument of type `DeleteSessionVariables`:
const deleteSessionVars: DeleteSessionVariables = {
  id: ..., 
};

// Call the `deleteSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSession(deleteSessionVars);
// Variables can be defined inline as well.
const { data } = await deleteSession({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSession(dataConnect, deleteSessionVars);

console.log(data.openPlaySession_delete);

// Or, you can use the `Promise` API.
deleteSession(deleteSessionVars).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession_delete);
});
```

### Using `DeleteSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSessionRef, DeleteSessionVariables } from '@dataconnect/generated';

// The `DeleteSession` mutation requires an argument of type `DeleteSessionVariables`:
const deleteSessionVars: DeleteSessionVariables = {
  id: ..., 
};

// Call the `deleteSessionRef()` function to get a reference to the mutation.
const ref = deleteSessionRef(deleteSessionVars);
// Variables can be defined inline as well.
const ref = deleteSessionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSessionRef(dataConnect, deleteSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.openPlaySession_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.openPlaySession_delete);
});
```

## CreateTransaction
You can execute the `CreateTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTransaction(vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface CreateTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
}
export const createTransactionRef: CreateTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTransaction(dc: DataConnect, vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface CreateTransactionRef {
  ...
  (dc: DataConnect, vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
}
export const createTransactionRef: CreateTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTransactionRef:
```typescript
const name = createTransactionRef.operationName;
console.log(name);
```

### Variables
The `CreateTransaction` mutation requires an argument of type `CreateTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateTransactionVariables {
  amount: number;
  description: string;
}
```
### Return Type
Recall that executing the `CreateTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTransactionData {
  transaction_insert: Transaction_Key;
}
```
### Using `CreateTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTransaction, CreateTransactionVariables } from '@dataconnect/generated';

// The `CreateTransaction` mutation requires an argument of type `CreateTransactionVariables`:
const createTransactionVars: CreateTransactionVariables = {
  amount: ..., 
  description: ..., 
};

// Call the `createTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTransaction(createTransactionVars);
// Variables can be defined inline as well.
const { data } = await createTransaction({ amount: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTransaction(dataConnect, createTransactionVars);

console.log(data.transaction_insert);

// Or, you can use the `Promise` API.
createTransaction(createTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_insert);
});
```

### Using `CreateTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTransactionRef, CreateTransactionVariables } from '@dataconnect/generated';

// The `CreateTransaction` mutation requires an argument of type `CreateTransactionVariables`:
const createTransactionVars: CreateTransactionVariables = {
  amount: ..., 
  description: ..., 
};

// Call the `createTransactionRef()` function to get a reference to the mutation.
const ref = createTransactionRef(createTransactionVars);
// Variables can be defined inline as well.
const ref = createTransactionRef({ amount: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTransactionRef(dataConnect, createTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_insert);
});
```

## DeleteTransaction
You can execute the `DeleteTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteTransaction(vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
}
export const deleteTransactionRef: DeleteTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteTransactionRef {
  ...
  (dc: DataConnect, vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
}
export const deleteTransactionRef: DeleteTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTransactionRef:
```typescript
const name = deleteTransactionRef.operationName;
console.log(name);
```

### Variables
The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTransactionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTransactionData {
  transaction_delete?: Transaction_Key | null;
}
```
### Using `DeleteTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTransaction, DeleteTransactionVariables } from '@dataconnect/generated';

// The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`:
const deleteTransactionVars: DeleteTransactionVariables = {
  id: ..., 
};

// Call the `deleteTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTransaction(deleteTransactionVars);
// Variables can be defined inline as well.
const { data } = await deleteTransaction({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTransaction(dataConnect, deleteTransactionVars);

console.log(data.transaction_delete);

// Or, you can use the `Promise` API.
deleteTransaction(deleteTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_delete);
});
```

### Using `DeleteTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTransactionRef, DeleteTransactionVariables } from '@dataconnect/generated';

// The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`:
const deleteTransactionVars: DeleteTransactionVariables = {
  id: ..., 
};

// Call the `deleteTransactionRef()` function to get a reference to the mutation.
const ref = deleteTransactionRef(deleteTransactionVars);
// Variables can be defined inline as well.
const ref = deleteTransactionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTransactionRef(dataConnect, deleteTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_delete);
});
```

## CreateDisplayQueue
You can execute the `CreateDisplayQueue` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createDisplayQueue(vars: CreateDisplayQueueVariables): MutationPromise<CreateDisplayQueueData, CreateDisplayQueueVariables>;

interface CreateDisplayQueueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDisplayQueueVariables): MutationRef<CreateDisplayQueueData, CreateDisplayQueueVariables>;
}
export const createDisplayQueueRef: CreateDisplayQueueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createDisplayQueue(dc: DataConnect, vars: CreateDisplayQueueVariables): MutationPromise<CreateDisplayQueueData, CreateDisplayQueueVariables>;

interface CreateDisplayQueueRef {
  ...
  (dc: DataConnect, vars: CreateDisplayQueueVariables): MutationRef<CreateDisplayQueueData, CreateDisplayQueueVariables>;
}
export const createDisplayQueueRef: CreateDisplayQueueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createDisplayQueueRef:
```typescript
const name = createDisplayQueueRef.operationName;
console.log(name);
```

### Variables
The `CreateDisplayQueue` mutation requires an argument of type `CreateDisplayQueueVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateDisplayQueueVariables {
  sessionId: UUIDString;
  playerOrder?: UUIDString[] | null;
}
```
### Return Type
Recall that executing the `CreateDisplayQueue` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateDisplayQueueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateDisplayQueueData {
  displayQueue_insert: DisplayQueue_Key;
}
```
### Using `CreateDisplayQueue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createDisplayQueue, CreateDisplayQueueVariables } from '@dataconnect/generated';

// The `CreateDisplayQueue` mutation requires an argument of type `CreateDisplayQueueVariables`:
const createDisplayQueueVars: CreateDisplayQueueVariables = {
  sessionId: ..., 
  playerOrder: ..., // optional
};

// Call the `createDisplayQueue()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createDisplayQueue(createDisplayQueueVars);
// Variables can be defined inline as well.
const { data } = await createDisplayQueue({ sessionId: ..., playerOrder: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createDisplayQueue(dataConnect, createDisplayQueueVars);

console.log(data.displayQueue_insert);

// Or, you can use the `Promise` API.
createDisplayQueue(createDisplayQueueVars).then((response) => {
  const data = response.data;
  console.log(data.displayQueue_insert);
});
```

### Using `CreateDisplayQueue`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createDisplayQueueRef, CreateDisplayQueueVariables } from '@dataconnect/generated';

// The `CreateDisplayQueue` mutation requires an argument of type `CreateDisplayQueueVariables`:
const createDisplayQueueVars: CreateDisplayQueueVariables = {
  sessionId: ..., 
  playerOrder: ..., // optional
};

// Call the `createDisplayQueueRef()` function to get a reference to the mutation.
const ref = createDisplayQueueRef(createDisplayQueueVars);
// Variables can be defined inline as well.
const ref = createDisplayQueueRef({ sessionId: ..., playerOrder: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createDisplayQueueRef(dataConnect, createDisplayQueueVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.displayQueue_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.displayQueue_insert);
});
```

## UpdateDisplayQueue
You can execute the `UpdateDisplayQueue` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateDisplayQueue(vars: UpdateDisplayQueueVariables): MutationPromise<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;

interface UpdateDisplayQueueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDisplayQueueVariables): MutationRef<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;
}
export const updateDisplayQueueRef: UpdateDisplayQueueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDisplayQueue(dc: DataConnect, vars: UpdateDisplayQueueVariables): MutationPromise<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;

interface UpdateDisplayQueueRef {
  ...
  (dc: DataConnect, vars: UpdateDisplayQueueVariables): MutationRef<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;
}
export const updateDisplayQueueRef: UpdateDisplayQueueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDisplayQueueRef:
```typescript
const name = updateDisplayQueueRef.operationName;
console.log(name);
```

### Variables
The `UpdateDisplayQueue` mutation requires an argument of type `UpdateDisplayQueueVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateDisplayQueueVariables {
  id: UUIDString;
  playerOrder?: UUIDString[] | null;
}
```
### Return Type
Recall that executing the `UpdateDisplayQueue` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDisplayQueueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDisplayQueueData {
  displayQueue_update?: DisplayQueue_Key | null;
}
```
### Using `UpdateDisplayQueue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDisplayQueue, UpdateDisplayQueueVariables } from '@dataconnect/generated';

// The `UpdateDisplayQueue` mutation requires an argument of type `UpdateDisplayQueueVariables`:
const updateDisplayQueueVars: UpdateDisplayQueueVariables = {
  id: ..., 
  playerOrder: ..., // optional
};

// Call the `updateDisplayQueue()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDisplayQueue(updateDisplayQueueVars);
// Variables can be defined inline as well.
const { data } = await updateDisplayQueue({ id: ..., playerOrder: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDisplayQueue(dataConnect, updateDisplayQueueVars);

console.log(data.displayQueue_update);

// Or, you can use the `Promise` API.
updateDisplayQueue(updateDisplayQueueVars).then((response) => {
  const data = response.data;
  console.log(data.displayQueue_update);
});
```

### Using `UpdateDisplayQueue`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDisplayQueueRef, UpdateDisplayQueueVariables } from '@dataconnect/generated';

// The `UpdateDisplayQueue` mutation requires an argument of type `UpdateDisplayQueueVariables`:
const updateDisplayQueueVars: UpdateDisplayQueueVariables = {
  id: ..., 
  playerOrder: ..., // optional
};

// Call the `updateDisplayQueueRef()` function to get a reference to the mutation.
const ref = updateDisplayQueueRef(updateDisplayQueueVars);
// Variables can be defined inline as well.
const ref = updateDisplayQueueRef({ id: ..., playerOrder: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDisplayQueueRef(dataConnect, updateDisplayQueueVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.displayQueue_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.displayQueue_update);
});
```

## DeleteDisplayQueue
You can execute the `DeleteDisplayQueue` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteDisplayQueue(vars: DeleteDisplayQueueVariables): MutationPromise<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;

interface DeleteDisplayQueueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDisplayQueueVariables): MutationRef<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;
}
export const deleteDisplayQueueRef: DeleteDisplayQueueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteDisplayQueue(dc: DataConnect, vars: DeleteDisplayQueueVariables): MutationPromise<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;

interface DeleteDisplayQueueRef {
  ...
  (dc: DataConnect, vars: DeleteDisplayQueueVariables): MutationRef<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;
}
export const deleteDisplayQueueRef: DeleteDisplayQueueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteDisplayQueueRef:
```typescript
const name = deleteDisplayQueueRef.operationName;
console.log(name);
```

### Variables
The `DeleteDisplayQueue` mutation requires an argument of type `DeleteDisplayQueueVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteDisplayQueueVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteDisplayQueue` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteDisplayQueueData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteDisplayQueueData {
  displayQueue_delete?: DisplayQueue_Key | null;
}
```
### Using `DeleteDisplayQueue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteDisplayQueue, DeleteDisplayQueueVariables } from '@dataconnect/generated';

// The `DeleteDisplayQueue` mutation requires an argument of type `DeleteDisplayQueueVariables`:
const deleteDisplayQueueVars: DeleteDisplayQueueVariables = {
  id: ..., 
};

// Call the `deleteDisplayQueue()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteDisplayQueue(deleteDisplayQueueVars);
// Variables can be defined inline as well.
const { data } = await deleteDisplayQueue({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteDisplayQueue(dataConnect, deleteDisplayQueueVars);

console.log(data.displayQueue_delete);

// Or, you can use the `Promise` API.
deleteDisplayQueue(deleteDisplayQueueVars).then((response) => {
  const data = response.data;
  console.log(data.displayQueue_delete);
});
```

### Using `DeleteDisplayQueue`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteDisplayQueueRef, DeleteDisplayQueueVariables } from '@dataconnect/generated';

// The `DeleteDisplayQueue` mutation requires an argument of type `DeleteDisplayQueueVariables`:
const deleteDisplayQueueVars: DeleteDisplayQueueVariables = {
  id: ..., 
};

// Call the `deleteDisplayQueueRef()` function to get a reference to the mutation.
const ref = deleteDisplayQueueRef(deleteDisplayQueueVars);
// Variables can be defined inline as well.
const ref = deleteDisplayQueueRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteDisplayQueueRef(dataConnect, deleteDisplayQueueVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.displayQueue_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.displayQueue_delete);
});
```

