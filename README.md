# AppDev Cloud Services Training: Final Project 2018 Spring

**Due:** June 4th (Contact Yash if you need an extension)

## Submitting

You will submit this project with GitHub.

1.  [Fork this repository.](https://help.github.com/articles/fork-a-repo/)
2.  [Clone the fork you just made.](https://help.github.com/articles/cloning-a-repository/)
3.  Switch to the `final-project-2018-spring` branch.
    * _If you are using Visual Studio Code:_ Click the button at the far left of
      the bottom bar and pick the branch from the dropdown.
    * _If you are using the terminal:_ Make sure you are in the directory that
      you just cloned. Then, run `git checkout final-project-2018-spring`.
4.  Split off a new branch. You might name it `my-final-project` or something.
    * _If you are using Visual Studio Code:_ Click the branch button again, but
      this time, select `+ Create new branch`. Then type in the new branch name.
    * _If you are using the terminal:_ Run `git checkout -b my-final-project` to
      create the new branch and switch to it in one go.
5.  Make your changes and commit them.
    * _If you are using Visual Studio Code:_ Switch to git panel on the left
      sidebar. Write a commit message in the textbox describing your changes.
      Then click the check mark button on the top bar.
    * _If you are using the terminal:_ Run `git commit --all --message="Describe your changes here"`
      to commit all your changes with the given message. If that is too wordy
      for you, you can run `git commit -am "And describe your changes here"`
      which is a shortcut for the above.
6.  Push your changes.
    * _If you are using Visual Studio Code:_ Click the button with up/down
      arrows right next to the branch button.
    * _If you are using the terminal:_ Run `git push origin my-final-project` to
      send your changes to the repository your cloned from (called `origin`
      here), and to the branch `my-final-project`.
7.  [Create a pull request.](https://help.github.com/articles/creating-a-pull-request/)

You may repeat steps 5 and 6 multiple times if you find that you have
multiple sets of changes. For example, you might write the documentation,
commit and push it, then write your code and commit and push that.

## The Assignment

You will be writing documentation for and implementing a new request handler.
You should start with the documentation, because the documentation page
allows you to test your code.

Your new handler should be able to accept get requests in the form:
`GET /tasks/123` where `123` is the ID of a particular task. This handler
should behave similarly to the one we wrote for `GET /tasks`, except instead
of returning a list of tasks, you should just return the task with the ID
that they gave you.

Don't forget to validate the request to make sure they send a valid object ID
and such. Also, if the task they asked for does not exist, be sure to send a
`404` status with an appropriate message.

## Examples

Note that the error messages don't have the be exactly the same as mine, they
should just get the point across of what went wrong.

### 1. The task exists

**Request**

_Method_: GET

_Path_: /tasks/123

**Response**

_Status_: 200

_Body_:

```
{
  "_id": "123",
  "text": "My task",
  "isComplete": false
}
```

### 2. Invalid request

**Request**

_Method_: GET

_Path_: /tasks/this_is_not_a_valid_id

**Response**

_Status_: 400

_Body_:

```
{
  "message": "Invalid request: Path Params.taskId does not match the format 'objectId'"
}
```

### 3. Task does not exist

**Request**

_Method_: GET

_Path_: /tasks/456

**Response**

_Status_: 404

_Body_:

```
{
  "message": "No task with id '456'"
}
```

## Table of Contents

* [Introduction][intro]
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
