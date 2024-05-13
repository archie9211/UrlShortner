export const rootHtml = `
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Shortener</title>
    <style>
		body {
		  font-family: Arial, sans-serif;
		  background-color: #f4f4f4;
		  margin: 0;
		  padding: 0;
		}
	
		h1 {
		  text-align: center;
		  color: #333;
		}
	
		form {
		  max-width: 400px;
		  margin: 0 auto;
		  background-color: #fff;
		  padding: 20px;
		  border-radius: 5px;
		  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		}
	
		label {
		  display: block;
		  margin-bottom: 10px;
		  color: #666;
		}
	
		input[type="text"] {
		  width: calc(100% - 22px);
		  padding: 10px;
		  margin-bottom: 20px;
		  border: 1px solid #ccc;
		  border-radius: 3px;
		}
	
		button {
		  display: block;
		  width: 100%;
		  padding: 10px;
		  background-color: #007bff;
		  color: #fff;
		  border: none;
		  border-radius: 3px;
		  cursor: pointer;
		}
	
		button:hover {
		  background-color: #0056b3;
		}
	
		p {
		  text-align: center;
		  margin-top: 20px;
		}
	
		#shortened-url, #error-message {
		  font-weight: bold;
		}
	
		#error-message {
		  color: red;
		}
	  </style>
  </head>
  <body>
    <h1>URL Shortener</h1>
    <form id="form">
      <label for="url">Enter URL:</label>
      <input type="text" id="url" name="url" required>
      <button type="submit">Shorten</button>
    </form>
    <p id="shortened-url"></p>
    <p id="error-message"></p>
    <script>
    const form = document.getElementById('form');
const shortenedUrlElement = document.getElementById('shortened-url');
const errorMessageElement = document.getElementById('error-message');

form.addEventListener('submit', async (event) => {
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
    shortenedUrlElement.textContent = 'Shortened URL: ' + shortUrl;
    errorMessageElement.textContent = '';
  } else {
    const errorMessage = await response.text();
    shortenedUrlElement.textContent = '';
    errorMessageElement.textContent = errorMessage;
  }
});
    </script>
  </body>
  </html>
`;

export const listHtml = (urlList: string) => `
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Shortener - List URLs</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
    }
    h1 {
        text-align: center;
        color: #333;
    }
    ul {
        list-style: none;
        padding: 0;
        margin: 20px 0;
    }
    li {
        margin-bottom: 20px;
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    strong {
        display: block;
        margin-bottom: 10px;
    }
    a {
        color: #007bff;
        text-decoration: none;
    }
    button {
        background-color: #dc3545;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
    }
    button:hover {
        background-color: #c82333;
    }
  </style>
  </head>
  <body>
    <h1>URL Shortener - List URLs</h1>
    <ul>
      ${urlList}
    </ul>
   <script>
   // Function to delete a URL
			async function deleteUrl(slug) {
				const storedUsername = localStorage.getItem('username');
    			const storedPassword = localStorage.getItem('password');
				const headers = new Headers();
				if (storedUsername && storedPassword) {
					headers.append('X-Username', storedUsername);
					headers.append('X-Password', storedPassword);
				}
				else{
					const username = prompt('Enter your username:');
					const password = prompt('Enter your password:');
					localStorage.setItem('username', username);

					localStorage.setItem('password', password);

					// Construct the headers with username and password
					headers.append('Content-Type', 'application/json');
					headers.append('X-Username', username);
					headers.append('X-Password', password);
				}
				
				const response = await fetch('/delete/' + slug, { method: 'DELETE',headers: headers});
				if (response.ok) {
					// Reload the list page after a short delay
					window.location.href = '/list';
				} else {
					localStorage.removeItem('username');

					localStorage.removeItem('password');
					alert('Failed to delete URL');
				}
			}
    </script>
  </body>
  </html>
`;