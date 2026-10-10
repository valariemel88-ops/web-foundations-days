# SnapShare: Photo-Sharing App Scaling Plan

## 1. Assumptions

SnapShare is an app where people can upload photos and view photos shared by people they follow. As the number of users grows, the system needs to handle many uploads and feed requests without becoming slow.

For this assignment, I will use the following assumptions:

* SnapShare has 10 million registered users.
* 10% of the registered users are active each day.
* Each active user uploads one photo per day.
* Each active user views 50 feed pages per day.
* An original photo is about 2 MB.
* Each photo also has a thumbnail of about 50 KB.
* There are 86,400 seconds in a day and 365 days in a year.
* Peak traffic can be five times higher than average traffic.
* I will use 1 TB = 1,000 GB and 1 GB = 1,000 MB.
* All uploaded photos are kept for one year.
* The storage calculation does not include backups, database records, or extra copies of the files.

### Calculating daily active users

To find the number of daily active users, I multiply the total registered users by 10%.

Daily active users = 10,000,000 × 10%

**Daily active users = 1,000,000.**

This means SnapShare needs to support about one million users every day.

## 2. Traffic and Storage Calculations

### A. Photo uploads per second

Each active user uploads one photo per day.

Daily uploads = 1,000,000 × 1

**Total uploads per day = 1,000,000 photos.**

To calculate the average uploads per second, I divide the daily uploads by the number of seconds in a day.

1,000,000 ÷ 86,400 = 11.57

**Average uploads per second ≈ 11.6.**

For peak traffic, I multiply the average by five.

11.6 × 5 = 58

**Peak uploads per second ≈ 58.**

### B. Feed views per second

Each active user views 50 feed pages per day.

Daily feed views = 1,000,000 × 50

**Total feed views per day = 50,000,000.**

Average feed views per second:

50,000,000 ÷ 86,400 ≈ 579

**Average feed views per second ≈ 579.**

Peak feed views per second:

579 × 5 = 2,895

**Peak feed views per second ≈ 2,895.**

These numbers count feed pages requested by users, not individual photos. A single feed page can contain several photos, so the actual number of image requests could be higher.

### C. Photo storage per year

Each original photo takes about 2 MB, and its thumbnail takes 50 KB, which is 0.05 MB.

Total storage per photo:

2 MB + 0.05 MB = 2.05 MB.

**Each photo needs about 2.05 MB of storage.**

Storage for original photos per day:

1,000,000 × 2 MB = 2,000,000 MB = 2 TB.

Storage for thumbnails per day:

1,000,000 × 0.05 MB = 50,000 MB = 50 GB.

Therefore, the total storage needed per day is:

2 TB + 0.05 TB = 2.05 TB.

Storage for one year:

2.05 TB × 365 = 748.25 TB.

**Total estimated storage per year = 748.25 TB.**

This includes:

* Original photos: 730 TB per year.
* Thumbnails: 18.25 TB per year.

This estimate assumes all photos are kept for the entire year. The actual storage needed would be higher if we also include backups, extra copies, and other system data.

## 3. Is SnapShare Read-Heavy or Write-Heavy?

I would describe SnapShare as a **read-heavy system** because users view many more feed pages than the number of photos they upload.

Each day, users upload 1 million photos but view 50 million feed pages. That means there are about 50 feed views for every upload.

Because of this, the system needs to be good at serving feed requests quickly, even when many users are online at the same time.

I would use a CDN to deliver photos, Redis to cache frequently requested data, and a read replica to handle some database queries. The primary database would handle writes, while object storage would keep the actual photos and thumbnails.

This setup helps reduce the amount of work done by the main database and makes it easier to handle more users.

## 4. Why Photos Should Not Be Stored in the Database

I would store the original photos and thumbnails in object storage instead of putting the actual files inside the database.

Photos are large files, and storing millions of them in the database would make it use more space and could make backups and database operations more expensive.

Object storage is better suited for storing large numbers of files. It can also work with a CDN to help users load photos faster.

The database would store information about each photo, such as:

* Photo ID.
* User ID.
* Caption.
* Date uploaded.
* Location or key of the original photo in object storage.
* Location or key of the thumbnail.
* Status showing whether thumbnail processing is complete.

This way, the database manages the information about the photos, while object storage keeps the actual image files.

## 5. SnapShare Architecture Diagram

The diagram below shows how the main parts of SnapShare would work together.

```text
                  +------------------------+
                  |     Users / Clients    |
                  |      Web or Mobile     |
                  +-----------+------------+
                              |
                              v
                  +------------------------+
                  |      DNS Service       |
                  +-----------+------------+
                              |
                  +-----------+------------+
                  |                        |
                  v                        v
          +---------------+       +----------------+
          |      CDN      |       | Load Balancer  |
          | Photos and    |       +-------+--------+
          | Thumbnails    |               |
          +-------+-------+               v
                  |               +-------------------+
                  |               |   App Servers     |
                  |               | Server 1, Server 2|
                  |               +----+---------+----+
                  |                    |         |
                  |                    v         v
                  |              +---------+  +-------------+
                  |              | Redis   |  | Message     |
                  |              | Cache   |  | Queue       |
                  |              +----+----+  +------+------+
                  |                   |              |
                  |                   v              v
                  |             +-----------+  +------------------+
                  |             | Primary   |  | Thumbnail Worker |
                  |             | Database  |  +--------+---------+
                  |             +-----+-----+           |
                  |                   |                 |
                  |                   v                 v
                  |             +-----------+  +------------------+
                  |             | Read      |  | Object Storage   |
                  |             | Replica   |  | Original Photos  |
                  |             | Database  |  | and Thumbnails   |
                  |             +-----------+  +--------+---------+
                  |                                      |
                  +------------ CDN fetches images ------+
```

