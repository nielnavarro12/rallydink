import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Booking_Key {
  id: UUIDString;
  __typename?: 'Booking_Key';
}

export interface Court_Key {
  id: UUIDString;
  __typename?: 'Court_Key';
}

export interface CreateBookingData {
  booking_insert: Booking_Key;
}

export interface CreateBookingVariables {
  courtId: UUIDString;
  startTime: TimestampString;
  endTime: TimestampString;
}

export interface CreateCourtData {
  court_insert: Court_Key;
}

export interface CreateDisplayQueueData {
  displayQueue_insert: DisplayQueue_Key;
}

export interface CreateDisplayQueueVariables {
  sessionId: UUIDString;
  playerOrder?: UUIDString[] | null;
}

export interface CreateOpenPlaySessionData {
  openPlaySession_insert: OpenPlaySession_Key;
}

export interface CreateTransactionData {
  transaction_insert: Transaction_Key;
}

export interface CreateTransactionVariables {
  amount: number;
  description: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeleteBookingData {
  booking_delete?: Booking_Key | null;
}

export interface DeleteBookingVariables {
  id: UUIDString;
}

export interface DeleteCourtData {
  court_delete?: Court_Key | null;
}

export interface DeleteCourtVariables {
  id: UUIDString;
}

export interface DeleteDisplayQueueData {
  displayQueue_delete?: DisplayQueue_Key | null;
}

export interface DeleteDisplayQueueVariables {
  id: UUIDString;
}

export interface DeleteSessionData {
  openPlaySession_delete?: OpenPlaySession_Key | null;
}

export interface DeleteSessionVariables {
  id: UUIDString;
}

export interface DeleteTransactionData {
  transaction_delete?: Transaction_Key | null;
}

export interface DeleteTransactionVariables {
  id: UUIDString;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface DisplayQueue_Key {
  id: UUIDString;
  __typename?: 'DisplayQueue_Key';
}

export interface GetBookingData {
  booking?: {
    startTime: TimestampString;
    endTime: TimestampString;
    court: {
      name: string;
    };
  };
}

export interface GetBookingVariables {
  id: UUIDString;
}

export interface GetCourtData {
  court?: {
    name: string;
    status: string;
    amenities?: string | null;
  };
}

export interface GetCourtVariables {
  id: UUIDString;
}

export interface GetDisplayQueueData {
  displayQueue?: {
    playerOrder?: UUIDString[] | null;
    session: {
      name: string;
    };
  };
}

export interface GetDisplayQueueVariables {
  id: UUIDString;
}

export interface GetMyProfileData {
  user?: {
    email: string;
    role: string;
    membershipStatus?: string | null;
    phone?: string | null;
  };
}

export interface GetSessionData {
  openPlaySession?: {
    name: string;
    startTime: TimestampString;
    maxCapacity: number;
  };
}

export interface GetSessionVariables {
  id: UUIDString;
}

export interface GetTransactionData {
  transaction?: {
    amount: number;
    itemDescription: string;
    timestamp: TimestampString;
  };
}

export interface GetTransactionVariables {
  id: UUIDString;
}

export interface ListCourtsData {
  courts: ({
    name: string;
    status: string;
  })[];
}

export interface ListMyBookingsData {
  bookings: ({
    startTime: TimestampString;
    endTime: TimestampString;
    court: {
      name: string;
    };
  })[];
}

export interface ListMyTransactionsData {
  transactions: ({
    amount: number;
    itemDescription: string;
    timestamp: TimestampString;
  })[];
}

export interface ListQueuesData {
  displayQueues: ({
    id: UUIDString;
    playerOrder?: UUIDString[] | null;
  } & DisplayQueue_Key)[];
}

export interface ListSessionsData {
  openPlaySessions: ({
    name: string;
    startTime: TimestampString;
  })[];
}

export interface ListUsersData {
  users: ({
    email: string;
    role: string;
  })[];
}

export interface OpenPlaySession_Key {
  id: UUIDString;
  __typename?: 'OpenPlaySession_Key';
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface UpdateBookingData {
  booking_update?: Booking_Key | null;
}

export interface UpdateBookingVariables {
  id: UUIDString;
  endTime: TimestampString;
}

export interface UpdateCourtData {
  court_update?: Court_Key | null;
}

export interface UpdateCourtVariables {
  id: UUIDString;
  status: string;
}

export interface UpdateDisplayQueueData {
  displayQueue_update?: DisplayQueue_Key | null;
}

export interface UpdateDisplayQueueVariables {
  id: UUIDString;
  playerOrder?: UUIDString[] | null;
}

export interface UpdateSessionData {
  openPlaySession_update?: OpenPlaySession_Key | null;
}

export interface UpdateSessionVariables {
  id: UUIDString;
  currentPlayersCount: number;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface UpdateUserVariables {
  membershipStatus: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateCourtRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateCourtData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateCourtData, undefined>;
  operationName: string;
}
export const createCourtRef: CreateCourtRef;

export function createCourt(): MutationPromise<CreateCourtData, undefined>;
export function createCourt(dc: DataConnect): MutationPromise<CreateCourtData, undefined>;

interface UpdateCourtRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCourtVariables): MutationRef<UpdateCourtData, UpdateCourtVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCourtVariables): MutationRef<UpdateCourtData, UpdateCourtVariables>;
  operationName: string;
}
export const updateCourtRef: UpdateCourtRef;

export function updateCourt(vars: UpdateCourtVariables): MutationPromise<UpdateCourtData, UpdateCourtVariables>;
export function updateCourt(dc: DataConnect, vars: UpdateCourtVariables): MutationPromise<UpdateCourtData, UpdateCourtVariables>;

interface DeleteCourtRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
  operationName: string;
}
export const deleteCourtRef: DeleteCourtRef;

