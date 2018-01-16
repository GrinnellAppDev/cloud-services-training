# AppDev Cloud Services Training: Day 5

Our API seems fine now, but it has some issues that leave it incomplete.
First of all, if we try to delete or patch a task that doesn't exist, we get
an unhelpful server error. Instead, we should be giving a more useful error
to explain what the client did wrong.

Secondly, as our list of tasks grows, we will find ourselves sending a larger
and larger amount of data for a single request. The user can only see the ten
or so tasks on their screen at a time. This can be slow and expensive for a
user on a limited data connection. Instead, we should load tasks in chunks,
and only send down the next page of tasks when it is needed.

## Readings

* [Efficient paging with MongoDB](https://scalegrid.io/blog/fast-paging-with-mongodb/)
  * This one is pretty straightforward and definitely worth a read.
* [How GitHub does pagination](https://developer.github.com/v3/guides/traversing-with-pagination/)
  * We will be using some of the same link headers to point to the next page.
* [Wikipedia on Base64 encoding](https://en.wikipedia.org/wiki/Base64)
  * This article gets pretty technical and sort of over complicates this topic,
    but it is very thorough. Don't worry if it doesn't make much sense.

## Table of Contents

* [Day 1][day1]

[day1]: https://github.com/GrinnellAppDev/cloud-services-training/TODO_ADD_DAY_ONE
