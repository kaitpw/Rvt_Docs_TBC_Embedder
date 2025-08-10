Batch Create large batches of API requests for asynchronous processing. The
Batch API returns completions within 24 hours for a 50% discount. Related guide:
Batch

Create batch post

https://api.openai.com/v1/batches Creates and executes a batch from an uploaded
file of requests

Request body completion_window string

Required The time frame within which the batch should be processed. Currently
only 24h is supported.

endpoint string

Required The endpoint to be used for all requests in the batch. Currently
/v1/responses, /v1/chat/completions, /v1/embeddings, and /v1/completions are
supported. Note that /v1/embeddings batches are also restricted to a maximum of
50,000 embedding inputs across all requests in the batch.

input_file_id string

Required The ID of an uploaded file that contains requests for the new batch.

See upload file for how to upload a file.

Your input file must be formatted as a JSONL file, and must be uploaded with the
purpose batch. The file can contain up to 50,000 requests, and can be up to 200
MB in size.

metadata map

Optional Set of 16 key-value pairs that can be attached to an object. This can
be useful for storing additional information about the object in a structured
format, and querying for objects via API or the dashboard.

Keys are strings with a maximum length of 64 characters. Values are strings with
a maximum length of 512 characters.

Returns The created Batch object.

Example request curl https://api.openai.com/v1/batches\
-H "Authorization: Bearer $OPENAI_API_KEY"\
-H "Content-Type: application/json"\
-d '{ "input_file_id": "file-abc123", "endpoint": "/v1/chat/completions",
"completion_window": "24h" }' Response { "id": "batch_abc123", "object":
"batch", "endpoint": "/v1/chat/completions", "errors": null, "input_file_id":
"file-abc123", "completion_window": "24h", "status": "validating",
"output_file_id": null, "error_file_id": null, "created_at": 1711471533,
"in_progress_at": null, "expires_at": null, "finalizing_at": null,
"completed_at": null, "failed_at": null, "expired_at": null, "cancelling_at":
null, "cancelled_at": null, "request_counts": { "total": 0, "completed": 0,
"failed": 0 }, "metadata": { "customer_id": "user_123456789",
"batch_description": "Nightly eval job", } } Retrieve batch get

https://api.openai.com/v1/batches/{batch_id} Retrieves a batch.

Path parameters batch_id string

Required The ID of the batch to retrieve.

Returns The Batch object matching the specified ID.

Example request curl https://api.openai.com/v1/batches/batch_abc123\
-H "Authorization: Bearer $OPENAI_API_KEY"\
-H "Content-Type: application/json"\
Response { "id": "batch_abc123", "object": "batch", "endpoint":
"/v1/completions", "errors": null, "input_file_id": "file-abc123",
"completion_window": "24h", "status": "completed", "output_file_id":
"file-cvaTdG", "error_file_id": "file-HOWS94", "created_at": 1711471533,
"in_progress_at": 1711471538, "expires_at": 1711557933, "finalizing_at":
1711493133, "completed_at": 1711493163, "failed_at": null, "expired_at": null,
"cancelling_at": null, "cancelled_at": null, "request_counts": { "total": 100,
"completed": 95, "failed": 5 }, "metadata": { "customer_id": "user_123456789",
"batch_description": "Nightly eval job", } } Cancel batch post

https://api.openai.com/v1/batches/{batch_id}/cancel Cancels an in-progress
batch. The batch will be in status cancelling for up to 10 minutes, before
changing to cancelled, where it will have partial results (if any) available in
the output file.

Path parameters batch_id string

Required The ID of the batch to cancel.

Returns The Batch object matching the specified ID.

Example request curl https://api.openai.com/v1/batches/batch_abc123/cancel\
-H "Authorization: Bearer $OPENAI_API_KEY"\
-H "Content-Type: application/json"\
-X POST Response { "id": "batch_abc123", "object": "batch", "endpoint":
"/v1/chat/completions", "errors": null, "input_file_id": "file-abc123",
"completion_window": "24h", "status": "cancelling", "output_file_id": null,
"error_file_id": null, "created_at": 1711471533, "in_progress_at": 1711471538,
"expires_at": 1711557933, "finalizing_at": null, "completed_at": null,
"failed_at": null, "expired_at": null, "cancelling_at": 1711475133,
"cancelled_at": null, "request_counts": { "total": 100, "completed": 23,
"failed": 1 }, "metadata": { "customer_id": "user_123456789",
"batch_description": "Nightly eval job", } } List batch get

https://api.openai.com/v1/batches List your organization's batches.

Query parameters after string

Optional A cursor for use in pagination. after is an object ID that defines your
place in the list. For instance, if you make a list request and receive 100
objects, ending with obj_foo, your subsequent call can include after=obj_foo in
order to fetch the next page of the list.

limit integer

