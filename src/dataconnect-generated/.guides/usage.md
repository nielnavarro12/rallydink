# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateCourt, useUpdateCourt, useDeleteCourt, useGetCourt, useListCourts, useCreateUser, useUpdateUser, useDeleteUser, useGetMyProfile, useListUsers } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateCourt();

const { data, isPending, isSuccess, isError, error } = useUpdateCourt(updateCourtVars);

const { data, isPending, isSuccess, isError, error } = useDeleteCourt(deleteCourtVars);

const { data, isPending, isSuccess, isError, error } = useGetCourt(getCourtVars);

const { data, isPending, isSuccess, isError, error } = useListCourts();

const { data, isPending, isSuccess, isError, error } = useCreateUser();

const { data, isPending, isSuccess, isError, error } = useUpdateUser(updateUserVars);

const { data, isPending, isSuccess, isError, error } = useDeleteUser();

const { data, isPending, isSuccess, isError, error } = useGetMyProfile();

const { data, isPending, isSuccess, isError, error } = useListUsers();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createCourt, updateCourt, deleteCourt, getCourt, listCourts, createUser, updateUser, deleteUser, getMyProfile, listUsers } from '@dataconnect/generated';


// Operation CreateCourt: 
const { data } = await CreateCourt(dataConnect);

// Operation UpdateCourt:  For variables, look at type UpdateCourtVars in ../index.d.ts
const { data } = await UpdateCourt(dataConnect, updateCourtVars);

// Operation DeleteCourt:  For variables, look at type DeleteCourtVars in ../index.d.ts
const { data } = await DeleteCourt(dataConnect, deleteCourtVars);

// Operation GetCourt:  For variables, look at type GetCourtVars in ../index.d.ts
const { data } = await GetCourt(dataConnect, getCourtVars);

// Operation ListCourts: 
const { data } = await ListCourts(dataConnect);

// Operation CreateUser: 
const { data } = await CreateUser(dataConnect);

// Operation UpdateUser:  For variables, look at type UpdateUserVars in ../index.d.ts
const { data } = await UpdateUser(dataConnect, updateUserVars);

// Operation DeleteUser: 
const { data } = await DeleteUser(dataConnect);

// Operation GetMyProfile: 
const { data } = await GetMyProfile(dataConnect);

// Operation ListUsers: 
const { data } = await ListUsers(dataConnect);


```