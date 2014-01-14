# express-play

Express based MVC Framework for Node.js

**This project is under construction. Don't use it yet.**

## File Structure Based

The default file structure and the entry file of an express-play application:
```
/app
  /controllers    - controllers root directory
    /contents     - controllers sub directory
      posts.js    - posts controller (/contents/posts/... auto-loaded)
    accounts.js   - account controller (/accounts/... auto-loaded)
    home.js       - home controller (/home/... auto-loaded)
  /lib            - modules root directory
    repository.js - repository module (auto-loaded and auto-injected)
server.js
```

```javascript
// server.js
require('express-play')().play(3000);
```

## The HTTP Request Handler Routing

The framework maps resource handler routings automatically using the object graph, function names and 'id' parameter that is special in express-play.
```javascript
// /app/controllers/contents/posts.js
function PostsController() {
  var self = this;

  // GET /contents/posts
  // GET /contents/posts/:id
  self.get = function (id) {
  };

  // POST /contents/posts
  self.post = function () {
  };

  self.comments = {
    // GET /contents/posts/comments
    // GET /contents/posts/comments/:id
    get: function (id) {
    },
    // POST /contents/posts/comments
    post: function () {
    }
  };

  // GET /contents/posts/top
  self.top = function () {
  };
}

module.exports = PostsController;
```

## Query as Parameters

Query values are injected to the handler function as parameters automatically.
```javascript
// /app/controllers/contents/posts.js
function PostsController() {
  var self = this;

  // GET /contents/posts/top?count=[count]
  self.top = function (count) {
    count = count || 10;
  };
}

module.exports = PostsController;
```

## License

The MIT License (MIT)

Copyright (c) 2014 Yi Gyuwon <gyuwon@live.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