Optional Defaults to 20 A limit on the number of objects to be returned. Limit
can range between 1 and 100, and the default is 20.

Returns A list of paginated Batch objects.

Example request curl https://api.openai.com/v1/batches?limit=2\
-H "Authorization: Bearer $OPENAI_API_KEY"\
-H "Content-Type: application/json" Response { "object": "list", "data": [ {
"id": "batch_abc123", "object": "batch", "endpoint": "/v1/chat/completions",
"errors": null, "input_file_id": "file-abc123", "completion_window": "24h",
"status": "completed", "output_file_id": "file-cvaTdG", "error_file_id":
"file-HOWS94", "created_at": 1711471533, "in_progress_at": 1711471538,
"expires_at": 1711557933, "finalizing_at": 1711493133, "completed_at":
1711493163, "failed_at": null, "expired_at": null, "cancelling_at": null,
"cancelled_at": null, "request_counts": { "total": 100, "completed": 95,
"failed": 5 }, "metadata": { "customer_id": "user_123456789",
"batch_description": "Nightly job", } }, { ... }, ], "first_id": "batch_abc123",
"last_id": "batch_abc456", "has_more": true } The batch object cancelled_at
integer

The Unix timestamp (in seconds) for when the batch was cancelled.

cancelling_at integer

The Unix timestamp (in seconds) for when the batch started cancelling.

completed_at integer

The Unix timestamp (in seconds) for when the batch was completed.

completion_window string

The time frame within which the batch should be processed.

created_at integer

The Unix timestamp (in seconds) for when the batch was created.

endpoint string

The OpenAI API endpoint used by the batch.

error_file_id string

The ID of the file containing the outputs of requests with errors.

errors object

Show properties expired_at integer

The Unix timestamp (in seconds) for when the batch expired.

expires_at integer

The Unix timestamp (in seconds) for when the batch will expire.

failed_at integer

The Unix timestamp (in seconds) for when the batch failed.

finalizing_at integer

The Unix timestamp (in seconds) for when the batch started finalizing.

id string

in_progress_at integer

The Unix timestamp (in seconds) for when the batch started processing.

input_file_id string

The ID of the input file for the batch.

metadata map

Set of 16 key-value pairs that can be attached to an object. This can be useful
for storing additional information about the object in a structured format, and
querying for objects via API or the dashboard.

Keys are strings with a maximum length of 64 characters. Values are strings with
a maximum length of 512 characters.

object string

The object type, which is always batch.

output_file_id string

The ID of the file containing the outputs of successfully executed requests.

request_counts object

The request counts for different statuses within the batch.

Show properties status string

The current status of the batch.

OBJECT The batch object { "id": "batch_abc123", "object": "batch", "endpoint":
"/v1/completions", "errors": null, "input_file_id": "file-abc123",
"completion_window": "24h", "status": "completed", "output_file_id":
"file-cvaTdG", "error_file_id": "file-HOWS94", "created_at": 1711471533,
"in_progress_at": 1711471538, "expires_at": 1711557933, "finalizing_at":
1711493133, "completed_at": 1711493163, "failed_at": null, "expired_at": null,
"cancelling_at": null, "cancelled_at": null, "request_counts": { "total": 100,
"completed": 95, "failed": 5 }, "metadata": { "customer_id": "user_123456789",
"batch_description": "Nightly eval job", } } The request input object The
per-line object of the batch input file

custom_id string

A developer-provided per-request id that will be used to match outputs to
inputs. Must be unique for each request in a batch.

method string

The HTTP method to be used for the request. Currently only POST is supported.

url string

The OpenAI API relative URL to be used for the request. Currently
/v1/chat/completions, /v1/embeddings, and /v1/completions are supported.

OBJECT The request input object {"custom_id": "request-1", "method": "POST",
"url": "/v1/chat/completions", "body": {"model": "gpt-4o-mini", "messages":
[{"role": "system", "content": "You are a helpful assistant."}, {"role": "user",
"content": "What is 2+2?"}]}} The request output object The per-line object of
the batch output and error files

custom_id string

A developer-provided per-request id that will be used to match outputs to
inputs.

error object or null

For requests that failed with a non-HTTP error, this will contain more
information on the cause of the failure.

Show properties id string

response object or null

Show properties OBJECT The request output object {"id": "batch_req_wnaDys",
"custom_id": "request-2", "response": {"status_code": 200, "request_id":
"req_c187b3", "body": {"id": "chatcmpl-9758Iw", "object": "chat.completion",
"created": 1711475054, "model": "gpt-4o-mini", "choices": [{"index": 0,
"message": {"role": "assistant", "content": "2 + 2 equals 4."}, "finish_reason":
"stop"}], "usage": {"prompt_tokens": 24, "completion_tokens": 15,
"total_tokens": 39}, "system_fingerprint": null}}, "error": null}
