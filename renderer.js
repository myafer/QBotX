// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


const ipcr = require('electron').ipcRenderer ;

ipcr.on('msg', (event, arg)=>{
    const message = `message reply: ${arg}` ;
    document.getElementById('msg-reply').innerHTML = message;
    alert(message);
});