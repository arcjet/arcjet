import {Key} from './types'

export const homepage = (hasCookie: boolean) => `<!doctype html>
  <html>
    <head>
      <title>arcjet</title>
      <style>
        h1 {
          text-align: center;
        }
        body {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        #file {
          flex: 1;
          height: 100px;
          width: 310px;
        }
      </style>
    </head>
    <body>
      <h1>arcjet uploader</h1>
      ${
        hasCookie
          ? `
          <div class="tag">
            <label for="tag">tag for your data (up to 32 chars)</label>
            <input type="text" value="" id="tag" name="tag" maxlength="32" />
          </div>
          <form method="post" action="">
            <label for="file">file</label>
            <input type="file" id="file" name="file">
            <button>upload</button>
          </form>
        `
          : `
          <a href="/generate">generate your keys to use this database here!</a>
        `
      }
      <script>
        const tag = document.querySelector('#tag')
        const form = document.querySelector('form')
        form.setAttribute('action', '/store/' + tag.value)
        tag.onkeyup = () => {
          form.setAttribute('action', '/store/' + tag.value)
        }
        form.onsubmit = (evt) => {
          if (tag.value.length === 0) {
            evt.preventDefault()
            alert('Tag for data required')
          }
        }
      </script>
    </body>
  </html>
`

export const generate = (key: Key) => `<!doctype html>
  <html>
    <head>
      <title>arcjet</title>
      <style>
        dd {
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <h1>instructions</h1>
      <p>
        keep your private key somewhere safe, never share it.<br>
        it will be kept in your browser for convenience.<br>
      </p>
      <dl>
        <dt>your private key</dt>
        <dd>${key.privateKey}</dd>
        <dt>your public key</dt>
        <dd>${key.publicKey}</dd>
        <dt>your public key is stored here:</dt>
        <dd><a href="/store/${key.hash}">${key.hash}</a></dd>
      <dl>
    </body>
  </html>
`
