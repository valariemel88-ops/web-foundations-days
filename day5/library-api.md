# Library Books REST API

This API manages a library's books resource using RESTful HTTP endpoints.

## 1. List all books

* **Method:** GET
* **Path:** `/books`
* **Description:** Returns a list of all books.
* **Success status:** `200 OK`

## 2. Get one book

* **Method:** GET
* **Path:** `/books/:id`
* **Description:** Returns one book using its ID.
* **Success status:** `200 OK`

## 3. Create a book

* **Method:** POST
* **Path:** `/books`
* **Description:** Creates a new book.
* **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

* **Success status:** `201 Created`

## 4. Update a book

* **Method:** PUT
* **Path:** `/books/:id`
* **Description:** Replaces the details of an existing book.
* **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

* **Success status:** `200 OK`

## 5. Delete a book

* **Method:** DELETE
* **Path:** `/books/:id`
* **Description:** Deletes a book using its ID.
* **Success status:** `204 No Content`

## 6. List books by author

* **Method:** GET
* **Path:** `/books?author=Chinua%20Achebe`
* **Description:** Returns books written by the specified author.
* **Success status:** `200 OK`

## Error Codes

### 400 Bad Request

* **Description:** The request is invalid or missing required information.
* **Example:** A client tries to create a book without providing a title.

### 404 Not Found

* **Description:** The requested resource does not exist.
* **Example:** A client requests `GET /books/9999` when book `9999` does not exist.
