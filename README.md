# Email Middleware Service

A lambda function that allows us to perform at email time recommendations for our user base.

Requests come in from a email, within the url is the users id, this id is used to find the recommended products from our recommendation systems.

Once we have the recommended products we find the snapshotted offer html that is stored as an image within S3, we then serve this image to the user.

## Dealing With Multiple Requests at Once 

Within each email there is multiple recommendations made. To ensure that we do not overload the recommendations engine with multiple calls we add random latency to each incomeing request.
This gives the recommendations engine enought time to answer the first call, which is then saved in the cache. All remaining recommendations are then served but the recommenations made in the first 
request to the recommendations engine.


### Prerequisites

To get up and running

```
$ yarn install
```

Then

```
$ yarn run dev
```

## Running the tests

```
$ yarn run test
```

## Deployment

This repo is deployed using Apex up
