const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

let indexwindow
function createIndexWindow () {
  indexwindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    },
    show: false,
    icon: path.join(__dirname, 'images/picon.png')
  })

  indexwindow.loadFile('index.html')

  setMenu()
  indexwindow.once('ready-to-show', ()=>{
    indexwindow.show()
  })
}
function setMenu(){
  var menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
         {
            role: 'reload'
         }
      ]
   },
    {
      label: 'Edit',
      submenu: [
         {
            role: 'cut'
         },
         {
            role: 'copy'
         },
         {
            role: 'paste'
         }
      ]
   },
   {
     label: 'Tools',
     submenu: [
        {
           role: 'toggleDevTools'
        }
     ]
  },
   {
      label: 'About',
      click(){
        indexwindow.webContents.send("show-about-alertbox")
      }
   }
  ])
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(createIndexWindow)


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

