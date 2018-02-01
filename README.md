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

We are half way to having an api with Create, Read, Update, and Delete (CRUD)
functionality. We have the CR. The `POST` method allows us to _create_ new
tasks and the `GET` HTTP method allows us to _read_ a list of tasks. Now we
have to add in the UD. The `PATCH` HTTP method will allow us to _update_ our
tasks and the `DELETE` method lets us spawn swarms of bees. jk. `DELETE` is
for _deleting_. Along the way to implementing these, we will notice duplicate
code and learn strategies to avoid repeating ourselves.

## Readings

* [Efficient paging with MongoDB](https://scalegrid.io/blog/fast-paging-with-mongodb/)
  * This one is pretty straightforward and definitely worth a read.
* [How GitHub does pagination](https://developer.github.com/v3/guides/traversing-with-pagination/)
  * We will be using some of the same link headers to point to the next page.
* [Wikipedia on Base64 encoding](https://en.wikipedia.org/wiki/Base64)
  * This article gets pretty technical and sort of over complicates this topic,
    but it is very thorough. Don't worry if it doesn't make much sense.

## Table of Contents

* [**Introduction**][intro]
* [Day 1][day1]
* [Day 2][day2]
* [Day 3][day3]
* [Day 4][day4]
* [Day 5][day5]
* [Day 6][day6]
* [Day 7][day7]
* [Day 8][day8]
* [Day 9][day9]
* [Day 10][day10]

[intro]: https://github.com/GrinnellAppDev/cloud-services-training
[day1]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-01
[day2]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-02
[day3]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-03
[day4]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-04
[day5]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-05
[day6]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-06
[day7]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-07
[day8]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-08
[day9]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-09
[day10]: https://github.com/GrinnellAppDev/cloud-services-training/tree/day-10
