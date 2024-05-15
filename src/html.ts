const header = `
<link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="/">URL Shortener</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ml-auto">
        <li class="nav-item">
          <a class="nav-link" href="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/list">List URLs</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="https://github.com/archie9211/UrlShortner" target="_blank">GitHub</a>
        </li>
      </ul>
    </div>
  </nav>
`;

const footer = `
<footer class="bg-light text-center py-3 mt-auto">
  <div class="container">
    <p>&copy; 2023 URL Shortener. All rights reserved.</p>
  </div>
</footer>
<script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
`;

const rootHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URL Shortener</title>
  <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="d-flex flex-column min-vh-100">
  ${header}
  <main class="container my-4">
    <h1 class="text-center">URL Shortener</h1>
    <form id="form" class="mx-auto" style="max-width: 400px;">
      <div class="form-group">
        <label for="url">Paste the URL to be shortened:</label>
        <input type="text" id="url" name="url" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Shorten</button>
    </form>
    <div class="text-center mt-3">
      <p id="shortened-url" class="d-inline"></p>
      <button id="copy-button" class="btn btn-secondary btn-sm d-none" onclick="copyToClipboard()">Copy</button>
    </div>
    <p id="error-message" class="text-center text-danger mt-3"></p>
  </main>
  ${footer}
  <script>
    document.getElementById('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const url = document.getElementById('url').value;
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const shortUrl = await response.text();
        document.getElementById('shortened-url').textContent = 'Shortened URL: ' + shortUrl;
        document.getElementById('error-message').textContent = '';
        document.getElementById('copy-button').classList.remove('d-none');
        document.getElementById('copy-button').setAttribute('data-url', shortUrl);
      } else {
        const errorMessage = await response.text();
        document.getElementById('shortened-url').textContent = '';
        document.getElementById('error-message').textContent = errorMessage;
        document.getElementById('copy-button').classList.add('d-none');
      }
    });

    function copyToClipboard() {
      const shortUrl = document.getElementById('copy-button').getAttribute('data-url');
      navigator.clipboard.writeText(shortUrl).then(() => {
        const copyButton = document.getElementById('copy-button');
        copyButton.textContent = 'Copied';
        copyButton.classList.remove('btn-secondary');
        copyButton.classList.add('btn-success');
        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.classList.remove('btn-success');
          copyButton.classList.add('btn-secondary');
        }, 2000);
      }).catch(err => {
        document.getElementById('error-message').textContent = 'Failed to copy URL';
      });
    }
  </script>
</body>
</html>
`;



const listHtml = (urlList) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URL Shortener - List URLs</title>
  <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="d-flex flex-column min-vh-100">
  ${header}
  <main class="container my-4">
    <h1 class="text-center">URL Shortener - List URLs</h1>
    <ul class="list-group">
      ${urlList}
    </ul>
    <script>
      async function deleteUrl(slug) {
        const storedUsername = localStorage.getItem('username');
        const storedPassword = localStorage.getItem('password');
        const headers = new Headers();
        if (storedUsername && storedPassword) {
          headers.append('X-Username', storedUsername);
          headers.append('X-Password', storedPassword);
        } else {
          const username = prompt('Enter your username:');
          const password = prompt('Enter your password:');
          localStorage.setItem('username', username);
          localStorage.setItem('password', password);
          headers.append('Content-Type', 'application/json');
          headers.append('X-Username', username);
          headers.append('X-Password', password);
        }

        const response = await fetch('/delete/' + slug, { method: 'DELETE', headers: headers });
        if (response.ok) {
          window.location.href = '/list';
        } else {
          localStorage.removeItem('username');
          localStorage.removeItem('password');
          alert('Failed to delete URL');
        }
      }
    </script>
  </main>
  ${footer}
</body>
</html>
`;

export { header, footer, rootHtml, listHtml };
