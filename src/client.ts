export default (hasCookie: boolean) => `<!doctype html>
  <html>
    <head>
      <title>arcjet</title>
      <style>
        h1 {
          text-align: center;
        }
        form {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        #file, #key {
          flex: 1;
          height: 100px;
        }
      </style>
    </head>
    <body>
      <h1>arcjet uploader</h1>
      ${
        hasCookie
          ? `
          <form method="post" action="/">
            <label for="file">file</label>
            <input type="file" id="file" name="file">
            <button>upload</button>
          </form>
        `
          : `
          <form method="post" action="/">
            <label for="key">file owner private key</label>
            <input type="file" id="key" name="key">
            <button>upload</button>
          </form>
        `
      }
    </body>
  </html>
`
