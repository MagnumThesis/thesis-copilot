# Database Schema

This document describes the database schema for the Thesis Copilot application.

## `references`

The `references` table stores information about the references that have been added to the application.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `conversation_id` | `uuid` | A foreign key that references the `id` column in the `conversations` table. |
| `type` | `text` | The type of reference (e.g., "book", "article", "website"). |
| `title` | `text` | The title of the reference. |
| `authors` | `jsonb` | A JSON array of the authors of the reference. |
| `publication_date` | `date` | The publication date of the reference. |
| `url` | `text` | The URL of the reference. |
| `doi` | `text` | The DOI of the reference. |
| `journal` | `text` | The name of the journal that the reference was published in. |
| `volume` | `text` | The volume number of the journal that the reference was published in. |
| `issue` | `text` | The issue number of the journal that the reference was published in. |
| `pages` | `text` | The page numbers of the reference. |
| `publisher` | `text` | The name of the publisher of the reference. |
| `isbn` | `text` | The ISBN of the reference. |
| `created_at` | `timestamp` | The date and time that the reference was created. |
| `updated_at` | `timestamp` | The date and time that the reference was last updated. |

### Relationships

*   The `references` table has a many-to-one relationship with the `conversations` table.

## `citation_instances`

The `citation_instances` table stores information about the citations that have been created for the references.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `reference_id` | `uuid` | A foreign key that references the `id` column in the `references` table. |
| `conversation_id` | `uuid` | A foreign key that references the `id` column in the `conversations` table. |
| `style` | `text` | The citation style (e.g., "apa", "mla", "chicago"). |
| `html` | `text` | The HTML representation of the citation. |
| `created_at` | `timestamp` | The date and time that the citation was created. |
| `updated_at` | `timestamp` | The date and time that the citation was last updated. |

### Relationships

*   The `citation_instances` table has a many-to-one relationship with the `references` table.
*   The `citation_instances` table has a many-to-one relationship with the `conversations` table.

## `privacy_settings`

The `privacy_settings` table stores the privacy settings for each user.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `user_id` | `uuid` | A foreign key that references the `id` column in the `users` table. |
| `data_retention_period` | `integer` | The number of days that the user's data should be retained. |
| `allow_data_sharing` | `boolean` | Whether or not the user has allowed their data to be shared with third parties. |
| `created_at` | `timestamp` | The date and time that the privacy settings were created. |
| `updated_at` | `timestamp` | The date and time that the privacy settings were last updated. |

### Relationships

*   The `privacy_settings` table has a one-to-one relationship with the `users` table.

## `search_sessions`

The `search_sessions` table stores information about the search sessions that have been conducted by users.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `user_id` | `uuid` | A foreign key that references the `id` column in the `users` table. |
| `query` | `text` | The search query that was entered by the user. |
| `results` | `jsonb` | A JSON array of the search results. |
| `created_at` | `timestamp` | The date and time that the search session was created. |
| `updated_at` | `timestamp` | The date and time that the search session was last updated. |

### Relationships

*   The `search_sessions` table has a many-to-one relationship with the `users` table.

## `search_results`

The `search_results` table stores information about the search results that have been returned to users.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `search_session_id` | `uuid` | A foreign key that references the `id` column in the `search_sessions` table. |
| `title` | `text` | The title of the search result. |
| `url` | `text` | The URL of the search result. |
| `snippet` | `text` | A snippet of the search result. |
| `created_at` | `timestamp` | The date and time that the search result was created. |
| `updated_at` | `timestamp` | The date and time that the search result was last updated. |

### Relationships

*   The `search_results` table has a many-to-one relationship with the `search_sessions` table.

## `search_feedback`

The `search_feedback` table stores feedback that users have provided about the search results.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `search_result_id` | `uuid` | A foreign key that references the `id` column in the `search_results` table. |
| `rating` | `integer` | The rating that the user gave to the search result. |
| `comment` | `text` | The comment that the user provided about the search result. |
| `created_at` | `timestamp` | The date and time that the feedback was created. |
| `updated_at` | `timestamp` | The date and time that the feedback was last updated. |

### Relationships

*   The `search_feedback` table has a many-to-one relationship with the `search_results` table.

## `search_analytics`

The `search_analytics` table stores analytics data about the search sessions that have been conducted by users.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `search_session_id` | `uuid` | A foreign key that references the `id` column in the `search_sessions` table. |
| `clicks` | `integer` | The number of clicks that the user made on the search results. |
| `time_to_first_click` | `integer` | The time in milliseconds that it took for the user to make their first click. |
| `created_at` | `timestamp` | The date and time that the analytics data was created. |
| `updated_at` | `timestamp` | The date and time that the analytics data was last updated. |

### Relationships

*   The `search_analytics` table has a one-to-one relationship with the `search_sessions` table.

## `user_feedback_learning`

The `user_feedback_learning` table stores information about the feedback that users have provided about the search results. This information is used to train the machine learning model that is used to rank the search results.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `search_result_id` | `uuid` | A foreign key that references the `id` column in the `search_results` table. |
| `is_relevant` | `boolean` | Whether or not the search result was relevant to the user's query. |
| `created_at` | `timestamp` | The date and time that the feedback was created. |
| `updated_at` | `timestamp` | The date and time that the feedback was last updated. |

### Relationships

*   The `user_feedback_learning` table has a many-to-one relationship with the `search_results` table.

## `user_preference_patterns`

The `user_preference_patterns` table stores information about the preferences that users have for the search results. This information is used to personalize the search results for each user.

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `user_id` | `uuid` | A foreign key that references the `id` column in the `users` table. |
| `topic` | `text` | The topic that the user is interested in. |
| `preference` | `float` | The user's preference for the topic. |
| `created_at` | `timestamp` | The date and time that the preference was created. |
| `updated_at` | `timestamp` | The date and time that the preference was last updated. |

### Relationships

*   The `user_preference_patterns` table has a many-to-one relationship with the `users` table.

## Proposed Schema Changes

### `references` table

The `authors` field in the `references` table is currently stored as a JSONB field. This has a few disadvantages:

*   **Querying:** It is difficult to query for references by a specific author.
*   **Data integrity:** It is difficult to enforce data integrity. For example, the same author could be spelled differently in different references.
*   **Data redundancy:** The same author can be listed in multiple references, which leads to data redundancy.

To address these issues, we propose the following schema changes:

1.  Create a new `authors` table to store information about authors.
2.  Create a new `reference_authors` table to link references to authors.
3.  Remove the `authors` field from the `references` table.

### `authors` table

| Column | Data Type | Description |
| --- | --- | --- |
| `id` | `uuid` | The primary key for the table. |
| `name` | `text` | The name of the author. |
| `created_at` | `timestamp` | The date and time that the author was created. |
| `updated_at` | `timestamp` | The date and time that the author was last updated. |

### `reference_authors` table

| Column | Data Type | Description |
| --- | --- | --- |
| `reference_id` | `uuid` | A foreign key that references the `id` column in the `references` table. |
| `author_id` | `uuid` | A foreign key that references the `id` column in the `authors` table. |
| `created_at` | `timestamp` | The date and time that the record was created. |

### Relationships

*   The `reference_authors` table has a many-to-one relationship with the `references` table.
*   The `reference_authors` table has a many-to-one relationship with the `authors` table.