export function deleteCourt(vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;
export function deleteCourt(dc: DataConnect, vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;

interface GetCourtRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCourtVariables): QueryRef<GetCourtData, GetCourtVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCourtVariables): QueryRef<GetCourtData, GetCourtVariables>;
  operationName: string;
}
export const getCourtRef: GetCourtRef;

export function getCourt(vars: GetCourtVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourtData, GetCourtVariables>;
export function getCourt(dc: DataConnect, vars: GetCourtVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourtData, GetCourtVariables>;

interface ListCourtsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCourtsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCourtsData, undefined>;
  operationName: string;
}
export const listCourtsRef: ListCourtsRef;

export function listCourts(options?: ExecuteQueryOptions): QueryPromise<ListCourtsData, undefined>;
export function listCourts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCourtsData, undefined>;

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(vars: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;
export function updateUser(dc: DataConnect, vars: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
  operationName: string;
}
export const getMyProfileRef: GetMyProfileRef;

export function getMyProfile(options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;
export function getMyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface CreateBookingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
  operationName: string;
}
export const createBookingRef: CreateBookingRef;

export function createBooking(vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;
export function createBooking(dc: DataConnect, vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;

interface UpdateBookingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBookingVariables): MutationRef<UpdateBookingData, UpdateBookingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateBookingVariables): MutationRef<UpdateBookingData, UpdateBookingVariables>;
  operationName: string;
}
export const updateBookingRef: UpdateBookingRef;

export function updateBooking(vars: UpdateBookingVariables): MutationPromise<UpdateBookingData, UpdateBookingVariables>;
export function updateBooking(dc: DataConnect, vars: UpdateBookingVariables): MutationPromise<UpdateBookingData, UpdateBookingVariables>;

interface DeleteBookingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBookingVariables): MutationRef<DeleteBookingData, DeleteBookingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteBookingVariables): MutationRef<DeleteBookingData, DeleteBookingVariables>;
  operationName: string;
}
export const deleteBookingRef: DeleteBookingRef;

export function deleteBooking(vars: DeleteBookingVariables): MutationPromise<DeleteBookingData, DeleteBookingVariables>;
export function deleteBooking(dc: DataConnect, vars: DeleteBookingVariables): MutationPromise<DeleteBookingData, DeleteBookingVariables>;

interface GetBookingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBookingVariables): QueryRef<GetBookingData, GetBookingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBookingVariables): QueryRef<GetBookingData, GetBookingVariables>;
  operationName: string;
}
export const getBookingRef: GetBookingRef;

export function getBooking(vars: GetBookingVariables, options?: ExecuteQueryOptions): QueryPromise<GetBookingData, GetBookingVariables>;
export function getBooking(dc: DataConnect, vars: GetBookingVariables, options?: ExecuteQueryOptions): QueryPromise<GetBookingData, GetBookingVariables>;

interface ListMyBookingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyBookingsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyBookingsData, undefined>;
  operationName: string;
}
export const listMyBookingsRef: ListMyBookingsRef;

export function listMyBookings(options?: ExecuteQueryOptions): QueryPromise<ListMyBookingsData, undefined>;
export function listMyBookings(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyBookingsData, undefined>;

interface CreateOpenPlaySessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateOpenPlaySessionData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateOpenPlaySessionData, undefined>;
  operationName: string;
}
export const createOpenPlaySessionRef: CreateOpenPlaySessionRef;

export function createOpenPlaySession(): MutationPromise<CreateOpenPlaySessionData, undefined>;
export function createOpenPlaySession(dc: DataConnect): MutationPromise<CreateOpenPlaySessionData, undefined>;

interface UpdateSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSessionVariables): MutationRef<UpdateSessionData, UpdateSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSessionVariables): MutationRef<UpdateSessionData, UpdateSessionVariables>;
  operationName: string;
}
export const updateSessionRef: UpdateSessionRef;

export function updateSession(vars: UpdateSessionVariables): MutationPromise<UpdateSessionData, UpdateSessionVariables>;
export function updateSession(dc: DataConnect, vars: UpdateSessionVariables): MutationPromise<UpdateSessionData, UpdateSessionVariables>;

