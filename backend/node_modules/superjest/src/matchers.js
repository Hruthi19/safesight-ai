"use strict";

const charset = require("charset");
const { assertThat, equalTo } = require("hamjest");

/**
 * ## Matchers
 *
 * For examples of the Matchers in action, see the tests.
 */

/**
 * ### hasStatusCode
 *
 * Assert that the response has the correct status code.
 *
 * ```js
 * assertThat(resp, hasStatusCode(200));
 * ```
 *
 * @param {number} code
 * @returns {Matcher}
 */
exports.hasStatusCode = function(code) {
	return {
		matches: (resp) => {
			return code === resp.statusCode;
		},
		describeTo: (description) => {
			description.append("A response that has status code ");
			description.appendValue(code);
		},
		describeMismatch: (resp, description) => {
			description.append("A response with status code ");
			description.appendValue(resp.statusCode);
		}
	};
};

/**
 * ### hasHeader
 *
 * Assert that the response has a header, and that header matches expectations.
 *
 * ```js
 * assertThat(resp, hasHeader('etag'));
 * assertThat(resp, hasHeader('content-type', equalTo('text/plain')));
 * ```
 *
 * @param {string} name The header name
 * @param {Matcher} [matcher] Optional matcher for the header value
 * @returns {Matcher}
 */
exports.hasHeader = function(name, matcher) {
	let header;

	return {
		matches: (resp) => {
			if (resp.headers) {
				header = resp.headers[name];
			}

			return header !== undefined &&
					(matcher ? matcher.matches(header) : true);
		},
		describeTo: (description) => {
			description.append("A response that has header ");
			description.appendValue(name);

			if (matcher) {
				description.append(" with value ");
				matcher.describeTo(description);
			}
		},
		describeMismatch: (resp, description) => {
			description.append("But got ");
			description.appendValue(header);
		}
	};
};

/**
 * ### hasBody
 *
 * Assert that the response has the correct body. Relies on a `body` property being present
 * on the response object.
 *
 * ```js
 * assertThat(resp, hasBody(equalTo("Hello World")));
 * ```
 *
 * @param {Matcher} matcher
 * @returns {Matcher}
 */
exports.hasBody = function(matcher) {
	return {
		matches: (resp) => {
			return matcher.matches(resp.body);
		},
		describeTo: (description) => {
			description.append(`A response with body `);
			matcher.describeTo(description);
		},
		describeMismatch: (resp, description) => {
			description.append("A response with body ");
			description.appendValue(resp.body);
		}
	};
}

/**
 * ### hasContentType
 *
 * Assert that the response has the correct content type header.
 *
 * Ignores field parameters
 *
 * ```js
 * assertThat(resp, hasContentType(equalTo(json())));
 * assertThat(resp, hasContentType(equalTo("text/xml")));
 * ```
 *
 * @param {Matcher} matcher
 * @returns {Matcher}
 */
exports.hasContentType = function(matcher) {
	const parameterIgnoringMatcher = {
		matches: (contentType) => {
			// shave off any parameters
			contentType = contentType.replace(/;.*$/, "");

			return matcher.matches(contentType);
		},
		describeTo: (description) => {
			matcher.describeTo(description);
		},
		describeMismatch: (resp, description) => {
			matcher.describeMismatch(resp, description);
		}
	};

	return simpleHeaderMatcherFactory("content-type", parameterIgnoringMatcher);
};

/**
 * ### hasCharset
 *
 * Assert that the response has the correct charset.
 *
 * The charset must be specified with a '-'
 *
 * ```js
 * assertThat(resp, hasCharset(equalTo("utf-8")));
 * ```
 *
 * @param {Matcher} matcher
 * @returns {Matcher}
 */
exports.hasCharset = function(matcher) {
	let cs;

	return {
		matches: (resp) => {
			cs = charset(resp.headers);

			/*
			 * Fix charset() treating "utf8" as a special case
			 * See https://github.com/node-modules/charset/issues/12
			 */
			if (cs === "utf8") {
				cs = "utf-8";
			}

			return matcher.matches(cs);
		},
		describeTo: (description) => {
			description.append(`A response with charset `);
			matcher.describeTo(description);
		},
		describeMismatch: (resp, description) => {
			description.append("But got ");
			description.appendValue(cs);
		}
	};
};

/**
 * ### hasContentLength
 *
 * Assert that the response has the correct content length header.
 *
 * ```js
 * assertThat(resp, hasContentLength(equalTo(12)));
 * ```
 *
 * @param {Matcher} matcher
 * @returns {Matcher}
 */
exports.hasContentLength = function(matcher) {
	return simpleHeaderMatcherFactory("content-length", matcher);
};

/**
 * ### hasLocation
 *
 * Assert that the response has the correct location header.
 *
 * ```js
 * assertThat(resp, hasLocation(equalTo("http://www.google.com")));
 * ```
 *
 * @param {Matcher} matcher
 * @returns {Matcher}
 */
exports.hasLocation = function(matcher) {
	return simpleHeaderMatcherFactory("location", matcher);
};

/**
 * ### isRedirectedTo
 *
 * Convenience to assertion redirection
 *
 * ```js
 * assertThat(resp, isRedirectedTo("http://www.google.com"));
 * ```
 *
 * @param {string} location
 * @returns {Matcher}
 */
exports.isRedirectedTo = function(location) {
	return {
		matches: (resp) => {
			assertThat(resp, exports.hasStatusCode(302));
			assertThat(resp, exports.hasLocation(equalTo(location)));

			return true;
		},
		describeTo: (description) => {
			description.append("A response that was redirected");
		},
		describeMismatch: (resp, description) => {
			description.append("But got one that wasn't");
		}
	};
};

/**
 * ### html
 *
 * Convenience to return 'text/html' MIME type
 *
 * @returns {string}
 */
exports.html = function() {
	return "text/html";
};

/**
 * ### json
 *
 * Convenience to return 'application/json' MIME type
 *
 * @returns {string}
 */
exports.json = function() {
	return "application/json";
};

/**
 * ### text
 *
 * Convenience to return 'text/plain' MIME type
 *
 * @returns {string}
 */
exports.text = function() {
	return "text/plain";
};

/**
 * @return {Matcher}
 * @api private
 */
function simpleHeaderMatcherFactory(name, matcher) {
	let headerValue;
	let friendlyName;

	return {
		matches: (resp) => {
			assertThat(resp, exports.hasHeader(name));

			headerValue = resp.headers[name];
			friendlyName = name.replace("-", " ");

			return matcher.matches(headerValue);
		},
		describeTo: (description) => {
			description.append(`A response with ${friendlyName} `);
			matcher.describeTo(description);
		},
		describeMismatch: (resp, description) => {
			description.append("But got ");
			description.appendValue(headerValue);
		}
	}
}
