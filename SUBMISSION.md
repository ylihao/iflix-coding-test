# iflix Coding Assignment

In this document I will briefly describe how I approached the question to eventually came up with the solution.


## Introduction

As this is my first time writing a Node.js application, and also my first time writing unit tests, I had to take some time reading up tutorials and trying out some simple applications before I can begin to code. The syntax looks familiar since it's basically Javascript, understanding the modules is what I find really interesting in the learning process.


## Understanding the Requirements

The assignment requires the program to process 3 JSON files. `accounts.json`  consists of a list of users, `amazecom.json` and `wondertel.json` contain subscription information (called *offer*) from two partners. The program will eventually find out number of free iflix each user gets to enjoy (in days).


## Development

The first step was to install Node on my Mac. It turns out that I have already had Node installed from one of my previous Javascript meet-ups. With some help from some tutorial I was able to read the JSON files and parse the data into Javascript objects. I then moved on to consuming the object data and working out the logic of the subscription.


## Testing

Most tutorials recommend **Mocha** as the testing framework and **Chai** as the assertion library so I'm using them in this assignment. I soon realized the way I coded the program made it really difficult to unit test. I restructured my code, moved a few core features into functions, and then I began writing test cases.

Getting the unit tests to work took quite a bit of effort but it feels great when I was able to execute them successfully.

I understand that in an ideal Test-driven Development environment you would write a test before you even start to code. I will remind myself about that and hopefully be able to apply that to my development work going forward.


## Challenges

I faced some issue getting the file paths right, as running the program using `bin/run` from the root directory or `run` from the `bin` directory may not work if the file paths are not correctly defined. Relying on relative file paths just doesn't work.

Unfortunately I was unable to figure out how to implement integration and system tests in this assignment. I will continue to study more on these topics.


## Running the Program

Simply execute the program by typing `bin/run` from the project root directory, or `run` from the `bin` directory. To run a test, simply type `bin/test` from the project root, or `test` from the `bin` directory. Running `test` will first install Mocha and Chai as dependencies, and then continue to execute the tests.