import { CreateCourtData, UpdateCourtData, UpdateCourtVariables, DeleteCourtData, DeleteCourtVariables, GetCourtData, GetCourtVariables, ListCourtsData, CreateUserData, UpdateUserData, UpdateUserVariables, DeleteUserData, GetMyProfileData, ListUsersData, CreateBookingData, CreateBookingVariables, UpdateBookingData, UpdateBookingVariables, DeleteBookingData, DeleteBookingVariables, GetBookingData, GetBookingVariables, ListMyBookingsData, CreateOpenPlaySessionData, UpdateSessionData, UpdateSessionVariables, DeleteSessionData, DeleteSessionVariables, GetSessionData, GetSessionVariables, ListSessionsData, CreateTransactionData, CreateTransactionVariables, DeleteTransactionData, DeleteTransactionVariables, GetTransactionData, GetTransactionVariables, ListMyTransactionsData, CreateDisplayQueueData, CreateDisplayQueueVariables, UpdateDisplayQueueData, UpdateDisplayQueueVariables, DeleteDisplayQueueData, DeleteDisplayQueueVariables, GetDisplayQueueData, GetDisplayQueueVariables, ListQueuesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateCourt(options?: useDataConnectMutationOptions<CreateCourtData, FirebaseError, void>): UseDataConnectMutationResult<CreateCourtData, undefined>;
export function useCreateCourt(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCourtData, FirebaseError, void>): UseDataConnectMutationResult<CreateCourtData, undefined>;

export function useUpdateCourt(options?: useDataConnectMutationOptions<UpdateCourtData, FirebaseError, UpdateCourtVariables>): UseDataConnectMutationResult<UpdateCourtData, UpdateCourtVariables>;
export function useUpdateCourt(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCourtData, FirebaseError, UpdateCourtVariables>): UseDataConnectMutationResult<UpdateCourtData, UpdateCourtVariables>;

export function useDeleteCourt(options?: useDataConnectMutationOptions<DeleteCourtData, FirebaseError, DeleteCourtVariables>): UseDataConnectMutationResult<DeleteCourtData, DeleteCourtVariables>;
export function useDeleteCourt(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteCourtData, FirebaseError, DeleteCourtVariables>): UseDataConnectMutationResult<DeleteCourtData, DeleteCourtVariables>;

export function useGetCourt(vars: GetCourtVariables, options?: useDataConnectQueryOptions<GetCourtData>): UseDataConnectQueryResult<GetCourtData, GetCourtVariables>;
export function useGetCourt(dc: DataConnect, vars: GetCourtVariables, options?: useDataConnectQueryOptions<GetCourtData>): UseDataConnectQueryResult<GetCourtData, GetCourtVariables>;

export function useListCourts(options?: useDataConnectQueryOptions<ListCourtsData>): UseDataConnectQueryResult<ListCourtsData, undefined>;
export function useListCourts(dc: DataConnect, options?: useDataConnectQueryOptions<ListCourtsData>): UseDataConnectQueryResult<ListCourtsData, undefined>;

export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;

export function useGetMyProfile(options?: useDataConnectQueryOptions<GetMyProfileData>): UseDataConnectQueryResult<GetMyProfileData, undefined>;
export function useGetMyProfile(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyProfileData>): UseDataConnectQueryResult<GetMyProfileData, undefined>;

export function useListUsers(options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
export function useListUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;

export function useCreateBooking(options?: useDataConnectMutationOptions<CreateBookingData, FirebaseError, CreateBookingVariables>): UseDataConnectMutationResult<CreateBookingData, CreateBookingVariables>;
export function useCreateBooking(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBookingData, FirebaseError, CreateBookingVariables>): UseDataConnectMutationResult<CreateBookingData, CreateBookingVariables>;

export function useUpdateBooking(options?: useDataConnectMutationOptions<UpdateBookingData, FirebaseError, UpdateBookingVariables>): UseDataConnectMutationResult<UpdateBookingData, UpdateBookingVariables>;
export function useUpdateBooking(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBookingData, FirebaseError, UpdateBookingVariables>): UseDataConnectMutationResult<UpdateBookingData, UpdateBookingVariables>;

export function useDeleteBooking(options?: useDataConnectMutationOptions<DeleteBookingData, FirebaseError, DeleteBookingVariables>): UseDataConnectMutationResult<DeleteBookingData, DeleteBookingVariables>;
export function useDeleteBooking(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBookingData, FirebaseError, DeleteBookingVariables>): UseDataConnectMutationResult<DeleteBookingData, DeleteBookingVariables>;

export function useGetBooking(vars: GetBookingVariables, options?: useDataConnectQueryOptions<GetBookingData>): UseDataConnectQueryResult<GetBookingData, GetBookingVariables>;
export function useGetBooking(dc: DataConnect, vars: GetBookingVariables, options?: useDataConnectQueryOptions<GetBookingData>): UseDataConnectQueryResult<GetBookingData, GetBookingVariables>;

export function useListMyBookings(options?: useDataConnectQueryOptions<ListMyBookingsData>): UseDataConnectQueryResult<ListMyBookingsData, undefined>;
export function useListMyBookings(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyBookingsData>): UseDataConnectQueryResult<ListMyBookingsData, undefined>;

export function useCreateOpenPlaySession(options?: useDataConnectMutationOptions<CreateOpenPlaySessionData, FirebaseError, void>): UseDataConnectMutationResult<CreateOpenPlaySessionData, undefined>;
export function useCreateOpenPlaySession(dc: DataConnect, options?: useDataConnectMutationOptions<CreateOpenPlaySessionData, FirebaseError, void>): UseDataConnectMutationResult<CreateOpenPlaySessionData, undefined>;

export function useUpdateSession(options?: useDataConnectMutationOptions<UpdateSessionData, FirebaseError, UpdateSessionVariables>): UseDataConnectMutationResult<UpdateSessionData, UpdateSessionVariables>;
export function useUpdateSession(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSessionData, FirebaseError, UpdateSessionVariables>): UseDataConnectMutationResult<UpdateSessionData, UpdateSessionVariables>;

export function useDeleteSession(options?: useDataConnectMutationOptions<DeleteSessionData, FirebaseError, DeleteSessionVariables>): UseDataConnectMutationResult<DeleteSessionData, DeleteSessionVariables>;
export function useDeleteSession(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSessionData, FirebaseError, DeleteSessionVariables>): UseDataConnectMutationResult<DeleteSessionData, DeleteSessionVariables>;

export function useGetSession(vars: GetSessionVariables, options?: useDataConnectQueryOptions<GetSessionData>): UseDataConnectQueryResult<GetSessionData, GetSessionVariables>;
export function useGetSession(dc: DataConnect, vars: GetSessionVariables, options?: useDataConnectQueryOptions<GetSessionData>): UseDataConnectQueryResult<GetSessionData, GetSessionVariables>;

export function useListSessions(options?: useDataConnectQueryOptions<ListSessionsData>): UseDataConnectQueryResult<ListSessionsData, undefined>;
export function useListSessions(dc: DataConnect, options?: useDataConnectQueryOptions<ListSessionsData>): UseDataConnectQueryResult<ListSessionsData, undefined>;

export function useCreateTransaction(options?: useDataConnectMutationOptions<CreateTransactionData, FirebaseError, CreateTransactionVariables>): UseDataConnectMutationResult<CreateTransactionData, CreateTransactionVariables>;
export function useCreateTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTransactionData, FirebaseError, CreateTransactionVariables>): UseDataConnectMutationResult<CreateTransactionData, CreateTransactionVariables>;

export function useDeleteTransaction(options?: useDataConnectMutationOptions<DeleteTransactionData, FirebaseError, DeleteTransactionVariables>): UseDataConnectMutationResult<DeleteTransactionData, DeleteTransactionVariables>;
export function useDeleteTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteTransactionData, FirebaseError, DeleteTransactionVariables>): UseDataConnectMutationResult<DeleteTransactionData, DeleteTransactionVariables>;

