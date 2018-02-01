# AppDev Cloud Services Training: Day 4

We are half way to having an api with Create, Read, Update, and Delete (CRUD)
functionality. We have the CR. The `POST` method allows us to _create_ new
tasks and the `GET` HTTP method allows us to _read_ a list of tasks. Now we
have to add in the UD. The `PATCH` HTTP method will allow us to _update_ our
tasks and the `DELETE` method lets us spawn swarms of bees. jk. `DELETE` is
for _deleting_. Along the way to implementing these, we will notice duplicate
code and learn strategies to avoid repeating ourselves.

## Readings

* [Higher order functions](https://eloquentjavascript.net/05_higher_order.html)
  * Hey there CSC-151 survivors! Looks familiar?
* [Error handling in Express](http://expressjs.com/en/guide/error-handling.html)
  * We haven't talked a lot about how middleware works in express, so just try
    and get familiar with the examples.
* [HTTP PATCH method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH)
* [HTTP DELETE method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE)

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
