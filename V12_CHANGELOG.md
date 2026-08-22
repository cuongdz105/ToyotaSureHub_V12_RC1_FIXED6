# ToyotaSureHub V12

- Added one shared in-memory application data store.
- Moved business-data reads/writes away from LocalStorage to Supabase.
- Added Supabase-backed Facebook Accounts, Groups, Campaigns, Queue, Customers and AI History services.
- Dashboard and CarList now read the same cars store.
- Added Supabase car image synchronization using the `car-images` bucket and `car_images` table.
- Restoring a sold car copies its stored images to the new car record.
- Facebook Car -> Post navigation now carries `carId` through React Router state.
- Removed legacy LocalStorage business-data services/files.
- AI History retention defaults to 90 days.
- Restored the Supabase authentication/protected-route files into the V12 source.


## V12 stabilization pass

- Shared in-memory `appDataStore` is the only client-side business-data cache.
- Dashboard, CarList, Priority and Facebook workflows consume the same store.
- Removed Router workflow dependency on sessionStorage for selected car/group context.
- Queue jobs are deleted before campaigns when a car is marked sold, respecting foreign keys.
- Car deletion removes related image records and Storage objects before deleting the car.
- Priority Work Panel now reacts to shared store updates instead of browser storage events.
- AI history retention remains 90 days.