export function useGetTransaction(vars: GetTransactionVariables, options?: useDataConnectQueryOptions<GetTransactionData>): UseDataConnectQueryResult<GetTransactionData, GetTransactionVariables>;
export function useGetTransaction(dc: DataConnect, vars: GetTransactionVariables, options?: useDataConnectQueryOptions<GetTransactionData>): UseDataConnectQueryResult<GetTransactionData, GetTransactionVariables>;

export function useListMyTransactions(options?: useDataConnectQueryOptions<ListMyTransactionsData>): UseDataConnectQueryResult<ListMyTransactionsData, undefined>;
export function useListMyTransactions(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyTransactionsData>): UseDataConnectQueryResult<ListMyTransactionsData, undefined>;

export function useCreateDisplayQueue(options?: useDataConnectMutationOptions<CreateDisplayQueueData, FirebaseError, CreateDisplayQueueVariables>): UseDataConnectMutationResult<CreateDisplayQueueData, CreateDisplayQueueVariables>;
export function useCreateDisplayQueue(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDisplayQueueData, FirebaseError, CreateDisplayQueueVariables>): UseDataConnectMutationResult<CreateDisplayQueueData, CreateDisplayQueueVariables>;

export function useUpdateDisplayQueue(options?: useDataConnectMutationOptions<UpdateDisplayQueueData, FirebaseError, UpdateDisplayQueueVariables>): UseDataConnectMutationResult<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;
export function useUpdateDisplayQueue(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateDisplayQueueData, FirebaseError, UpdateDisplayQueueVariables>): UseDataConnectMutationResult<UpdateDisplayQueueData, UpdateDisplayQueueVariables>;

export function useDeleteDisplayQueue(options?: useDataConnectMutationOptions<DeleteDisplayQueueData, FirebaseError, DeleteDisplayQueueVariables>): UseDataConnectMutationResult<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;
export function useDeleteDisplayQueue(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteDisplayQueueData, FirebaseError, DeleteDisplayQueueVariables>): UseDataConnectMutationResult<DeleteDisplayQueueData, DeleteDisplayQueueVariables>;

export function useGetDisplayQueue(vars: GetDisplayQueueVariables, options?: useDataConnectQueryOptions<GetDisplayQueueData>): UseDataConnectQueryResult<GetDisplayQueueData, GetDisplayQueueVariables>;
export function useGetDisplayQueue(dc: DataConnect, vars: GetDisplayQueueVariables, options?: useDataConnectQueryOptions<GetDisplayQueueData>): UseDataConnectQueryResult<GetDisplayQueueData, GetDisplayQueueVariables>;

export function useListQueues(options?: useDataConnectQueryOptions<ListQueuesData>): UseDataConnectQueryResult<ListQueuesData, undefined>;
export function useListQueues(dc: DataConnect, options?: useDataConnectQueryOptions<ListQueuesData>): UseDataConnectQueryResult<ListQueuesData, undefined>;