interface DeleteSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSessionVariables): MutationRef<DeleteSessionData, DeleteSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSessionVariables): MutationRef<DeleteSessionData, DeleteSessionVariables>;
  operationName: string;
}
export const deleteSessionRef: DeleteSessionRef;

export function deleteSession(vars: DeleteSessionVariables): MutationPromise<DeleteSessionData, DeleteSessionVariables>;
export function deleteSession(dc: DataConnect, vars: DeleteSessionVariables): MutationPromise<DeleteSessionData, DeleteSessionVariables>;

interface GetSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSessionVariables): QueryRef<GetSessionData, GetSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSessionVariables): QueryRef<GetSessionData, GetSessionVariables>;
  operationName: string;
}
export const getSessionRef: GetSessionRef;

export function getSession(vars: GetSessionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSessionData, GetSessionVariables>;
export function getSession(dc: DataConnect, vars: GetSessionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSessionData, GetSessionVariables>;

interface ListSessionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSessionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSessionsData, undefined>;
  operationName: string;
}
export const listSessionsRef: ListSessionsRef;

export function listSessions(options?: ExecuteQueryOptions): QueryPromise<ListSessionsData, undefined>;
export function listSessions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSessionsData, undefined>;

interface CreateTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
  operationName: string;
}
export const createTransactionRef: CreateTransactionRef;

export function createTransaction(vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;
export function createTransaction(dc: DataConnect, vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface DeleteTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
  operationName: string;
}
export const deleteTransactionRef: DeleteTransactionRef;

export function deleteTransaction(vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;
export function deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface GetTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTransactionVariables): QueryRef<GetTransactionData, GetTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTransactionVariables): QueryRef<GetTransactionData, GetTransactionVariables>;
  operationName: string;
}
export const getTransactionRef: GetTransactionRef;

export function getTransaction(vars: GetTransactionVariables, options?: ExecuteQueryOptions): QueryPromise<GetTransactionData, GetTransactionVariables>;
export function getTransaction(dc: DataConnect, vars: GetTransactionVariables, options?: ExecuteQueryOptions): QueryPromise<GetTransactionData, GetTransactionVariables>;

interface ListMyTransactionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyTransactionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyTransactionsData, undefined>;
  operationName: string;
}
export const listMyTransactionsRef: ListMyTransactionsRef;

export function listMyTransactions(options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, undefined>;
export function listMyTransactions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, undefined>;

interface CreateDisplayQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDisplayQueueVariables): MutationRef<CreateDisplayQueueData, CreateDisplayQueueVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateDisplayQueueVariables): MutationRef<CreateDisplayQueueData, CreateDisplayQueueVariables>;
  operationName: string;
}
export const createDisplayQueueRef: CreateDisplayQueueRef;

export function createDisplayQueue(vars: CreateDisplayQueueVariables): MutationPromise<CreateDisplayQueueData, CreateDisplayQueueVariables>;
export function createDisplayQueue(dc: DataConnect, vars: CreateDisplayQueueVariables): MutationPromise<CreateDisplayQueueData, CreateDisplayQueueVariables>;

interface UpdateDisplayQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDisplayQueueVariables): MutationRef<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDisplayQueueVariables): MutationRef<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;
  operationName: string;
}
export const updateDisplayQueueRef: UpdateDisplayQueueRef;

export function updateDisplayQueue(vars: UpdateDisplayQueueVariables): MutationPromise<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;
export function updateDisplayQueue(dc: DataConnect, vars: UpdateDisplayQueueVariables): MutationPromise<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;

interface DeleteDisplayQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDisplayQueueVariables): MutationRef<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteDisplayQueueVariables): MutationRef<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;
  operationName: string;
}
export const deleteDisplayQueueRef: DeleteDisplayQueueRef;

export function deleteDisplayQueue(vars: DeleteDisplayQueueVariables): MutationPromise<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;
export function deleteDisplayQueue(dc: DataConnect, vars: DeleteDisplayQueueVariables): MutationPromise<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;

interface GetDisplayQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDisplayQueueVariables): QueryRef<GetDisplayQueueData, GetDisplayQueueVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDisplayQueueVariables): QueryRef<GetDisplayQueueData, GetDisplayQueueVariables>;
  operationName: string;
}
export const getDisplayQueueRef: GetDisplayQueueRef;

export function getDisplayQueue(vars: GetDisplayQueueVariables, options?: ExecuteQueryOptions): QueryPromise<GetDisplayQueueData, GetDisplayQueueVariables>;
export function getDisplayQueue(dc: DataConnect, vars: GetDisplayQueueVariables, options?: ExecuteQueryOptions): QueryPromise<GetDisplayQueueData, GetDisplayQueueVariables>;

interface ListQueuesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListQueuesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListQueuesData, undefined>;
  operationName: string;
}
export const listQueuesRef: ListQueuesRef;

export function listQueues(options?: ExecuteQueryOptions): QueryPromise<ListQueuesData, undefined>;
export function listQueues(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListQueuesData, undefined>;