The application servers can be increased when more users join. The database and object storage are separate because they handle different types of data.

## 6. What Each Component Does

1. **Users / Clients:** These are the people using the app to upload photos and view their feeds.

2. **DNS Service:** DNS helps the user's device find the correct server for the SnapShare website or app.

3. **CDN:** The CDN stores copies of photos and thumbnails closer to users so images can load faster.

4. **Load Balancer:** The load balancer distributes requests between the available application servers so that one server does not handle everything.

5. **App Servers:** These servers process requests, check users' permissions, manage uploads, and retrieve information needed for the feed.

6. **Redis Cache:** Redis keeps frequently requested information in a fast cache, reducing the number of times the application needs to query the database.

7. **Primary Database:** The primary database stores photo information, user details, captions, and upload status, and it handles changes to these records.

8. **Read Replica Database:** The read replica handles some read requests so that the primary database has less work to do.

9. **Object Storage:** Object storage keeps the original photos and their thumbnails instead of storing the image files directly in the database.

10. **Message Queue:** The queue holds jobs that need to be processed in the background, such as creating thumbnails.

11. **Thumbnail Worker:** The worker takes jobs from the queue, creates smaller versions of the uploaded photos, saves them to object storage, and updates the processing status.

## 7. Steps Followed When a User Uploads a Photo

1. **The user selects a photo:** The user chooses a photo to upload through the SnapShare app and may add a caption.

2. **The request reaches the load balancer:** The load balancer receives the request and sends it to an available application server.

3. **The app checks the upload:** The application server checks that the user is logged in, has permission to upload, and has submitted an acceptable file.

4. **The original photo is saved:** The original photo is uploaded to object storage. As the app grows, it could allow the user's device to upload directly to object storage using a secure, temporary upload link.

5. **Photo details are saved:** The application saves the photo ID, user ID, caption, storage location, upload time, and processing status in the primary database.

6. **A thumbnail job is added to the queue:** The application sends a message to the queue telling the worker which photo needs a thumbnail.

7. **The application responds to the user:** Once the original photo and its details have been saved and the job has been accepted by the queue, the application can confirm the upload without waiting for the thumbnail to be created.

8. **The worker creates the thumbnail:** The background worker takes the job from the queue, gets the original photo from object storage, and creates a smaller version.

9. **The thumbnail is saved:** The worker stores the thumbnail in object storage and updates the database to show that processing is complete.

10. **The photo can appear in the feed:** When the feed is loaded, the app retrieves the photo details. If the thumbnail is ready, it displays it; otherwise, it can show a placeholder until processing finishes.

11. **The CDN serves the image:** When someone views the photo, the CDN serves a cached copy if it has one. If not, it fetches the image from the configured storage origin and can cache it for future requests.

12. **The cache is kept up to date:** If a user edits or deletes a photo, the application updates or removes the affected cached information so that users are less likely to see outdated data.

## 8. Trade-Offs

### Trade-Off 1: Speed vs. Fresh Data

Using Redis and a CDN helps the app load feeds and photos faster because it does not need to fetch everything from the database or storage every time.

However, cached information can become outdated when a user changes or deletes a photo.

**My decision:** I would cache frequently requested information but update or remove affected cache entries when changes happen.

### Trade-Off 2: Background Processing vs. Immediate Results

Creating thumbnails in the background means users do not have to wait for image processing before the upload can be confirmed.

However, the thumbnail might not be ready immediately, so the user may see a placeholder for a short time.

**My decision:** I would use a background worker to create thumbnails and show a placeholder until they are ready.

### Trade-Off 3: Faster Database Reads vs. Consistency

A read replica helps the system handle more feed requests without putting all the pressure on the primary database.

However, there may be a short delay before changes made in the primary database appear in the replica.

**My decision:** I would use the replica for normal feed requests but use the primary database when a user needs to see a recent change immediately.

### Trade-Off 4: Reliability vs. Cost

Having several application servers, database replicas, backups, and reliable storage can help the app keep working when something fails.

The disadvantage is that these extra resources cost more money and require more management.

**My decision:** I would start with a simple design that can scale when needed, then add more resources and redundancy as the number of users grows.

## 9. Conclusion

From my calculations, SnapShare would have around 1 million daily active users. They would upload about 1 million photos and view 50 million feed pages every day.

The average upload rate would be about 11.6 photos per second, while the average feed-view rate would be around 579 requests per second. During peak periods, feed views could reach approximately 2,895 requests per second.

SnapShare would need about 748.25 TB of storage each year for original photos and thumbnails alone, excluding backups and other extra storage.

Since the app is read-heavy, I would use a CDN, Redis cache, and a database read replica to help serve feed requests faster. I would store the actual photos in object storage and use a queue with a background worker to create thumbnails.

Overall, this design would help SnapShare handle more users while keeping the app responsive. It also involves trade-offs between speed, fresh data, reliability, and cost that would need to be considered as the app grows.
