# superjest

> A set of Hamjest matchers for user with superagent

## Usage

`superagent` and `hamjest` are peer dependencies, so users of `superjest` need to install those modules too.

```bash
$ npm install superagent hamjest superjest
```

### Using with superagent

Perform the assertions at the end of the request, however you like to user superagent.

```javascript
it("requests google homepage", function(done) {
  superagent
   .get("https://www.google.com")
   .end((err, resp) => {
     assertThat(resp, hasStatusCode(200));
 
     done();
   });
 });
```

## Matchers

For examples of the Matchers in action, see the tests.

### hasStatusCode

* **@param** _{number}_ code 

Assert that the response has the correct status code.

```js
assertThat(resp, hasStatusCode(200));
```

### hasHeader

* **@param** _{string}_ name The header name
* **@param** _{Matcher}_ [matcher] Optional matcher for the header value

Assert that the response has a header, and that header matches expectations.

```js
assertThat(resp, hasHeader('etag'));
assertThat(resp, hasHeader('content-type', equalTo('text/plain')));
```

### hasBody

* **@param** _{Matcher}_ matcher 

Assert that the response has the correct body. Relies on a `body` property being present
on the response object.

```js
assertThat(resp, hasBody(equalTo("Hello World")));
```

### hasContentType

* **@param** _{Matcher}_ matcher 

Assert that the response has the correct content type header.

Ignores field parameters

```js
assertThat(resp, hasContentType(equalTo(json())));
assertThat(resp, hasContentType(equalTo("text/xml")));
```

### hasCharset

* **@param** _{Matcher}_ matcher 

Assert that the response has the correct charset.

The charset must be specified with a '-'

```js
assertThat(resp, hasCharset(equalTo("utf-8")));
```

### hasContentLength

* **@param** _{Matcher}_ matcher 

Assert that the response has the correct content length header.

```js
assertThat(resp, hasContentLength(equalTo(12)));
```

### hasLocation

* **@param** _{Matcher}_ matcher 

Assert that the response has the correct location header.

```js
assertThat(resp, hasLocation(equalTo("http://www.google.com")));
```

### isRedirectedTo

* **@param** _{string}_ location 

Convenience to assertion redirection

```js
assertThat(resp, isRedirectedTo("http://www.google.com"));
```

### html


Convenience to return 'text/html' MIME type

### json


Convenience to return 'application/json' MIME type

### text


Convenience to return 'text/plain' MIME type

## Thanks

This library was inspired by [chai-http](https://github.com/chaijs/chai-http). I just prefer to use [hamjest](https://github.com/rluba/hamjest)

## License

MIT 
